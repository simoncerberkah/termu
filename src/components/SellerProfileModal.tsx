import { useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  MessageCircle,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import type {
  MarketplaceCatalogItem,
  SellerProfile,
  SellerReputationSummary,
  SellerReview,
  SellerTrustLevel,
} from '../types/termu';
import { buildWhatsAppUrl, formatDateID, formatRp, todayISO, uid } from '../utils/format';
import {
  computeSellerReputation,
  getTrustVisualMeta,
  validateSellerReview,
} from '../utils/sellers';
import { AnimalIllustration } from './BrandLogo';
import { Modal } from './Modal';

export type SellerModalTab = 'etalase' | 'ulasan' | 'kepercayaan';

export function SellerTrustBadge({
  level,
  label,
  compact = false,
}: {
  level: SellerTrustLevel;
  label?: string;
  compact?: boolean;
}) {
  const meta = getTrustVisualMeta(level);
  const defaultText =
    level === 'terpercaya'
      ? compact
        ? 'Terpercaya'
        : 'Toko Terpercaya'
      : level === 'terverifikasi'
      ? 'Terverifikasi'
      : compact
      ? 'Perlu Cek'
      : 'Perlu Cek Langsung';

  const Icon =
    level === 'terpercaya'
      ? ShieldCheck
      : level === 'terverifikasi'
      ? BadgeCheck
      : ShieldAlert;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-semibold whitespace-nowrap shrink-0 ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      } ${meta.badgeClass}`}
    >
      <Icon className={compact ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      <span>{label || defaultText}</span>
    </span>
  );
}

interface SellerMiniStripProps {
  seller: SellerProfile;
  reputation: SellerReputationSummary;
  onOpenSeller: () => void;
  compact?: boolean;
}

export function SellerMiniStrip({
  seller,
  reputation,
  onOpenSeller,
  compact = false,
}: SellerMiniStripProps) {
  const initials = seller.farmName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const avatarTone =
    reputation.trustLevel === 'terpercaya'
      ? 'bg-[#2B2B2B] text-[#F5D547]'
      : reputation.trustLevel === 'terverifikasi'
      ? 'bg-[#1E4799] text-white'
      : 'bg-[#FFF3DA] text-[#8A4700] border border-[#F6D59B]';

  return (
    <button
      type="button"
      onClick={onOpenSeller}
      className={`w-full text-left flex items-center justify-between gap-2.5 rounded-2xl border border-black/[0.06] bg-white/65 hover:bg-white transition px-2.5 ${
        compact ? 'py-2 min-h-[44px]' : 'py-2.5 min-h-[48px]'
      } group`}
      aria-label={`Kunjungi profil penjual ${seller.farmName}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span
          className={`w-8 h-8 rounded-xl text-[11px] font-bold flex items-center justify-center shrink-0 ${avatarTone}`}
        >
          {initials || 'KT'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-[#2B2B2B] truncate group-hover:underline">
              {seller.farmName}
            </span>
            <SellerTrustBadge level={reputation.trustLevel} compact />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#6E7178] mt-0.5 tabular-nums truncate">
            <span className="inline-flex items-center gap-0.5 font-semibold text-[#2B2B2B]">
              <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
              {reputation.reviewCount > 0 ? reputation.averageRating.toFixed(1) : 'Baru'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{reputation.reviewCount} ulasan</span>
            {!compact && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">Terjual {seller.completedSales}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#2B2B2B] shrink-0">
        <span className="hidden sm:inline">Toko</span>
        <ChevronRight className="w-4 h-4 text-[#6E7178] group-hover:translate-x-0.5 transition-transform" />
      </span>
    </button>
  );
}

interface SellerProfileModalProps {
  open: boolean;
  seller: SellerProfile | null;
  initialTab?: SellerModalTab;
  defaultReviewAnimal?: string;
  openReviewFormInitially?: boolean;
  allReviews: SellerReview[];
  sellerListings: MarketplaceCatalogItem[];
  isFollowed: boolean;
  defaultBuyerName?: string;
  onClose: () => void;
  onToggleFollow: (sellerId: string) => void;
  onAddReview: (review: SellerReview) => void;
  onOpenPassport: (animalId: string) => void;
  onOpenCheckout: (item: MarketplaceCatalogItem) => void;
}

export function SellerProfileModal({
  open,
  seller,
  initialTab = 'etalase',
  defaultReviewAnimal = '',
  openReviewFormInitially = false,
  allReviews,
  sellerListings,
  isFollowed,
  defaultBuyerName = '',
  onClose,
  onToggleFollow,
  onAddReview,
  onOpenPassport,
  onOpenCheckout,
}: SellerProfileModalProps) {
  const [tab, setTab] = useState<SellerModalTab>(initialTab);
  const [starFilter, setStarFilter] = useState<number>(0);
  const [showReviewForm, setShowReviewForm] = useState<boolean>(openReviewFormInitially);

  // Review form state
  const [buyerName, setBuyerName] = useState(defaultBuyerName);
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [animalPurchased, setAnimalPurchased] = useState(
    defaultReviewAnimal ||
      (sellerListings[0] ? `${sellerListings[0].name} (${sellerListings[0].animal_id})` : 'Ternak Kandang')
  );
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const reputation = useMemo(() => {
    if (!seller) return null;
    return computeSellerReputation(seller, allReviews, sellerListings);
  }, [seller, allReviews, sellerListings]);

  const sellerReviews = useMemo(() => {
    if (!seller) return [];
    const list = allReviews.filter((r) => r.sellerId === seller.id);
    if (starFilter === 0) return list;
    return list.filter((r) => r.rating === starFilter);
  }, [allReviews, seller, starFilter]);

  if (!open || !seller || !reputation) return null;

  const totalFollowers = seller.baseFollowers + (isFollowed ? 1 : 0);
  const initials = seller.farmName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const waMessage = `Halo ${seller.farmName}, saya melihat profil kandang Anda di Pasar TERMU dan ingin menanyakan stok ternak yang tersedia.`;

  function handleSubmitReview(e: FormEvent) {
    e.preventDefault();
    if (!seller) return;
    const check = validateSellerReview({ buyerName, rating, comment });
    if (!check.ok) {
      setFormError(check.error || 'Lengkapi ulasan Anda.');
      return;
    }
    const newReview: SellerReview = {
      id: uid('rev'),
      sellerId: seller.id,
      buyerName: buyerName.trim(),
      rating,
      comment: comment.trim(),
      animalPurchased: animalPurchased.trim() || 'Pembelian Ternak',
      date: todayISO(),
      verifiedPurchase: Boolean(defaultReviewAnimal),
    };
    onAddReview(newReview);
    setComment('');
    setFormError(null);
    setShowReviewForm(false);
    setStarFilter(0);
  }

  const trustMeta = getTrustVisualMeta(reputation.trustLevel);

  return (
    <Modal
      open={open}
      title="Profil Penjual & Reputasi Kandang"
      subtitle={`${seller.farmName} · ${seller.location}`}
      maxWidth="max-w-3xl"
      onClose={onClose}
    >
      <div className="space-y-4">
        {/* Shopee-Style Store Header Banner */}
        <div
          className={`rounded-3xl p-4 sm:p-5 relative overflow-hidden ${
            reputation.trustLevel === 'terpercaya'
              ? 'bento-card-dark text-white'
              : 'glass-tile border border-black/[0.08] text-[#2B2B2B]'
          }`}
        >
          {reputation.trustLevel === 'terpercaya' && (
            <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#F5D547]/15 blur-2xl" />
          )}

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div
                className={`w-14 h-14 rounded-2xl font-display text-lg font-bold flex items-center justify-center shrink-0 ${
                  reputation.trustLevel === 'terpercaya'
                    ? 'bg-[#F5D547] text-[#2B2B2B]'
                    : reputation.trustLevel === 'terverifikasi'
                    ? 'bg-[#1E4799] text-white'
                    : 'bg-[#FFF3DA] text-[#8A4700] border border-[#F6D59B]'
                }`}
              >
                {initials || 'KT'}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-display text-lg sm:text-xl font-semibold leading-tight truncate">
                    {seller.farmName}
                  </h4>
                  <SellerTrustBadge level={reputation.trustLevel} label={reputation.trustLabel} />
                </div>

                <div
                  className={`text-xs mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 ${
                    reputation.trustLevel === 'terpercaya' ? 'text-white/80' : 'text-[#5A5D64]'
                  }`}
                >
                  <span>Pengelola: {seller.ownerName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {seller.city}
                  </span>
                </div>

                <div
                  className={`text-[11px] mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular-nums ${
                    reputation.trustLevel === 'terpercaya' ? 'text-white/65' : 'text-[#6E7178]'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {seller.activeStatusLabel}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Gabung {seller.joinedSince}</span>
                  <span aria-hidden="true">·</span>
                  <span>{totalFollowers} pengikut</span>
                </div>
              </div>
            </div>

            {/* Store Actions */}
            <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onToggleFollow(seller.id)}
                className={`btn-touch px-4 rounded-full text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition ${
                  isFollowed
                    ? reputation.trustLevel === 'terpercaya'
                      ? 'bg-white/15 text-white border border-white/25 hover:bg-white/25'
                      : 'bg-[#2B2B2B] text-white'
                    : reputation.trustLevel === 'terpercaya'
                    ? 'glass-accent text-[#2B2B2B] hover:brightness-95'
                    : 'bg-[#2B2B2B] hover:bg-black text-white'
                }`}
              >
                {isFollowed ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>{isFollowed ? 'Mengikuti' : 'Ikuti'}</span>
              </button>

              <a
                href={buildWhatsAppUrl(seller.phone, waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn-touch px-4 rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition ${
                  reputation.trustLevel === 'terpercaya'
                    ? 'bg-[#1F7A4D] hover:bg-[#17613C] text-white'
                    : 'bg-[#1F7A4D] hover:bg-[#17613C] text-white'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat WA</span>
              </a>
            </div>
          </div>
        </div>

        {/* 4-Tile Shopee-Style Performance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 tabular-nums">
          <button
            type="button"
            onClick={() => setTab('ulasan')}
            className="glass-tile rounded-2xl p-3 text-left hover:bg-white transition"
          >
            <div className="text-[11px] text-[#6E7178]">Rating Toko</div>
            <div className="font-display text-lg font-bold text-[#2B2B2B] mt-0.5 flex items-center gap-1">
              <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
              <span>{reputation.reviewCount > 0 ? reputation.averageRating.toFixed(1) : '—'}</span>
              <span className="text-xs font-normal text-[#6E7178]">/ 5</span>
            </div>
            <div className="text-[11px] text-[#5A5D64]">{reputation.reviewCount} ulasan pembeli</div>
          </button>

          <button
            type="button"
            onClick={() => setTab('kepercayaan')}
            className="glass-tile rounded-2xl p-3 text-left hover:bg-white transition"
          >
            <div className="text-[11px] text-[#6E7178]">Skor Kepercayaan</div>
            <div className={`font-display text-lg font-bold mt-0.5 ${trustMeta.textClass}`}>
              {reputation.trustScore}
              <span className="text-xs font-normal text-[#6E7178]"> / 100</span>
            </div>
            <div className="text-[11px] text-[#5A5D64] truncate">{reputation.trustShortLabel}</div>
          </button>

          <div className="glass-tile rounded-2xl p-3">
            <div className="text-[11px] text-[#6E7178]">Performa Chat</div>
            <div className="font-display text-lg font-bold text-[#2B2B2B] mt-0.5">
              {seller.responseRate}%
            </div>
            <div className="text-[11px] text-[#5A5D64]">Balas {seller.responseTimeLabel}</div>
          </div>

          <div className="glass-tile rounded-2xl p-3">
            <div className="text-[11px] text-[#6E7178]">Ternak Terjual</div>
            <div className="font-display text-lg font-bold text-[#2B2B2B] mt-0.5">
              {seller.completedSales} ekor
            </div>
            <div className="text-[11px] text-[#5A5D64]">{seller.onTimeDeliveryRate}% tepat waktu</div>
          </div>
        </div>

        {/* 3-Tab Segmented Switcher */}
        <div
          className="flex items-center gap-1 p-1 rounded-2xl bg-black/[0.05] overflow-x-auto no-scrollbar"
          role="tablist"
          aria-label="Tab Profil Penjual"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'etalase'}
            onClick={() => setTab('etalase')}
            className={`btn-touch flex-1 px-3 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
              tab === 'etalase'
                ? 'bg-[#2B2B2B] text-white shadow-sm'
                : 'text-[#5A5D64] hover:text-[#2B2B2B]'
            }`}
          >
            Etalase ({sellerListings.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'ulasan'}
            onClick={() => setTab('ulasan')}
            className={`btn-touch flex-1 px-3 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
              tab === 'ulasan'
                ? 'bg-[#2B2B2B] text-white shadow-sm'
                : 'text-[#5A5D64] hover:text-[#2B2B2B]'
            }`}
          >
            Rating &amp; Ulasan ({reputation.reviewCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'kepercayaan'}
            onClick={() => setTab('kepercayaan')}
            className={`btn-touch flex-1 px-3 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
              tab === 'kepercayaan'
                ? 'bg-[#2B2B2B] text-white shadow-sm'
                : 'text-[#5A5D64] hover:text-[#2B2B2B]'
            }`}
          >
            Cek Kepercayaan
          </button>
        </div>

        {/* TAB 1: ETALASE TERNAK */}
        {tab === 'etalase' && (
          <div className="space-y-4">
            <div className="text-xs text-[#5A5D64] leading-relaxed">
              <p>{seller.bio}</p>
              <p className="mt-1.5 text-[11px] text-[#6E7178]">
                Fokus kandang: {seller.specialties.join(' · ')}
              </p>
            </div>

            {sellerListings.length === 0 ? (
              <div className="glass-tile rounded-2xl p-6 text-center text-xs text-[#6E7178]">
                <Store className="w-7 h-7 mx-auto mb-2 text-[#6E7178]/70" />
                Belum ada ternak yang sedang tayang di etalase kandang ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {sellerListings.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-black/[0.08] bg-white/80 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-36 relative bg-[#EAE5DC]">
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
                        <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white gap-2">
                          <div className="min-w-0">
                            <div className="font-display text-base font-semibold truncate">{item.name}</div>
                            <div className="text-[11px] text-white/85 truncate">
                              {item.breed} · {item.sex}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full glass-accent text-[#2B2B2B] text-[11px] font-bold tabular-nums shrink-0">
                            {item.weight} kg
                          </span>
                        </div>
                      </div>
                      <div className="p-3 space-y-1">
                        <div className="flex items-baseline justify-between gap-2 tabular-nums">
                          <strong className="font-display text-base font-semibold text-[#2B2B2B]">
                            {formatRp(item.price)}
                          </strong>
                          <span className="text-[11px] text-[#6E7178]">
                            {formatRp(item.pricePerKg)}/kg
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6E7178]">
                          PBBH +{item.pbbh} kg/hr · {item.verifiedRecords}x timbang ·{' '}
                          {item.withdrawalFree ? 'Bebas Residu' : 'Masa Henti Obat'}
                        </div>
                      </div>
                    </div>

                    <div className="px-3 pb-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPassport(item.animal_id);
                        }}
                        className="btn-touch px-3 rounded-full glass-tile hover:bg-white text-xs font-semibold text-[#2B2B2B] inline-flex items-center justify-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5" /> QR
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenCheckout(item);
                        }}
                        className="btn-touch flex-1 rounded-full bg-[#2B2B2B] hover:bg-black text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#F5D547]" /> Pesan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RATING & ULASAN PEMBELI */}
        {tab === 'ulasan' && (
          <div className="space-y-4">
            {/* Rating Histogram + Action */}
            <div className="glass-tile rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-4 text-center sm:text-left sm:border-r sm:border-black/[0.06] sm:pr-4 tabular-nums">
                <div className="font-metric text-4xl text-[#2B2B2B]">
                  {reputation.reviewCount > 0 ? reputation.averageRating.toFixed(1) : '0.0'}
                  <span className="text-base text-[#6E7178] font-normal"> / 5</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(reputation.averageRating)
                          ? 'fill-[#F59E0B] text-[#F59E0B]'
                          : 'text-[#D4D4D8]'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-[11px] text-[#6E7178] mt-1">
                  Berdasarkan {reputation.reviewCount} ulasan pembeli
                </div>
              </div>

              <div className="sm:col-span-8 space-y-1.5 tabular-nums">
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const count = reputation.starBreakdown[star];
                  const pct =
                    reputation.reviewCount > 0
                      ? Math.round((count / reputation.reviewCount) * 100)
                      : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-9 font-semibold text-[#2B2B2B] inline-flex items-center gap-0.5 shrink-0">
                        {star} <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-black/[0.07] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#2B2B2B] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-7 text-right text-[11px] text-[#6E7178] shrink-0">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Star Filter + Write Review Trigger */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {[0, 5, 4, 3, 2, 1].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStarFilter(st)}
                    className={`min-h-[36px] px-3 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                      starFilter === st
                        ? 'bg-[#2B2B2B] text-white'
                        : 'glass-tile text-[#5A5D64] hover:text-[#2B2B2B]'
                    }`}
                  >
                    {st === 0 ? `Semua (${reputation.reviewCount})` : `${st} ★ (${reputation.starBreakdown[st as 1 | 2 | 3 | 4 | 5]})`}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowReviewForm((v) => !v)}
                className="btn-touch px-4 rounded-full glass-accent text-[#2B2B2B] text-xs font-bold whitespace-nowrap shrink-0"
              >
                {showReviewForm ? 'Tutup Form Ulasan' : 'Tulis Ulasan'}
              </button>
            </div>

            {/* Interactive Write Review Form */}
            {showReviewForm && (
              <form
                onSubmit={handleSubmitReview}
                className="rounded-2xl border border-black/10 bg-white p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-[#2B2B2B]">
                    Beri Rating &amp; Ulasan untuk {seller.farmName}
                  </div>
                  <span className="text-[11px] text-[#6E7178]">Langsung memperbarui skor toko</span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-[#5A5D64] mb-1">
                    Pilih Bintang Anda
                  </span>
                  <div className="flex items-center gap-1">
                    {([1, 2, 3, 4, 5] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        aria-label={`Beri rating ${s} bintang`}
                        className="w-11 h-11 rounded-xl hover:bg-black/[0.04] flex items-center justify-center transition"
                      >
                        <Star
                          className={`w-6 h-6 transition ${
                            s <= rating
                              ? 'fill-[#F59E0B] text-[#F59E0B] scale-105'
                              : 'text-[#D4D4D8]'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-bold text-[#2B2B2B] tabular-nums">
                      {rating}.0 / 5.0
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="rev-name" className="block text-[11px] font-semibold text-[#5A5D64] mb-1">
                      Nama Pembeli *
                    </label>
                    <input
                      id="rev-name"
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Contoh: Pak Hendra Semarang"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] border border-black/10 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="rev-animal" className="block text-[11px] font-semibold text-[#5A5D64] mb-1">
                      Ternak yang Dibeli / Dicek
                    </label>
                    <input
                      id="rev-animal"
                      type="text"
                      value={animalPurchased}
                      onChange={(e) => setAnimalPurchased(e.target.value)}
                      placeholder="Contoh: Mahesa (BYL-104)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] border border-black/10 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="rev-comment" className="block text-[11px] font-semibold text-[#5A5D64] mb-1">
                    Pengalaman Transaksi / Kondisi Ternak *
                  </label>
                  <textarea
                    id="rev-comment"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ceritakan kesesuaian bobot, kesehatan hewan, dan kecepatan respon kandang..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFAF8] border border-black/10 text-sm"
                    required
                  />
                </div>

                {formError && (
                  <p className="text-xs font-semibold text-[#9E2420]" role="alert">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn-touch w-full rounded-full bg-[#2B2B2B] hover:bg-black text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#F5D547]" /> Kirim Ulasan &amp; Perbarui Rating
                </button>
              </form>
            )}

            {/* Reviews List */}
            {sellerReviews.length === 0 ? (
              <div className="glass-tile rounded-2xl p-6 text-center text-xs text-[#6E7178]">
                Belum ada ulasan pada filter bintang ini.
              </div>
            ) : (
              <div className="divide-y divide-black/[0.06] rounded-2xl border border-black/[0.06] bg-white/75 px-4">
                {sellerReviews.map((rev) => (
                  <article key={rev.id} className="py-3.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#2B2B2B] flex flex-wrap items-center gap-1.5">
                          <span>{rev.buyerName}</span>
                          {rev.verifiedPurchase && (
                            <span className="text-[10px] font-semibold text-[#145C36] inline-flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Pembeli Terverifikasi
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#6E7178] mt-0.5">
                          {rev.animalPurchased} · {formatDateID(rev.date)}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0" aria-label={`Rating ${rev.rating} dari 5`}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#D4D4D8]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#2B2B2B] leading-relaxed">{rev.comment}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CEK KEPERCAYAAN TOKO */}
        {tab === 'kepercayaan' && (
          <div className="space-y-4">
            <div className={`rounded-2xl border p-4 space-y-2 ${trustMeta.surfaceClass}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <SellerTrustBadge level={reputation.trustLevel} label={reputation.trustLabel} />
                  <span className={`text-xs font-bold tabular-nums ${trustMeta.textClass}`}>
                    Skor {reputation.trustScore}/100
                  </span>
                </div>
                <span className="text-[11px] font-medium text-[#5A5D64]">
                  Evaluasi Otomatis TERMU
                </span>
              </div>
              <p className="text-xs text-[#2B2B2B] leading-relaxed">{reputation.trustVerdict}</p>
              <div className="h-2 rounded-full bg-black/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${reputation.trustScore}%`,
                    backgroundColor: trustMeta.dotColor,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold text-[#2B2B2B]">
                6 Kriteria Penilaian Kepercayaan Kandang
              </h5>
              <div className="divide-y divide-black/[0.06] rounded-2xl border border-black/[0.06] bg-white/80 px-4">
                {reputation.trustReasons.map((reason) => (
                  <div key={reason.id} className="py-3 flex items-start gap-3">
                    {reason.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#1D6E42] shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#2B2B2B] flex flex-wrap items-center gap-1.5">
                        <span>{reason.label}</span>
                        <span
                          className={`text-[10px] font-bold ${
                            reason.passed ? 'text-[#145C36]' : 'text-[#8A4700]'
                          }`}
                        >
                          ({reason.passed ? 'Terpenuhi' : 'Perlu Perhatian'})
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5A5D64] mt-0.5 leading-relaxed">
                        {reason.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-[#5A5D64] rounded-2xl bg-black/[0.03] px-3.5 py-3 leading-relaxed">
              <strong>Tips Belanja Aman di Pasar TERMU:</strong> Selalu periksa Paspor QR ternak
              sebelum memesan. Untuk kandang berstatus <em>Perlu Cek Langsung</em>, gunakan opsi{' '}
              <strong>Ambil Sendiri ke Kandang (Rp 0 biaya layanan)</strong> agar Anda bisa
              memastikan kondisi fisik &amp; timbangan secara langsung.
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
