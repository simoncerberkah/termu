import {
  ArrowRight,
  ArrowUpRight,
  ClipboardCheck,
  Crown,
  HeartPulse,
  Home,
  MessageCircle,
  QrCode,
  Scale,
  ShoppingBag,
  Sparkles,
  Store,
  Warehouse,
  Wheat,
} from 'lucide-react';
import type {
  AppScreen,
  AuthSession,
  FarmDatabase,
  MarketplaceCatalogItem,
  SellerReview,
  SubscriptionTier,
} from '../types/termu';
import { formatRp } from '../utils/format';
import { computeSellerReputation, resolveSellerProfile } from '../utils/sellers';
import { AnimalIllustration, BrandLogo } from '../components/BrandLogo';
import { PricingCardsSection } from '../components/SubscriptionModal';
import { SellerMiniStrip, type SellerModalTab } from '../components/SellerProfileModal';

interface LandingPageProps {
  db: FarmDatabase | null;
  session: AuthSession | null;
  currentTier?: SubscriptionTier;
  catalog: MarketplaceCatalogItem[];
  sellerReviews: SellerReview[];
  favoriteCount: number;
  onNavigateScreen: (screen: AppScreen) => void;
  onStartDemo: () => void;
  onOpenPassport: (animalId: string) => void;
  onOpenCheckout: (item: MarketplaceCatalogItem) => void;
  onOpenSeller: (sellerId: string, opts?: { tab?: SellerModalTab }) => void;
  onSelectLandingPlan: (tier: SubscriptionTier) => void;
}

export function LandingPage({
  db,
  session,
  currentTier,
  catalog,
  sellerReviews,
  favoriteCount,
  onNavigateScreen,
  onStartDemo,
  onOpenPassport,
  onOpenCheckout,
  onOpenSeller,
  onSelectLandingPlan,
}: LandingPageProps) {
  const showcase = catalog.slice(0, 4);
  const citiesCount = new Set(catalog.map((c) => c.city)).size;

  return (
    <div className="min-h-screen hero-mesh pb-28 md:pb-16">
      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 px-3 sm:px-6 pt-3 pb-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onNavigateScreen('landing')}
            className="h-11 px-4 rounded-full glass-pill hover:bg-white flex items-center transition shrink-0"
            aria-label="Beranda TERMU"
          >
            <BrandLogo height={24} color="#2B2B2B" />
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#5A5D64]" aria-label="Navigasi Super App">
            <button
              type="button"
              onClick={() => onNavigateScreen('landing')}
              className="text-[#2B2B2B] font-semibold underline decoration-[#F5D547] decoration-2 underline-offset-4 whitespace-nowrap shrink-0"
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => onNavigateScreen('marketplace')}
              className="hover:text-[#2B2B2B] transition whitespace-nowrap shrink-0"
            >
              Pasar TERMU
            </button>
            <button
              type="button"
              onClick={() => onNavigateScreen('kandang')}
              className="hover:text-[#2B2B2B] transition whitespace-nowrap shrink-0"
            >
              Kelola Kandang
            </button>
            <a
              href="#paket-harga"
              className="hover:text-[#2B2B2B] transition whitespace-nowrap shrink-0"
            >
              Paket &amp; Harga
            </a>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {session ? (
              <button
                type="button"
                onClick={() => onNavigateScreen('kandang')}
                className="btn-touch h-10 px-4 rounded-full bg-[#2B2B2B] hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <span>Dashboard ({session.name.split(' ')[0]})</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#F5D547]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateScreen('login')}
                className="btn-touch h-10 px-5 rounded-full bg-[#2B2B2B] hover:bg-black text-white text-xs font-semibold whitespace-nowrap shrink-0 transition"
              >
                Masuk Kandang
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-5 sm:pt-8 space-y-10 sm:space-y-14">
        {/* Hero Editorial + 2 Pintu Utama */}
        <section className="space-y-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold text-[#5A5D64] mb-3">
              Super App Peternakan Indonesia · Manajemen Kandang &amp; Pasar Ternak
            </p>
            <h1 className="font-display text-3xl sm:text-5xl lg:text-[56px] font-medium text-[#2B2B2B] leading-[1.08] tracking-tight text-balance">
              Satu ekosistem dari{' '}
              <span className="underline decoration-[#F5D547] decoration-[5px] underline-offset-4">catatan kandang</span>{' '}
              sampai <span className="italic font-light">pasar ternak</span>.
            </h1>
            <p className="text-sm sm:text-base text-[#5A5D64] mt-4 max-w-2xl leading-relaxed">
              Kelola bobot, ransum pakan, kesehatan, dan kas peternakan dengan rapi—atau langsung jelajahi Pasar TERMU
              untuk memesan sapi dan kambing ber-Paspor QR dengan pilihan pengiriman hewan maupun ambil sendiri ke kandang.
            </p>
          </div>

          {/* 2 Pintu Utama Bento */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Pintu 1: Manajemen Kandang */}
            <div className="lg:col-span-7 bento-card-dark p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden min-h-[320px]">
              <div className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full bg-[#F5D547]/15 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 text-xs text-white/70 mb-4">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#F5D547]">
                    <Warehouse className="w-4 h-4" /> Pintu 1 · Untuk Peternak &amp; Pekerja
                  </span>
                  <span>Login / Mode Demo</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-medium text-white leading-tight">
                  Manajemen Kandang TERMU
                </h2>
                <p className="text-xs sm:text-sm text-white/75 mt-2.5 max-w-xl leading-relaxed">
                  Pantau pertumbuhan bobot (PBBH), racik ransum PK/TDN, hitung bobot Schoorl &amp; HPP, pantau masa
                  henti obat, skrining foto AI, laporan WhatsApp, hingga prediksi AI langsung dari HP di kandang.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 text-xs text-white/90">
                  <div className="py-2 flex items-center gap-2 border-t border-white/10">
                    <Scale className="w-3.5 h-3.5 text-[#F5D547] shrink-0" />
                    <span className="truncate">Bobot &amp; Schoorl</span>
                  </div>
                  <div className="py-2 flex items-center gap-2 border-t border-white/10">
                    <Wheat className="w-3.5 h-3.5 text-[#F5D547] shrink-0" />
                    <span className="truncate">Mixer Ransum</span>
                  </div>
                  <div className="py-2 flex items-center gap-2 border-t border-white/10">
                    <HeartPulse className="w-3.5 h-3.5 text-[#F5D547] shrink-0" />
                    <span className="truncate">Skrining AI</span>
                  </div>
                  <div className="py-2 flex items-center gap-2 border-t border-white/10">
                    <Sparkles className="w-3.5 h-3.5 text-[#F5D547] shrink-0" />
                    <span className="truncate">Prediksi AI</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigateScreen('kandang')}
                  className="btn-touch px-6 rounded-full glass-accent hover:brightness-95 text-[#2B2B2B] text-xs sm:text-sm font-bold inline-flex items-center gap-2"
                >
                  <span>{session ? 'Lanjut ke Dashboard Kandang' : 'Masuk ke Kandang'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                {!session && (
                  <button
                    type="button"
                    onClick={onStartDemo}
                    className="btn-touch px-5 rounded-full bg-white/12 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition"
                  >
                    <Sparkles className="w-4 h-4 text-[#F5D547]" /> Coba Mode Demo
                  </button>
                )}
              </div>
            </div>

            {/* Pintu 2: Pasar TERMU */}
            <div className="lg:col-span-5 bento-card p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden min-h-[320px]">
              <div className="pointer-events-none absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-[#F5D547]/28 blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 text-xs mb-4">
                  <span className="inline-flex items-center gap-1.5 font-bold text-[#2B2B2B]">
                    <Store className="w-4 h-4" /> Pintu 2 · Pembeli &amp; Pedagang
                  </span>
                  <span className="font-semibold text-[#1D6E42]">Tanpa Login</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-medium text-[#2B2B2B] leading-tight">
                  Pasar Ternak TERMU
                </h2>
                <p className="text-xs sm:text-sm text-[#5A5D64] mt-2.5 leading-relaxed">
                  Bandingkan 2 ternak berdampingan, cek harga/kg bobot hidup, pindai Paspor QR, dan langsung pesan
                  dengan layanan kirim hewan atau ambil sendiri ke kandang (Rp 0 biaya layanan).
                </p>

                <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-black/[0.06] tabular-nums">
                  <div>
                    <div className="font-metric text-3xl text-[#2B2B2B]">{catalog.length}</div>
                    <div className="text-[11px] text-[#6E7178] mt-0.5">Ternak contoh</div>
                  </div>
                  <div>
                    <div className="font-metric text-3xl text-[#2B2B2B]">{citiesCount}</div>
                    <div className="text-[11px] text-[#6E7178] mt-0.5">Area Jateng</div>
                  </div>
                  <div>
                    <div className="font-metric text-3xl text-[#2B2B2B]">{favoriteCount}</div>
                    <div className="text-[11px] text-[#6E7178] mt-0.5">Favorit Anda</div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-7">
                <button
                  type="button"
                  onClick={() => onNavigateScreen('marketplace')}
                  className="btn-touch w-full px-6 rounded-full bg-[#2B2B2B] hover:bg-black text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Jelajah Pasar Ternak</span>
                  <ArrowUpRight className="w-4 h-4 text-[#F5D547]" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Etalase 4 Ternak Pilihan */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[#6E7178]">Etalase Langsung · data contoh</p>
              <h2 className="font-display text-2xl sm:text-3xl font-medium text-[#2B2B2B] mt-0.5">
                Ternak Siap Jual dengan Paspor QR
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateScreen('marketplace')}
              className="btn-touch px-5 rounded-full glass-pill hover:bg-white text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>Lihat Semua ({catalog.length} ekor)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {showcase.map((item) => {
              const seller = resolveSellerProfile(item.sellerId, db, catalog);
              const reputation = computeSellerReputation(
                seller,
                sellerReviews,
                catalog.filter((c) => c.sellerId === item.sellerId)
              );
              return (
                <article key={item.id} className="bento-card overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="h-44 relative bg-[#EAE5DC]">
                      {item.photo ? (
                        <img src={item.photo} alt={item.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        <AnimalIllustration species={item.species} breed={item.breed} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                      <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between text-white gap-2">
                        <div className="min-w-0">
                          <div className="font-display text-lg font-medium leading-tight truncate">{item.name}</div>
                          <div className="text-[11px] text-white/85 truncate">
                            {item.breed} · {item.city}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full glass-accent text-[#2B2B2B] text-xs font-bold shrink-0 tabular-nums">
                          {item.weight} kg
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2.5">
                      <div className="text-[11px] text-[#6E7178] flex items-center justify-between gap-1">
                        <span>{item.withdrawalFree ? 'Bebas Residu Obat' : 'Masa Henti Obat'}</span>
                        <span className="shrink-0 font-semibold text-[#1D6E42] tabular-nums">+{item.pbbh} kg/hr</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2 tabular-nums">
                        <strong className="font-display text-lg font-semibold text-[#2B2B2B]">
                          {formatRp(item.price)}
                        </strong>
                        <span className="text-[11px] font-medium text-[#6E7178]">{formatRp(item.pricePerKg)}/kg</span>
                      </div>
                      <SellerMiniStrip
                        seller={seller}
                        reputation={reputation}
                        compact
                        onOpenSeller={() => onOpenSeller(item.sellerId)}
                      />
                    </div>
                  </div>
                  <div className="px-4 pb-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenPassport(item.animal_id)}
                      className="btn-touch px-3.5 rounded-full glass-tile hover:bg-white text-xs font-semibold text-[#2B2B2B] inline-flex items-center justify-center gap-1"
                      aria-label={`Lihat Paspor QR ${item.name}`}
                    >
                      <QrCode className="w-3.5 h-3.5" /> QR
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenCheckout(item)}
                      className="btn-touch flex-1 rounded-full bg-[#2B2B2B] hover:bg-black text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[#F5D547]" /> Pesan
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 3 Pilar Transparansi */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              step: '01',
              icon: ClipboardCheck,
              title: 'Dicatat Rutin di Kandang',
              desc: 'Setiap penimbangan, pemberian ransum, dan jadwal vaksin tercatat oleh pemilik atau pekerja langsung lewat HP.',
            },
            {
              step: '02',
              icon: QrCode,
              title: 'Terbit Paspor QR Otomatis',
              desc: 'Saat ternak siap jual, data riwayat bobot dan status bebas masa henti obat otomatis menyatu menjadi Paspor QR.',
            },
            {
              step: '03',
              icon: MessageCircle,
              title: 'Pesan & Antar Transparan',
              desc: 'Pembeli memilih pengiriman hewan sesuai armada & tujuan atau ambil sendiri (Rp 0 biaya layanan), lalu konfirmasi langsung ke kandang.',
            },
          ].map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.step} className="bento-card p-6 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <span className="w-11 h-11 rounded-2xl glass-tile flex items-center justify-center text-[#2B2B2B]">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="font-metric text-3xl text-[#2B2B2B]/25">{p.step}</span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-[#2B2B2B]">{p.title}</h3>
                  <p className="text-xs sm:text-sm text-[#5A5D64] mt-1.5 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </section>

        {/* Paket & Harga TERMU (Gratis + 3 Level Premium) */}
        <section id="paket-harga" className="space-y-5 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[#6E7178]">
                Harga Promo · Bebas Iklan · Kuota AI &amp; Cetak Paspor QR Lebih Besar
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-medium text-[#2B2B2B] mt-0.5">
                Paket Langganan Kandang TERMU
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#1D6E42] bg-[#E9F7EF] px-3.5 py-1.5 rounded-full self-start sm:self-auto">
              Diskon hingga 40% untuk 3 Level Premium
            </span>
          </div>

          <PricingCardsSection
            currentTier={session ? currentTier : undefined}
            onSelectTier={onSelectLandingPlan}
          />
        </section>

        <footer className="pt-5 border-t border-black/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6E7178]">
          <div className="flex items-center gap-3">
            <BrandLogo height={20} color="#2B2B2B" />
            <span>· Ekosistem Manajemen Kandang &amp; Pasar Ternak Indonesia.</span>
          </div>
          <div className="flex items-center gap-5 font-semibold text-[#2B2B2B]">
            <button type="button" onClick={() => onNavigateScreen('marketplace')} className="hover:underline">
              Pasar TERMU
            </button>
            <button type="button" onClick={() => onNavigateScreen('kandang')} className="hover:underline">
              Kelola Kandang
            </button>
          </div>
        </footer>
      </main>

      {/* Mobile Floating Liquid Glass Bottom Dock — Quick Switch Landing, Pasar, Kandang, Paket */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1 pointer-events-none no-print"
        aria-label="Navigasi cepat bawah TERMU"
      >
        <div className="pointer-events-auto max-w-md mx-auto h-16 px-2 rounded-full glass-dock grid grid-cols-4 items-center">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="h-12 rounded-full flex flex-col items-center justify-center gap-0.5 bg-[#2B2B2B]/[0.09] text-[#2B2B2B] font-bold transition"
          >
            <Home className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-none">Beranda</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateScreen('marketplace')}
            className="h-12 rounded-full flex flex-col items-center justify-center gap-0.5 text-[#6E7178] font-medium transition"
          >
            <Store className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-none">Pasar</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateScreen('kandang')}
            className="h-12 rounded-full flex flex-col items-center justify-center gap-0.5 text-[#6E7178] font-medium transition"
          >
            <Warehouse className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-none">Kandang</span>
          </button>
          <a
            href="#paket-harga"
            className="h-12 rounded-full flex flex-col items-center justify-center gap-0.5 text-[#6E7178] font-medium transition"
          >
            <Crown className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-none">Paket</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
