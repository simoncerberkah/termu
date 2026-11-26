import { useState } from 'react';
import {
  Check,
  Crown,
  Lock,
  Megaphone,
  QrCode,
  ShieldCheck,
  Sparkles,
  Warehouse,
  X,
} from 'lucide-react';
import type { FarmDatabase, SubscriptionState, SubscriptionTier } from '../types/termu';
import { getActiveAnimals } from '../utils/calculations';
import { formatRp } from '../utils/format';
import {
  PREMIUM_TIERS,
  SUBSCRIPTION_PLANS,
  formatLimitLabel,
  getPlanConfig,
  normalizeSubscription,
} from '../utils/subscription';
import { Modal } from './Modal';

interface PricingCardsSectionProps {
  currentTier?: SubscriptionTier;
  onSelectTier: (tier: SubscriptionTier) => void;
  compact?: boolean;
}

export function PricingCardsSection({
  currentTier,
  onSelectTier,
  compact = false,
}: PricingCardsSectionProps) {
  const freePlan = SUBSCRIPTION_PLANS.free;

  return (
    <div className="space-y-4">
      {/* Free Plan Baseline Strip */}
      <div className="glass-tile rounded-3xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-black/[0.08] text-[#2B2B2B] text-[11px] font-bold">
              Paket Dasar · Rp 0 / bulan
            </span>
            {currentTier === 'free' && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#2B2B2B] text-[#F5D547] text-[11px] font-bold">
                Paket Aktif Anda
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-semibold text-[#2B2B2B]">
            Gratis — Untuk Mulai Mencatat Kandang
          </h3>
          <p className="text-xs text-[#6E7178]">
            Maks. <strong>10 ekor ternak</strong> · Maks. <strong>2 sekat kandang</strong> (maks.{' '}
            <strong>5 ekor/sekat</strong>) · Cetak Paspor QR <strong>3x/bln</strong> ·{' '}
            <strong>Tanpa akses AI</strong> · <strong>Tampil iklan sponsor</strong>.
          </p>
        </div>

        {currentTier && currentTier !== 'free' && (
          <button
            type="button"
            onClick={() => onSelectTier('free')}
            className="btn-touch px-4 py-2 rounded-full bg-white border border-black/15 hover:bg-black/[0.03] text-xs font-semibold text-[#2B2B2B] whitespace-nowrap shrink-0 self-start lg:self-center"
          >
            Kembali ke Gratis
          </button>
        )}
      </div>

      {/* 3 Premium Level Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {PREMIUM_TIERS.map((tierId) => {
          const plan = SUBSCRIPTION_PLANS[tierId];
          const isPro = tierId === 'pro';
          const isActive = currentTier === tierId;

          return (
            <article
              key={tierId}
              className={`rounded-[28px] p-5 sm:p-6 flex flex-col justify-between gap-5 transition ${
                isPro
                  ? 'bento-card-dark ring-2 ring-[#F5D547]'
                  : 'bento-card'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isPro
                          ? 'bg-[#F5D547] text-[#2B2B2B]'
                          : 'bg-[#FBF6E3] text-[#2B2B2B] border border-black/[0.06]'
                      }`}
                    >
                      <Crown className="w-3 h-3" />
                      {plan.badge}
                    </span>
                    <h3
                      className={`font-display text-2xl font-semibold mt-2.5 ${
                        isPro ? 'text-white' : 'text-[#2B2B2B]'
                      }`}
                    >
                      TERMU {plan.name}
                    </h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums shrink-0 ${
                      isPro ? 'bg-white/15 text-[#F5D547]' : 'bg-[#E9F7EF] text-[#1F7A4D]'
                    }`}
                  >
                    Diskon {plan.discountPercent}%
                  </span>
                </div>

                {/* Price Block */}
                <div className="space-y-0.5 tabular-nums">
                  <div className={`text-xs line-through ${isPro ? 'text-white/50' : 'text-[#6E7178]'}`}>
                    {formatRp(plan.originalPriceMonthly)} / bulan
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`font-metric text-4xl font-semibold ${
                        isPro ? 'text-[#F5D547]' : 'text-[#2B2B2B]'
                      }`}
                    >
                      {formatRp(plan.priceMonthly)}
                    </span>
                    <span className={`text-xs font-medium ${isPro ? 'text-white/70' : 'text-[#6E7178]'}`}>
                      / bulan
                    </span>
                  </div>
                  <p className={`text-xs pt-1 leading-relaxed ${isPro ? 'text-white/75' : 'text-[#6E7178]'}`}>
                    {plan.tagline}
                  </p>
                </div>

                {/* Structured Quota Grid */}
                <div
                  className={`grid grid-cols-2 gap-2 p-3 rounded-2xl text-[11px] ${
                    isPro ? 'bg-white/[0.08] border border-white/10' : 'glass-tile'
                  }`}
                >
                  <div>
                    <span className={isPro ? 'text-white/60 block' : 'text-[#6E7178] block'}>
                      Maks. Ternak
                    </span>
                    <strong className={isPro ? 'text-white' : 'text-[#2B2B2B]'}>
                      {formatLimitLabel(plan.maxAnimals, 'ekor')}
                    </strong>
                  </div>
                  <div>
                    <span className={isPro ? 'text-white/60 block' : 'text-[#6E7178] block'}>
                      Kandang / Sekat
                    </span>
                    <strong className={isPro ? 'text-white' : 'text-[#2B2B2B]'}>
                      {formatLimitLabel(plan.maxPens, 'sekat')}
                    </strong>
                  </div>
                  <div>
                    <span className={isPro ? 'text-white/60 block' : 'text-[#6E7178] block'}>
                      Maks. / 1 Kandang
                    </span>
                    <strong className={isPro ? 'text-white' : 'text-[#2B2B2B]'}>
                      {formatLimitLabel(plan.maxAnimalsPerPen, 'ekor')}
                    </strong>
                  </div>
                  <div>
                    <span className={isPro ? 'text-white/60 block' : 'text-[#6E7178] block'}>
                      Kuota AI / bln
                    </span>
                    <strong className={isPro ? 'text-[#F5D547]' : 'text-[#1F7A4D]'}>
                      {plan.aiMonthlyQuota} kali
                    </strong>
                  </div>
                  <div className="col-span-2 pt-1.5 mt-0.5 border-t border-current/10 flex items-center justify-between gap-2">
                    <span className={isPro ? 'text-white/70 inline-flex items-center gap-1' : 'text-[#6E7178] inline-flex items-center gap-1'}>
                      <Sparkles className="w-3.5 h-3.5 shrink-0" /> Kecerdasan AI
                    </span>
                    <strong className={isPro ? 'text-[#F5D547] text-xs text-right' : 'text-[#1F7A4D] text-xs text-right'}>
                      {plan.aiIntelligenceSummary}
                    </strong>
                  </div>
                  <div className="col-span-2 pt-1.5 mt-0.5 border-t border-current/10 flex items-center justify-between gap-2">
                    <span className={isPro ? 'text-white/70 inline-flex items-center gap-1' : 'text-[#6E7178] inline-flex items-center gap-1'}>
                      <QrCode className="w-3.5 h-3.5 shrink-0" /> Cetak Paspor QR / bln
                    </span>
                    <strong className={isPro ? 'text-[#F5D547] text-xs text-right' : 'text-[#2B2B2B] text-xs text-right'}>
                      {formatLimitLabel(plan.qrPrintMonthlyQuota, 'cetak')}
                    </strong>
                  </div>
                </div>

                {/* Feature Checklist */}
                {!compact && (
                  <ul className="space-y-2 text-xs">
                    {plan.highlights.map((feat) => (
                      <li key={feat} className="flex items-start gap-2">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isPro
                              ? 'bg-[#F5D547] text-[#2B2B2B]'
                              : 'bg-[#2B2B2B] text-[#F5D547]'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span className={isPro ? 'text-white/90' : 'text-[#2B2B2B]'}>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                type="button"
                disabled={isActive}
                onClick={() => onSelectTier(tierId)}
                className={`btn-touch w-full rounded-full text-xs font-bold transition ${
                  isActive
                    ? isPro
                      ? 'bg-white/15 text-white/70 cursor-default'
                      : 'bg-black/10 text-[#6E7178] cursor-default'
                    : isPro
                      ? 'glass-accent text-[#2B2B2B] hover:brightness-105'
                      : 'bg-[#2B2B2B] hover:bg-black text-white'
                }`}
              >
                {isActive
                  ? `Paket ${plan.name} Sedang Aktif`
                  : `Pilih Paket ${plan.name} · ${formatRp(plan.priceMonthly)}/bln`}
              </button>
            </article>
          );
        })}
      </div>

      {/* Subtle note for Free baseline */}
      {!compact && (
        <p className="text-[11px] text-[#6E7178] text-center">
          Semua paket berbayar ({freePlan.name} → Plus, Pro, Enterprise) bebas iklan, membuka kuota AI bulanan, dan langsung menambah batas ternak, kandang, serta cetak Paspor QR.
        </p>
      )}
    </div>
  );
}

interface SubscriptionModalProps {
  open: boolean;
  db: FarmDatabase;
  subscription: SubscriptionState;
  highlightReason?: string | null;
  onClose: () => void;
  onActivateTier: (tier: SubscriptionTier) => void;
}

export function SubscriptionModal({
  open,
  db,
  subscription,
  highlightReason,
  onClose,
  onActivateTier,
}: SubscriptionModalProps) {
  const [confirmTier, setConfirmTier] = useState<SubscriptionTier | null>(null);
  const norm = normalizeSubscription(subscription);
  const activePlan = getPlanConfig(norm.tier);
  const activeAnimalCount = getActiveAnimals(db).length;
  const penCount = (db.pens || []).length;

  const confirmPlan = confirmTier ? getPlanConfig(confirmTier) : null;

  return (
    <Modal
      open={open}
      title="Paket & Langganan TERMU"
      subtitle={`Paket aktif: ${activePlan.name} (${activePlan.priceMonthly === 0 ? 'Rp 0/bln' : `${formatRp(activePlan.priceMonthly)}/bln`}) · Periode ${norm.usageMonth}`}
      maxWidth="max-w-5xl"
      onClose={() => {
        setConfirmTier(null);
        onClose();
      }}
    >
      <div className="space-y-5">
        {highlightReason && (
          <div className="rounded-2xl bg-[#FFF3DA] border border-[#8B4C06]/25 p-3.5 text-xs text-[#7A3F04] flex items-start gap-2.5">
            <Crown className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{highlightReason}</span>
          </div>
        )}

        {/* Current Usage Meters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="glass-tile rounded-2xl p-3">
            <div className="text-[11px] text-[#6E7178]">Ternak Aktif</div>
            <div className="font-display text-lg font-bold text-[#2B2B2B] tabular-nums mt-0.5">
              {activeAnimalCount} / {activePlan.maxAnimals === null ? '∞' : activePlan.maxAnimals}
            </div>
            <div className="text-[10px] text-[#6E7178]">
              Maks. {activePlan.maxAnimalsPerPen === null ? 'tanpa batas' : `${activePlan.maxAnimalsPerPen} ekor`}/sekat
            </div>
          </div>

          <div className="glass-tile rounded-2xl p-3">
            <div className="text-[11px] text-[#6E7178]">Jumlah Sekat Kandang</div>
            <div className="font-display text-lg font-bold text-[#2B2B2B] tabular-nums mt-0.5">
              {penCount} / {activePlan.maxPens === null ? '∞' : activePlan.maxPens}
            </div>
            <div className="text-[10px] text-[#6E7178]">
              {activePlan.hasAds ? 'Menampilkan iklan' : 'Bebas iklan'}
            </div>
          </div>

          <div className="glass-tile rounded-2xl p-3">
            <div className="text-[11px] text-[#6E7178]">Kuota AI Bulan Ini</div>
            <div className="font-display text-lg font-bold text-[#2B2B2B] tabular-nums mt-0.5">
              {activePlan.aiMonthlyQuota === 0 ? 'Terkunci' : `${norm.aiUsed} / ${activePlan.aiMonthlyQuota}`}
            </div>
            <div className="text-[10px] text-[#6E7178] truncate">
              {activePlan.aiIntelligenceSummary}
            </div>
          </div>

          <div className="glass-tile rounded-2xl p-3">
            <div className="text-[11px] text-[#6E7178]">Cetak Paspor QR / bln</div>
            <div className="font-display text-lg font-bold text-[#2B2B2B] tabular-nums mt-0.5">
              {norm.qrPrintUsed} / {activePlan.qrPrintMonthlyQuota === null ? '∞' : activePlan.qrPrintMonthlyQuota}
            </div>
            <div className="text-[10px] text-[#6E7178]">Unduh SVG & cetak</div>
          </div>
        </div>

        {/* Confirm Upgrade Drawer */}
        {confirmPlan ? (
          <div className="bento-card p-5 border-2 border-[#2B2B2B] space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6E7178]">
                  Konfirmasi Perubahan Paket
                </span>
                <h3 className="font-display text-xl font-semibold text-[#2B2B2B] mt-0.5">
                  Aktifkan TERMU {confirmPlan.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmTier(null)}
                className="w-8 h-8 rounded-full glass-tile flex items-center justify-center"
                aria-label="Batalkan pilihan paket"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs glass-tile rounded-2xl p-4">
              <div>
                <span className="text-[#6E7178] block">Tarif Promo Bulanan</span>
                {confirmPlan.originalPriceMonthly > 0 && (
                  <span className="line-through text-[#6E7178] mr-2 tabular-nums">
                    {formatRp(confirmPlan.originalPriceMonthly)}
                  </span>
                )}
                <strong className="text-base text-[#2B2B2B] tabular-nums">
                  {confirmPlan.priceMonthly === 0 ? 'Rp 0 / bulan' : `${formatRp(confirmPlan.priceMonthly)} / bulan`}
                </strong>
              </div>
              <div>
                <span className="text-[#6E7178] block">Ringkasan Kuota Baru</span>
                <strong className="text-[#2B2B2B]">
                  {formatLimitLabel(confirmPlan.maxAnimals, 'ternak')} · {formatLimitLabel(confirmPlan.maxPens, 'sekat')} · AI {confirmPlan.aiMonthlyQuota}/bln · QR {formatLimitLabel(confirmPlan.qrPrintMonthlyQuota, 'cetak/bln')}
                </strong>
              </div>
            </div>

            <div className="rounded-2xl bg-[#E9F7EF] border border-[#1F7A4D]/20 p-3 text-xs text-[#1F7A4D] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Aktivasi langsung diterapkan pada akun kandang Anda di perangkat ini tanpa memotong saldo kartu (mode simulasi berlangganan TERMU).
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmTier(null)}
                className="btn-touch px-5 rounded-full glass-tile text-xs font-semibold text-[#2B2B2B]"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  onActivateTier(confirmPlan.id);
                  setConfirmTier(null);
                  onClose();
                }}
                className="btn-touch flex-1 rounded-full bg-[#2B2B2B] hover:bg-black text-white text-xs font-bold"
              >
                Konfirmasi & Aktifkan Paket {confirmPlan.name}
              </button>
            </div>
          </div>
        ) : (
          <PricingCardsSection
            currentTier={norm.tier}
            onSelectTier={(tier) => setConfirmTier(tier)}
          />
        )}
      </div>
    </Modal>
  );
}

interface FreeTierAdBannerProps {
  onOpenUpgrade: (reason?: string) => void;
}

const SPONSOR_ADS = [
  {
    sponsor: 'NutriTernak Nusantara',
    headline: 'Konsentrat Penggemukan 16% PK & Premix Mineral Sapi Potong — Kirim Area Jawa',
    detail: 'Sponsor Paket Gratis · Upgrade ke TERMU Plus mulai Rp 49.999/bln untuk menghilangkan iklan dan membuka Asisten AI.',
  },
  {
    sponsor: 'Armada Ternak Express',
    headline: 'Sewa Pick-up & Truk Angkut Sapi/Kambing Berizin Surat Jalan Lengkap',
    detail: 'Sponsor Paket Gratis · Bebas iklan & kapasitas kandang lebih lega mulai dari paket Plus.',
  },
];

export function FreeTierAdBanner({ onOpenUpgrade }: FreeTierAdBannerProps) {
  const [idx, setIdx] = useState(0);
  const ad = SPONSOR_ADS[idx % SPONSOR_ADS.length];

  return (
    <aside
      aria-label="Iklan Sponsor Paket Gratis"
      className="no-print mb-4 rounded-[24px] bg-[#FBF6E3]/92 border border-[#E6D690] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
    >
      <div className="flex items-start gap-3 min-w-0">
        <span className="w-9 h-9 rounded-2xl bg-[#2B2B2B] text-[#F5D547] flex items-center justify-center shrink-0 mt-0.5">
          <Megaphone className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#2B2B2B] text-white text-[10px] font-bold uppercase tracking-wider">
              Iklan · Paket Gratis
            </span>
            <span className="text-[11px] font-bold text-[#2B2B2B]">{ad.sponsor}</span>
            <button
              type="button"
              onClick={() => setIdx((n) => n + 1)}
              className="text-[10px] text-[#6E7178] underline hover:text-[#2B2B2B]"
            >
              Sponsor berikutnya
            </button>
          </div>
          <p className="text-xs font-semibold text-[#2B2B2B] mt-0.5">{ad.headline}</p>
          <p className="text-[11px] text-[#6E7178]">{ad.detail}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onOpenUpgrade('Upgrade ke paket Plus, Pro, atau Enterprise untuk menghilangkan iklan sponsor dan membuka akses AI.')
        }
        className="btn-touch px-4 py-2 rounded-full bg-[#2B2B2B] hover:bg-black text-[#F5D547] text-xs font-bold whitespace-nowrap shrink-0 self-start sm:self-center inline-flex items-center gap-1.5"
      >
        <Crown className="w-3.5 h-3.5" /> Hapus Iklan
      </button>
    </aside>
  );
}

interface AILockedGateProps {
  tier: SubscriptionTier;
  reason: string;
  used: number;
  limit: number;
  title?: string;
  onOpenUpgrade: (reason?: string) => void;
}

export function AILockedGate({
  tier,
  reason,
  used,
  limit,
  title = 'Fitur AI Khusus Paket Premium',
  onOpenUpgrade,
}: AILockedGateProps) {
  const isFree = tier === 'free';

  return (
    <div className="bento-card p-6 sm:p-8 text-center space-y-4">
      <div className="w-14 h-14 rounded-3xl bg-[#2B2B2B] text-[#F5D547] flex items-center justify-center mx-auto">
        {isFree ? <Lock className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </div>
      <div className="space-y-1.5 max-w-lg mx-auto">
        <span className="inline-block px-3 py-1 rounded-full bg-[#FFF3DA] text-[#8B4C06] text-[11px] font-bold">
          {isFree ? 'Paket Gratis · Akses AI Terkunci' : `Kuota AI Bulan Ini Habis (${used}/${limit})`}
        </span>
        <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#2B2B2B]">{title}</h2>
        <p className="text-xs text-[#6E7178] leading-relaxed">{reason}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-2.5 max-w-2xl mx-auto text-left text-xs">
        <div className="glass-tile rounded-2xl p-3">
          <div className="font-bold text-[#2B2B2B]">Plus · Rp 49.999/bln</div>
          <div className="text-[11px] font-semibold text-[#1F7A4D] mt-0.5">Kecerdasan AI Cepat</div>
          <div className="text-[11px] text-[#6E7178] mt-0.5">30 kuota/bln · Bebas iklan</div>
        </div>
        <div className="rounded-2xl bg-[#2B2B2B] text-white p-3">
          <div className="font-bold text-[#F5D547]">Pro · Rp 99.999/bln</div>
          <div className="text-[11px] font-semibold text-white mt-0.5">AI Cepat + Cerdas</div>
          <div className="text-[11px] text-white/75 mt-0.5">150 kuota/bln · 75 cetak QR</div>
        </div>
        <div className="glass-tile rounded-2xl p-3">
          <div className="font-bold text-[#2B2B2B]">Enterprise · Rp 149.999/bln</div>
          <div className="text-[11px] font-semibold text-[#8B4C06] mt-0.5">AI Cepat + Cerdas + Pakar</div>
          <div className="text-[11px] text-[#6E7178] mt-0.5">500 kuota/bln · Semua Unlimited</div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpenUpgrade(reason)}
        className="btn-touch px-6 py-2.5 rounded-full bg-[#2B2B2B] hover:bg-black text-[#F5D547] text-xs font-bold inline-flex items-center gap-2"
      >
        <Crown className="w-4 h-4" /> Buka Paket Premium TERMU
      </button>
    </div>
  );
}

interface PlanQuotaSummaryCardProps {
  db: FarmDatabase;
  subscription: SubscriptionState;
  onOpenUpgrade: (reason?: string) => void;
}

export function PlanQuotaSummaryCard({
  db,
  subscription,
  onOpenUpgrade,
}: PlanQuotaSummaryCardProps) {
  const norm = normalizeSubscription(subscription);
  const plan = getPlanConfig(norm.tier);
  const animals = getActiveAnimals(db).length;
  const pens = (db.pens || []).length;

  return (
    <div className="bento-card p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-[#2B2B2B] text-[#F5D547] flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-sm sm:text-base font-semibold text-[#2B2B2B] leading-tight truncate">
              Paket {plan.name}
            </h2>
            <p className="text-[11px] text-[#6E7178] truncate">
              {plan.priceMonthly === 0 ? 'Gratis · Ada iklan' : `${formatRp(plan.priceMonthly)}/bln · Bebas iklan`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenUpgrade()}
          className="min-h-[36px] px-3.5 rounded-full glass-accent text-xs font-bold text-[#2B2B2B] whitespace-nowrap shrink-0"
        >
          {norm.tier === 'enterprise' ? 'Kelola' : 'Upgrade'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 text-xs">
        <div className="glass-tile rounded-xl p-2.5">
          <div className="text-[10px] text-[#6E7178] inline-flex items-center gap-1">
            <Warehouse className="w-3 h-3" /> Ternak
          </div>
          <div className="font-bold text-[#2B2B2B] tabular-nums mt-0.5">
            {animals}/{plan.maxAnimals === null ? '∞' : plan.maxAnimals} ekor
          </div>
        </div>
        <div className="glass-tile rounded-xl p-2.5">
          <div className="text-[10px] text-[#6E7178]">Sekat Kandang</div>
          <div className="font-bold text-[#2B2B2B] tabular-nums mt-0.5">
            {pens}/{plan.maxPens === null ? '∞' : plan.maxPens} sekat
          </div>
        </div>
        <div className="glass-tile rounded-xl p-2.5">
          <div className="text-[10px] text-[#6E7178]">Kuota AI / bln</div>
          <div className={`font-bold tabular-nums mt-0.5 ${plan.aiMonthlyQuota === 0 ? 'text-[#9E2420]' : 'text-[#1F7A4D]'}`}>
            {plan.aiMonthlyQuota === 0 ? 'Terkunci' : `${norm.aiUsed}/${plan.aiMonthlyQuota}`}
          </div>
        </div>
        <div className="glass-tile rounded-xl p-2.5">
          <div className="text-[10px] text-[#6E7178]">Cetak Paspor QR</div>
          <div className="font-bold text-[#2B2B2B] tabular-nums mt-0.5">
            {norm.qrPrintUsed}/{plan.qrPrintMonthlyQuota === null ? '∞' : plan.qrPrintMonthlyQuota}
          </div>
        </div>
      </div>
    </div>
  );
}
