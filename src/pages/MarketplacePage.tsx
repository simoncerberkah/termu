import { useMemo, useState } from 'react';
import {
  Heart,
  Home,
  MessageCircle,
  QrCode,
  Receipt,
  Scale,
  SearchX,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Store,
  Truck,
  Warehouse,
} from 'lucide-react';
import type {
  AppScreen,
  AuthSession,
  FarmDatabase,
  KandangPage,
  MarketplaceCatalogItem,
  MarketplaceOrder,
  SellerReview,
} from '../types/termu';
import { buildWhatsAppUrl, formatDateID, formatRp } from '../utils/format';
import {
  computeSellerReputation,
  inferSellerIdFromFarmName,
  resolveSellerProfile,
} from '../utils/sellers';
import { AnimalIllustration, BrandLogo } from '../components/BrandLogo';
import { Modal } from '../components/Modal';
import {
  SellerMiniStrip,
  SellerTrustBadge,
  type SellerModalTab,
} from '../components/SellerProfileModal';

interface MarketplacePageProps {
  db: FarmDatabase | null;
  session: AuthSession | null;
  catalog: MarketplaceCatalogItem[];
  favorites: string[];
  orders: MarketplaceOrder[];
  sellerReviews: SellerReview[];
  onToggleFavorite: (listingId: string) => void;
  onOpenCheckout: (item: MarketplaceCatalogItem) => void;
  onOpenPassport: (animalId: string) => void;
  onOpenSeller: (
    sellerId: string,
    opts?: { tab?: SellerModalTab; openReviewForm?: boolean; defaultAnimal?: string }
  ) => void;
  onNavigateScreen: (screen: AppScreen) => void;
  onGoKandangPage: (page: KandangPage) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function MarketplacePage({
  db,
  session,
  catalog,
  favorites,
  orders,
  sellerReviews,
  onToggleFavorite,
  onOpenCheckout,
  onOpenPassport,
  onOpenSeller,
  onNavigateScreen,
  onGoKandangPage,
  onToast,
}: MarketplacePageProps) {
  const [tab, setTab] = useState<'semua' | 'favorit' | 'pesanan' | 'lapak'>('semua');
  const [search, setSearch] = useState('');
  const [species, setSpecies] = useState('all');
  const [city, setCity] = useState('all');
  const [trustFilter, setTrustFilter] = useState<'all' | 'terpercaya' | 'rating45'>('all');
  const [sort, setSort] = useState('newest');
  const [minKg, setMinKg] = useState('');
  const [maxKg, setMaxKg] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const isOwner = session?.role === 'pemilik';
  const cities = useMemo(() => [...new Set(catalog.map((x) => x.city))].sort(), [catalog]);

  // Precompute seller profile + live reputation per sellerId
  const sellerMap = useMemo(() => {
    const uniqueIds = [...new Set(catalog.map((c) => c.sellerId))];
    const map = new Map<
      string,
      {
        seller: ReturnType<typeof resolveSellerProfile>;
        reputation: ReturnType<typeof computeSellerReputation>;
      }
    >();
    for (const sId of uniqueIds) {
      const seller = resolveSellerProfile(sId, db, catalog);
      const sellerListings = catalog.filter((c) => c.sellerId === sId);
      const reputation = computeSellerReputation(seller, sellerReviews, sellerListings);
      map.set(sId, { seller, reputation });
    }
    return map;
  }, [catalog, db, sellerReviews]);

  const activeExtraFilterCount = useMemo(() => {
    let n = 0;
    if (species !== 'all') n += 1;
    if (city !== 'all') n += 1;
    if (sort !== 'newest') n += 1;
    if (minKg !== '' || maxKg !== '') n += 1;
    return n;
  }, [species, city, sort, minKg, maxKg]);

  const filtered = useMemo(() => {
    const list = catalog.filter((item) => {
      if (tab === 'favorit' && !favorites.includes(item.id)) return false;
      if (tab === 'lapak' && !item.is_own_farm) return false;
      if (species !== 'all' && item.species !== species) return false;
      if (city !== 'all' && item.city !== city) return false;
      if (minKg !== '' && item.weight < Number(minKg)) return false;
      if (maxKg !== '' && item.weight > Number(maxKg)) return false;
      const rep = sellerMap.get(item.sellerId)?.reputation;
      if (trustFilter === 'terpercaya' && rep?.trustLevel !== 'terpercaya') return false;
      if (trustFilter === 'rating45' && (!rep || rep.averageRating < 4.5)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !`${item.name} ${item.animal_id} ${item.breed} ${item.farmName} ${item.location}`
            .toLowerCase()
            .includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    const sorted = [...list];
    if (sort === 'price_asc') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'pkg_asc') sorted.sort((a, b) => a.pricePerKg - b.pricePerKg);
    else if (sort === 'weight_desc') sorted.sort((a, b) => b.weight - a.weight);
    else if (sort === 'rating_desc') {
      sorted.sort((a, b) => {
        const ra = sellerMap.get(a.sellerId)?.reputation;
        const rb = sellerMap.get(b.sellerId)?.reputation;
        return (rb?.averageRating || 0) - (ra?.averageRating || 0) || (rb?.trustScore || 0) - (ra?.trustScore || 0);
      });
    } else if (sort === 'trust_desc') {
      sorted.sort((a, b) => {
        const ra = sellerMap.get(a.sellerId)?.reputation;
        const rb = sellerMap.get(b.sellerId)?.reputation;
        return (rb?.trustScore || 0) - (ra?.trustScore || 0);
      });
    } else {
      sorted.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    }
    return sorted;
  }, [catalog, tab, favorites, species, city, trustFilter, minKg, maxKg, search, sort, sellerMap]);

  const trustedCount = useMemo(
    () =>
      catalog.filter((item) => sellerMap.get(item.sellerId)?.reputation.trustLevel === 'terpercaya')
        .length,
    [catalog, sellerMap]
  );

  const comparedItems = useMemo(
    () =>
      compareIds
        .map((id) => catalog.find((c) => c.id === id))
        .filter((x): x is MarketplaceCatalogItem => Boolean(x)),
    [compareIds, catalog]
  );

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) {
        onToast('Maksimal 2 ternak untuk dibandingkan. Pilihan diperbarui.', 'info');
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Header 3-Zone Pasar TERMU — Compact on Mobile */}
      <header className="sticky top-0 z-40 px-3 sm:px-6 pt-2.5 pb-2 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onNavigateScreen('landing')}
            className="h-11 px-3 sm:px-3.5 rounded-full glass-pill hover:bg-white flex items-center transition shrink-0"
            aria-label="Kembali ke Beranda TERMU"
          >
            <BrandLogo height={21} color="#2B2B2B" />
          </button>

          <div className="flex items-center p-1 rounded-full glass-pill min-w-0">
            <button
              type="button"
              onClick={() => onNavigateScreen('kandang')}
              className="h-9 px-2.5 sm:px-4 rounded-full text-xs font-semibold text-[#5A5D64] hover:text-[#2B2B2B] inline-flex items-center gap-1.5 whitespace-nowrap transition"
            >
              <Warehouse className="w-3.5 h-3.5 shrink-0" />
              <span>
                <span className="hidden sm:inline">{session ? '' : 'Kelola '}</span>Kandang
              </span>
            </button>
            <button
              type="button"
              className="h-9 px-3 sm:px-4 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shadow-sm"
            >
              <Store className="w-3.5 h-3.5 text-[#F5D547] shrink-0" />
              <span>Pasar</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setTab(tab === 'pesanan' ? 'semua' : 'pesanan')}
              className="h-11 px-3 rounded-full glass-pill hover:bg-white text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5 transition"
              aria-label={`Lihat Pesanan Saya (${orders.length})`}
            >
              <Receipt className="w-4 h-4 shrink-0" />
              <span className="tabular-nums">{orders.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab(tab === 'favorit' ? 'semua' : 'favorit')}
              className="h-11 px-3 rounded-full glass-pill hover:bg-white text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5 transition"
              aria-label={`Lihat Favorit (${favorites.length})`}
            >
              <Heart className={`w-4 h-4 shrink-0 ${favorites.length ? 'fill-[#C93B36] text-[#C93B36]' : ''}`} />
              <span className="tabular-nums">{favorites.length}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-4 space-y-4 sm:space-y-5">
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-xs text-[#6E7178]">
              Profil Penjual Terverifikasi · Rating Pembeli · Paspor QR · data contoh
            </p>
            <h1 className="font-display text-2xl sm:text-4xl font-normal text-[#2B2B2B] mt-0.5">
              Pasar Ternak TERMU
            </h1>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-full glass-pill overflow-x-auto no-scrollbar self-start lg:self-auto max-w-full">
            <button
              type="button"
              onClick={() => setTab('semua')}
              className={`min-h-[38px] px-3.5 sm:px-4 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                tab === 'semua' ? 'bg-[#2B2B2B] text-white' : 'text-[#5A5D64] hover:text-[#2B2B2B]'
              }`}
            >
              Semua ({catalog.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('favorit')}
              className={`min-h-[38px] px-3.5 sm:px-4 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition ${
                tab === 'favorit' ? 'bg-[#2B2B2B] text-white' : 'text-[#5A5D64] hover:text-[#2B2B2B]'
              }`}
            >
              <Heart className="w-3.5 h-3.5" /> Favorit ({favorites.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('pesanan')}
              className={`min-h-[38px] px-3.5 sm:px-4 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition ${
                tab === 'pesanan' ? 'bg-[#2B2B2B] text-white' : 'text-[#5A5D64] hover:text-[#2B2B2B]'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" /> Pesanan ({orders.length})
            </button>
            {session && isOwner && (
              <button
                type="button"
                onClick={() => setTab('lapak')}
                className={`min-h-[38px] px-3.5 sm:px-4 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                  tab === 'lapak' ? 'bg-[#2B2B2B] text-white' : 'text-[#5A5D64] hover:text-[#2B2B2B]'
                }`}
              >
                Lapak Saya ({catalog.filter((x) => x.is_own_farm).length})
              </button>
            )}
          </div>
        </section>

        {tab === 'pesanan' ? (
          <section className="space-y-4">
            {orders.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {orders.map((ord) => {
                  const targetSellerId = ord.sellerId || inferSellerIdFromFarmName(ord.farmName);
                  return (
                    <article key={ord.orderCode} className="bento-card p-4 sm:p-5 space-y-3 text-xs">
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-black/[0.06]">
                        <div className="min-w-0">
                          <strong className="font-display text-base text-[#2B2B2B] block truncate">
                            {ord.orderCode}
                          </strong>
                          <span className="text-[#6E7178]">
                            {formatDateID(ord.createdAt)} · {ord.status}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-[#FBF6E3] text-[#2B2B2B] font-bold shrink-0">
                          {ord.deliveryMethod === 'delivery' ? 'Pengiriman Hewan' : 'Ambil Sendiri'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <strong className="text-sm text-[#2B2B2B] block">
                          {ord.animalName} ({ord.animalId}) — {ord.species} {ord.breed} ({ord.weight} kg)
                        </strong>
                        <div className="text-[#5A5D64]">
                          Kandang:{' '}
                          <button
                            type="button"
                            onClick={() => onOpenSeller(targetSellerId)}
                            className="font-bold text-[#2B2B2B] underline decoration-[#F5D547] decoration-2 underline-offset-2"
                          >
                            {ord.farmName}
                          </button>{' '}
                          ({ord.farmLocation})
                        </div>
                        <div className="text-[#5A5D64]">
                          Pemesan: <strong>{ord.buyerName}</strong> ({ord.buyerPhone})
                        </div>
                        <div className="text-[#6E7178]">
                          {ord.deliveryMethod === 'delivery'
                            ? `${ord.fleetName} → ${ord.regionName} · ${ord.address}`
                            : ord.address}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl glass-tile space-y-1 tabular-nums">
                        <div className="flex justify-between text-[#5A5D64]">
                          <span>Harga Ternak</span>
                          <span>{formatRp(ord.itemPrice)}</span>
                        </div>
                        <div className="flex justify-between text-[#5A5D64]">
                          <span>Biaya Pengiriman</span>
                          <span>{formatRp(ord.shippingFee)}</span>
                        </div>
                        <div className="flex justify-between text-[#5A5D64]">
                          <span>Biaya Layanan</span>
                          <span>{formatRp(ord.serviceFee)}</span>
                        </div>
                        <div className="pt-1.5 border-t border-black/[0.06] flex justify-between font-bold text-[#2B2B2B] text-sm">
                          <span>Total Tagihan</span>
                          <span>{formatRp(ord.totalAmount)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onOpenSeller(targetSellerId, {
                              tab: 'ulasan',
                              openReviewForm: true,
                              defaultAnimal: `${ord.animalName} (${ord.animalId})`,
                            })
                          }
                          className="btn-touch w-full rounded-full glass-accent text-[#2B2B2B] font-bold inline-flex items-center justify-center gap-1.5"
                        >
                          <Star className="w-4 h-4 fill-[#2B2B2B]" /> Beri Rating &amp; Ulasan
                        </button>
                        <a
                          href={buildWhatsAppUrl(
                            ord.farmPhone,
                            `Halo ${ord.farmName}, saya ingin konfirmasi pesanan ${ord.orderCode} untuk ${ord.animalName} (${ord.animalId}), metode ${ord.deliveryMethod === 'delivery' ? ord.fleetName : 'Ambil Sendiri'}, total ${formatRp(ord.totalAmount)}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-touch w-full rounded-full bg-[#1D6E42] hover:bg-[#165934] text-white font-semibold inline-flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="w-4 h-4" /> Konfirmasi WA
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="bento-card p-8 sm:p-10 text-center">
                <div className="w-14 h-14 rounded-full glass-tile flex items-center justify-center mx-auto mb-3 text-[#2B2B2B]">
                  <Receipt className="w-6 h-6" />
                </div>
                <h2 className="font-display text-xl font-medium text-[#2B2B2B]">Belum ada pesanan tersimpan</h2>
                <p className="text-xs text-[#6E7178] mt-1 mb-5">
                  Pilih ternak di Pasar TERMU lalu tekan &ldquo;Pesan / Checkout&rdquo; untuk memilih pengiriman hewan atau ambil sendiri.
                </p>
                <button
                  type="button"
                  onClick={() => setTab('semua')}
                  className="btn-touch px-6 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold"
                >
                  Jelajah Katalog Ternak
                </button>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Bar Pencarian, Trust Filter & Filter Collapsible untuk Mobile */}
            <section className="bento-card p-3 sm:p-4 space-y-2.5">
              {/* Row 1: Search + Mobile Filter Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  aria-label="Cari ternak atau kandang"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari ras, nama ternak, atau nama kandang..."
                  className="flex-1 min-w-0 h-11 px-4 rounded-full glass-tile text-xs text-[#2B2B2B]"
                />
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen((v) => !v)}
                  className={`sm:hidden btn-touch px-3.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition ${
                    mobileFiltersOpen || activeExtraFilterCount > 0
                      ? 'bg-[#2B2B2B] text-white'
                      : 'glass-tile text-[#2B2B2B]'
                  }`}
                  aria-expanded={mobileFiltersOpen}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filter{activeExtraFilterCount > 0 ? ` (${activeExtraFilterCount})` : ''}</span>
                </button>
              </div>

              {/* Row 2: Quick Trust & Rating Segmented Filter (Fits cleanly on 390px mobile) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                <button
                  type="button"
                  onClick={() => setTrustFilter('all')}
                  className={`min-h-[38px] px-3 sm:px-3.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                    trustFilter === 'all'
                      ? 'bg-[#2B2B2B] text-white'
                      : 'glass-tile text-[#5A5D64] hover:text-[#2B2B2B]'
                  }`}
                >
                  Semua Toko
                </button>
                <button
                  type="button"
                  onClick={() => setTrustFilter('terpercaya')}
                  className={`min-h-[38px] px-3 sm:px-3.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1 transition ${
                    trustFilter === 'terpercaya'
                      ? 'bg-[#145C36] text-white'
                      : 'glass-tile text-[#145C36] hover:bg-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    <span className="hidden sm:inline">Toko </span>Terpercaya ({trustedCount})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTrustFilter('rating45')}
                  className={`min-h-[38px] px-3 sm:px-3.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1 transition ${
                    trustFilter === 'rating45'
                      ? 'bg-[#2B2B2B] text-[#F5D547]'
                      : 'glass-tile text-[#2B2B2B] hover:bg-white'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B] shrink-0" />
                  <span>Rating ≥ 4,5</span>
                </button>
              </div>

              {/* Row 3: Extra Filters — Collapsible on Mobile, Always Open on sm+ */}
              <div
                className={`${
                  mobileFiltersOpen ? 'grid' : 'hidden sm:grid'
                } grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1`}
              >
                <select
                  aria-label="Filter jenis ternak"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  className="h-11 px-3.5 rounded-full glass-tile text-xs text-[#2B2B2B]"
                >
                  <option value="all">Semua Jenis</option>
                  <option value="Sapi">Sapi Potong</option>
                  <option value="Kambing">Kambing</option>
                  <option value="Domba">Domba</option>
                </select>
                <select
                  aria-label="Filter wilayah"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-11 px-3.5 rounded-full glass-tile text-xs text-[#2B2B2B]"
                >
                  <option value="all">Semua Wilayah</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Urutkan katalog"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-11 px-3.5 rounded-full glass-tile text-xs text-[#2B2B2B]"
                >
                  <option value="newest">Urutkan: Terbaru</option>
                  <option value="rating_desc">Rating Toko Tertinggi</option>
                  <option value="trust_desc">Paling Terpercaya</option>
                  <option value="pkg_asc">Harga/kg Termurah</option>
                  <option value="price_asc">Harga Total Termurah</option>
                  <option value="weight_desc">Bobot Terbesar</option>
                </select>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    aria-label="Bobot minimum kg"
                    value={minKg}
                    onChange={(e) => setMinKg(e.target.value)}
                    placeholder="Min kg"
                    className="w-1/2 h-11 px-3 rounded-full glass-tile text-xs text-[#2B2B2B]"
                  />
                  <input
                    type="number"
                    aria-label="Bobot maksimum kg"
                    value={maxKg}
                    onChange={(e) => setMaxKg(e.target.value)}
                    placeholder="Max kg"
                    className="w-1/2 h-11 px-3 rounded-full glass-tile text-xs text-[#2B2B2B]"
                  />
                </div>
              </div>
            </section>

            {/* Info Transparan Pengiriman & Lapak */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5A5D64] px-1">
              <span className="inline-flex items-start sm:items-center gap-1.5 leading-relaxed">
                <Truck className="w-4 h-4 text-[#2B2B2B] shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  Menampilkan <strong className="text-[#2B2B2B]">{filtered.length} ekor</strong> · Ketuk nama
                  kandang untuk cek profil, rating &amp; status kepercayaan toko.
                </span>
              </span>
              {session && isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    onGoKandangPage('ternak');
                    onToast('Pilih ternak lalu klik "Tandai Siap Jual" untuk menampilkannya di Pasar TERMU.', 'info');
                  }}
                  className="btn-touch px-3.5 rounded-full glass-accent text-[#2B2B2B] font-bold text-[11px]"
                >
                  + Pasang Ternak Kandang ke Pasar
                </button>
              )}
            </div>

            {/* Grid Katalog */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filtered.length > 0 ? (
                filtered.map((item) => {
                  const isFav = favorites.includes(item.id);
                  const isCmp = compareIds.includes(item.id);
                  const sellerEntry = sellerMap.get(item.sellerId);
                  return (
                    <article
                      key={item.id}
                      className={`bento-card overflow-hidden flex flex-col justify-between ${
                        isCmp ? 'ring-2 ring-[#2B2B2B]' : ''
                      }`}
                    >
                      <div>
                        <div className="h-44 relative bg-[#EAE5DC]">
                          {item.photo ? (
                            <img
                              src={item.photo}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <AnimalIllustration species={item.species} breed={item.breed} />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                          <div className="absolute top-2.5 right-2.5">
                            <button
                              type="button"
                              onClick={() => onToggleFavorite(item.id)}
                              className="w-11 h-11 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition"
                              aria-label={isFav ? `Hapus ${item.name} dari favorit` : `Simpan ${item.name} ke favorit`}
                            >
                              <Heart
                                className={`w-4 h-4 ${isFav ? 'fill-[#C93B36] text-[#C93B36]' : 'text-[#2B2B2B]'}`}
                              />
                            </button>
                          </div>
                          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between text-white gap-2">
                            <div className="min-w-0">
                              <div className="font-display text-xl font-medium leading-tight truncate">
                                {item.name}{' '}
                                <span className="text-xs font-normal text-white/80">({item.animal_id})</span>
                              </div>
                              <div className="text-[11px] text-white/85 truncate">
                                {item.species} {item.breed} · {item.sex} · {item.ageLabel}
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full glass-accent text-[#2B2B2B] text-xs font-bold shrink-0 tabular-nums">
                              {item.weight} kg
                            </span>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          <div className="text-[11px] text-[#5A5D64] flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span
                              className={
                                item.withdrawalFree
                                  ? 'font-semibold text-[#1D6E42]'
                                  : 'font-semibold text-[#9E2420]'
                              }
                            >
                              {item.withdrawalFree ? 'Bebas Residu Obat' : 'Masa Henti Obat'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums font-semibold text-[#1D6E42]">
                              +{item.pbbh} kg/hr
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{item.verifiedRecords}x timbang</span>
                          </div>

                          <div className="flex items-end justify-between gap-2 pb-2.5 border-b border-black/[0.06] tabular-nums">
                            <div className="min-w-0">
                              <span className="text-[11px] text-[#6E7178] block">Harga Penawaran</span>
                              <div className="font-display text-2xl font-semibold text-[#2B2B2B] leading-tight">
                                {formatRp(item.price)}
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-[#5A5D64] shrink-0">
                              {formatRp(item.pricePerKg)}/kg
                            </span>
                          </div>

                          {/* Shopee-Style Clickable Seller Strip */}
                          {sellerEntry && (
                            <SellerMiniStrip
                              seller={sellerEntry.seller}
                              reputation={sellerEntry.reputation}
                              onOpenSeller={() => onOpenSeller(item.sellerId)}
                            />
                          )}

                          <p className="text-xs text-[#5A5D64] line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 pb-4 space-y-2">
                        <button
                          type="button"
                          onClick={() => onOpenCheckout(item)}
                          disabled={!item.withdrawalFree}
                          className="btn-touch w-full rounded-full bg-[#2B2B2B] hover:bg-black disabled:opacity-45 text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
                        >
                          <ShoppingBag className="w-4 h-4 text-[#F5D547]" />
                          <span>{item.withdrawalFree ? 'Pesan / Checkout' : 'Tertahan Masa Henti Obat'}</span>
                        </button>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => toggleCompare(item.id)}
                            className={`btn-touch rounded-full text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition ${
                              isCmp ? 'bg-[#2B2B2B] text-[#F5D547]' : 'glass-tile hover:bg-white text-[#2B2B2B]'
                            }`}
                          >
                            <Scale className="w-3.5 h-3.5" />
                            <span>{isCmp ? 'Dipilih' : 'Banding'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenPassport(item.animal_id)}
                            className="btn-touch rounded-full glass-tile hover:bg-white text-[11px] font-semibold text-[#2B2B2B] inline-flex items-center justify-center gap-1"
                          >
                            <QrCode className="w-3.5 h-3.5" /> Paspor
                          </button>
                          <a
                            href={buildWhatsAppUrl(
                              item.phone,
                              `Halo ${item.farmName}, saya melihat ${item.name} (${item.animal_id}, ${item.weight} kg, ${formatRp(item.price)}) di Pasar TERMU. Apakah masih tersedia?`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-touch rounded-full bg-[#E7F6EC] hover:bg-[#d5f0de] text-[#1D6E42] text-[11px] font-semibold inline-flex items-center justify-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WA
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="sm:col-span-2 lg:col-span-3 bento-card p-8 sm:p-10 text-center">
                  <div className="w-14 h-14 rounded-full glass-tile flex items-center justify-center mx-auto mb-3 text-[#2B2B2B]">
                    {tab === 'favorit' ? <Heart className="w-6 h-6" /> : <SearchX className="w-6 h-6" />}
                  </div>
                  <h2 className="font-display text-xl font-medium text-[#2B2B2B]">
                    {tab === 'favorit' ? 'Belum ada ternak favorit' : 'Tidak ada ternak yang cocok'}
                  </h2>
                  <p className="text-xs text-[#6E7178] mt-1 mb-5">
                    {tab === 'favorit'
                      ? 'Ketuk ikon hati pada kartu ternak di katalog untuk menyimpannya.'
                      : 'Coba longgarkan filter kepercayaan toko, wilayah, jenis, atau rentang bobot.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('semua');
                      setSearch('');
                      setSpecies('all');
                      setCity('all');
                      setTrustFilter('all');
                      setSort('newest');
                      setMinKg('');
                      setMaxKg('');
                    }}
                    className="btn-touch px-6 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold"
                  >
                    Reset Semua Filter
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Compare Floating Bar — Lifted Above Mobile Bottom Dock */}
      {comparedItems.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-4 left-3 right-3 z-50 flex justify-center pointer-events-none no-print">
          <div className="pointer-events-auto w-full max-w-2xl compare-dock rounded-2xl sm:rounded-full px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2.5 text-white animate-modal">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 rounded-full bg-[#F5D547] text-[#2B2B2B] flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">
                  Bandingkan ({comparedItems.length}/2): {comparedItems.map((x) => x.name).join(' vs ')}
                </div>
                <div className="text-[10px] text-white/65 truncate">
                  {comparedItems.length < 2
                    ? 'Pilih 1 ternak lagi untuk membandingkan'
                    : 'Siap dibandingkan berdampingan'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="min-h-[38px] px-2.5 sm:px-3 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-semibold"
              >
                Reset
              </button>
              <button
                type="button"
                disabled={comparedItems.length < 2}
                onClick={() => setCompareOpen(true)}
                className="min-h-[38px] px-3.5 sm:px-4 rounded-full bg-[#F5D547] hover:bg-[#EBC934] disabled:opacity-45 text-[#2B2B2B] text-xs font-bold whitespace-nowrap"
              >
                Bandingkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bandingkan 2 Ternak */}
      <Modal
        open={compareOpen && comparedItems.length === 2}
        title="Bandingkan 2 Ternak"
        subtitle="Sorotan hijau menandakan bobot, pertumbuhan, rating, atau harga/kg yang lebih unggul"
        maxWidth="max-w-2xl"
        onClose={() => setCompareOpen(false)}
      >
        {comparedItems.length === 2 && (() => {
          const [a, b] = comparedItems;
          const repA = sellerMap.get(a.sellerId)?.reputation;
          const repB = sellerMap.get(b.sellerId)?.reputation;
          const cheaperKg = a.pricePerKg < b.pricePerKg ? 'a' : b.pricePerKg < a.pricePerKg ? 'b' : 'tie';
          const heavier = a.weight > b.weight ? 'a' : b.weight > a.weight ? 'b' : 'tie';
          const faster = a.pbbh > b.pbbh ? 'a' : b.pbbh > a.pbbh ? 'b' : 'tie';
          const higherTrust =
            (repA?.trustScore || 0) > (repB?.trustScore || 0)
              ? 'a'
              : (repB?.trustScore || 0) > (repA?.trustScore || 0)
              ? 'b'
              : 'tie';

          const rows: Array<[string, string, string, 'a' | 'b' | 'tie']> = [
            ['Kandang & Kota', `${a.farmName} (${a.city})`, `${b.farmName} (${b.city})`, 'tie'],
            [
              'Reputasi Toko',
              repA ? `★ ${repA.averageRating.toFixed(1)} · ${repA.trustShortLabel}` : '—',
              repB ? `★ ${repB.averageRating.toFixed(1)} · ${repB.trustShortLabel}` : '—',
              higherTrust,
            ],
            ['Jenis / Ras', `${a.species} ${a.breed}`, `${b.species} ${b.breed}`, 'tie'],
            ['Bobot Terkini', `${a.weight} kg`, `${b.weight} kg`, heavier],
            ['Pertumbuhan (PBBH)', `+${a.pbbh} kg/hari`, `+${b.pbbh} kg/hari`, faster],
            ['Harga Penawaran', formatRp(a.price), formatRp(b.price), 'tie'],
            ['Harga per Kg Hidup', `${formatRp(a.pricePerKg)}/kg`, `${formatRp(b.pricePerKg)}/kg`, cheaperKg],
            [
              'Bebas Residu Obat',
              a.withdrawalFree ? 'Ya (Aman)' : 'Masa Henti Obat',
              b.withdrawalFree ? 'Ya (Aman)' : 'Masa Henti Obat',
              'tie',
            ],
          ];
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {[a, b].map((it) => {
                  const rep = sellerMap.get(it.sellerId)?.reputation;
                  return (
                    <div key={it.id} className="rounded-2xl sm:rounded-3xl overflow-hidden glass-tile">
                      <div className="h-24 sm:h-28 relative bg-[#EAE5DC]">
                        {it.photo ? (
                          <img
                            src={it.photo}
                            alt={it.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <AnimalIllustration species={it.species} breed={it.breed} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                          <div className="font-display text-sm sm:text-base font-semibold leading-tight truncate">
                            {it.name}
                          </div>
                          <div className="text-[10px] text-white/80">
                            {it.animal_id} · {it.weight} kg
                          </div>
                        </div>
                      </div>
                      {rep && (
                        <div className="p-2 flex items-center justify-between gap-1">
                          <SellerTrustBadge level={rep.trustLevel} compact />
                          <button
                            type="button"
                            onClick={() => {
                              setCompareOpen(false);
                              onOpenSeller(it.sellerId);
                            }}
                            className="text-[10px] font-bold text-[#2B2B2B] underline"
                          >
                            Profil
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl overflow-hidden border border-black/[0.07] bg-white/80 text-[11px] sm:text-xs tabular-nums">
                {rows.map(([label, valA, valB, win], i) => (
                  <div
                    key={label}
                    className={`grid grid-cols-12 items-center ${
                      i % 2 === 0 ? 'bg-white/60' : 'bg-[#FBF6E3]/35'
                    } border-b border-black/[0.04] last:border-b-0`}
                  >
                    <div className="col-span-4 px-2.5 sm:px-3 py-2 sm:py-2.5 font-medium text-[#6E7178]">
                      {label}
                    </div>
                    <div
                      className={`col-span-4 px-2.5 sm:px-3 py-2 sm:py-2.5 font-semibold break-words ${
                        win === 'a' ? 'text-[#1D6E42] bg-[#E7F6EC]/70' : 'text-[#2B2B2B]'
                      }`}
                    >
                      {valA}
                    </div>
                    <div
                      className={`col-span-4 px-2.5 sm:px-3 py-2 sm:py-2.5 font-semibold break-words ${
                        win === 'b' ? 'text-[#1D6E42] bg-[#E7F6EC]/70' : 'text-[#2B2B2B]'
                      }`}
                    >
                      {valB}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setCompareOpen(false);
                    onOpenCheckout(a);
                  }}
                  className="btn-touch rounded-full bg-[#2B2B2B] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4 text-[#F5D547]" /> Pesan {a.name}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCompareOpen(false);
                    onOpenCheckout(b);
                  }}
                  className="btn-touch rounded-full glass-accent text-[#2B2B2B] text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" /> Pesan {b.name}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Mobile Floating Liquid Glass Bottom Dock — Quick Switch Pasar & Kandang */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1 pointer-events-none no-print"
        aria-label="Navigasi cepat Pasar TERMU"
      >
        <div className="pointer-events-auto max-w-md mx-auto h-16 px-2 rounded-full glass-dock grid grid-cols-5 items-center">
          <button
            type="button"
            onClick={() => onNavigateScreen('landing')}
            className="h-12 rounded-full flex flex-col items-center justify-center gap-0.5 text-[#6E7178] font-medium transition"
          >
            <Home className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-none">Beranda</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('semua')}
            className={`h-12 rounded-full flex flex-col items-center justify-center gap-0.5 transition ${
              tab === 'semua' || tab === 'lapak'
                ? 'bg-[#2B2B2B]/[0.09] text-[#2B2B2B] font-bold'
                : 'text-[#6E7178] font-medium'
            }`}
          >
            <Store className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-none">Pasar</span>
          </button>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => onNavigateScreen('kandang')}
              className="w-[52px] h-[52px] -mt-6 rounded-full bg-[#2B2B2B] text-[#F5D547] shadow-[0_10px_24px_rgba(43,43,43,0.32)] flex items-center justify-center border-[3px] border-white/95 active:scale-95 transition"
              aria-label="Pindah ke Manajemen Kandang"
            >
              <Warehouse className="w-5 h-5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setTab('favorit')}
            className={`relative h-12 rounded-full flex flex-col items-center justify-center gap-0.5 transition ${
              tab === 'favorit'
                ? 'bg-[#2B2B2B]/[0.09] text-[#2B2B2B] font-bold'
                : 'text-[#6E7178] font-medium'
            }`}
          >
            <Heart className={`w-[18px] h-[18px] ${favorites.length > 0 && tab === 'favorit' ? 'fill-[#C93B36] text-[#C93B36]' : ''}`} />
            <span className="text-[10px] leading-none">Favorit</span>
            {favorites.length > 0 && (
              <span className="absolute top-1.5 right-3 min-w-[15px] h-[15px] px-1 rounded-full bg-[#C93B36] text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                {favorites.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab('pesanan')}
            className={`relative h-12 rounded-full flex flex-col items-center justify-center gap-0.5 transition ${
              tab === 'pesanan'
                ? 'bg-[#2B2B2B]/[0.09] text-[#2B2B2B] font-bold'
                : 'text-[#6E7178] font-medium'
            }`}
          >
            <Receipt className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-none">Pesanan</span>
            {orders.length > 0 && (
              <span className="absolute top-1.5 right-3 min-w-[15px] h-[15px] px-1 rounded-full bg-[#2B2B2B] text-[#F5D547] text-[9px] font-bold flex items-center justify-center tabular-nums">
                {orders.length}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}
