import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Plus,
  QrCode,
  Scale,
  Send,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type {
  Animal,
  AppMode,
  AuthSession,
  FarmDatabase,
  KandangPage,
  SubscriptionState,
} from '../types/termu';
import {
  getActiveAnimals,
  getAnimalWeights,
  getDecisionSuggestions,
  getLatestWeight,
  getPBBH,
} from '../utils/calculations';
import {
  daysAgoISO,
  formatRp,
  formatRpCompact,
  formatShortDate,
  greeting,
  todayISO,
} from '../utils/format';
import { AnimalIllustration } from '../components/BrandLogo';
import { PlanQuotaSummaryCard } from '../components/SubscriptionModal';

interface DashboardPageProps {
  db: FarmDatabase;
  session: AuthSession;
  mode: AppMode;
  subscription: SubscriptionState;
  onNavigate: (page: KandangPage, animalId?: string) => void;
  onToggleTask: (taskId: string) => void;
  onOpenQuickAddAnimal: () => void;
  onOpenRecordWeight: (animalId?: string) => void;
  onOpenPassport: (animalId: string) => void;
  onOpenWAReport: () => void;
  onOpenQuickPen: () => void;
  onOpenUpgrade: (reason?: string) => void;
}

export function DashboardPage({
  db,
  session,
  mode,
  subscription,
  onNavigate,
  onToggleTask,
  onOpenQuickAddAnimal,
  onOpenRecordWeight,
  onOpenPassport,
  onOpenWAReport,
  onOpenQuickPen,
  onOpenUpgrade,
}: DashboardPageProps) {
  const [expandedDecision, setExpandedDecision] = useState<string | null>(null);
  const today = todayISO();
  const isOwner = session.role === 'pemilik';

  const activeAnimals = useMemo(() => getActiveAnimals(db), [db]);
  const healthyCount = useMemo(
    () => activeAnimals.filter((a) => a.status === 'sehat').length,
    [activeAnimals]
  );
  const attentionCount = useMemo(
    () => activeAnimals.filter((a) => a.status === 'perhatian').length,
    [activeAnimals]
  );
  const readySaleCount = useMemo(
    () => activeAnimals.filter((a) => a.ready_for_sale).length,
    [activeAnimals]
  );

  const cows = useMemo(() => activeAnimals.filter((a) => a.species === 'Sapi'), [activeAnimals]);
  const avgWeightGroup = cows.length > 0 ? cows : activeAnimals;
  const avgWeight = useMemo(() => {
    if (!avgWeightGroup.length) return 0;
    const sum = avgWeightGroup.reduce((acc, a) => acc + getLatestWeight(db, a), 0);
    return +(sum / avgWeightGroup.length).toFixed(0);
  }, [avgWeightGroup, db]);

  const feedTodayCost = useMemo(
    () =>
      (db.feed_logs || [])
        .filter((l) => l.date === today)
        .reduce((acc, x) => acc + (Number(x.cost) || 0), 0),
    [db.feed_logs, today]
  );
  const dailyBudget = Math.max(1, Number(db.farm.daily_feed_budget) || 500000);
  const feedBudgetPct = Math.min(100, Math.round((feedTodayCost / dailyBudget) * 100));

  const todayTasks = useMemo(
    () => (db.tasks || []).filter((t) => t.date === today),
    [db.tasks, today]
  );
  const tasksDoneCount = useMemo(
    () => todayTasks.filter((t) => t.done).length,
    [todayTasks]
  );

  const suggestions = useMemo(() => getDecisionSuggestions(db, today), [db, today]);

  const featuredAnimal: Animal | null = useMemo(() => {
    if (!activeAnimals.length) return null;
    return (
      activeAnimals.find((a) => a.ready_for_sale && a.species === 'Sapi') ||
      activeAnimals.find((a) => a.species === 'Sapi') ||
      activeAnimals[0]
    );
  }, [activeAnimals]);

  const featuredWeight = featuredAnimal ? getLatestWeight(db, featuredAnimal) : 0;
  const featuredPbbh = featuredAnimal ? getPBBH(db, featuredAnimal.id) : null;
  const featuredPen = featuredAnimal ? db.pens.find((p) => p.id === featuredAnimal.pen_id) : null;

  // Weekly average growth bars (7 buckets)
  const weeklyBars = useMemo(() => {
    const labels = ['6 mgg', '5 mgg', '4 mgg', '3 mgg', '2 mgg', '1 mgg', 'Kini'];
    if (!activeAnimals.length) {
      return labels.map((label) => ({ label, value: 0, pct: 12 }));
    }
    const baseAvg = avgWeight || 300;
    const targetSeries = activeAnimals.slice(0, 6);
    const weightsByWeek = labels.map((label, idx) => {
      const cutoff = daysAgoISO((6 - idx) * 7);
      let sum = 0;
      let count = 0;
      for (const an of targetSeries) {
        const list = getAnimalWeights(db, an.id).filter((w) => w.date <= cutoff);
        if (list.length > 0) {
          sum += list[list.length - 1].kg;
          count++;
        } else {
          sum += an.entry_weight;
          count++;
        }
      }
      const val = count > 0 ? Math.round(sum / count) : baseAvg;
      return { label, value: val };
    });
    const minVal = Math.min(...weightsByWeek.map((x) => x.value));
    const maxVal = Math.max(...weightsByWeek.map((x) => x.value), minVal + 10);
    return weightsByWeek.map((item) => ({
      ...item,
      pct: Math.max(24, Math.min(100, Math.round(((item.value - minVal * 0.92) / (maxVal - minVal * 0.92 || 1)) * 100))),
    }));
  }, [activeAnimals, avgWeight, db]);

  const upcomingSchedules = useMemo(
    () =>
      [...(db.schedules || [])]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5),
    [db.schedules]
  );

  // Live mode onboarding checklist
  const liveSteps = [
    {
      id: 'step-pen',
      label: 'Buat minimal 1 kandang / sekat',
      done: (db.pens || []).length > 0,
      action: onOpenQuickPen,
      cta: 'Tambah Sekat',
    },
    {
      id: 'step-animal',
      label: 'Tambah data ternak pertama Anda',
      done: activeAnimals.length > 0,
      action: onOpenQuickAddAnimal,
      cta: 'Tambah Ternak',
    },
    {
      id: 'step-weight',
      label: 'Catat bobot awal / perkembangan ternak',
      done: (db.weights || []).length >= 2,
      action: () => onOpenRecordWeight(),
      cta: 'Catat Bobot',
    },
    {
      id: 'step-feed',
      label: 'Catat stok pakan & pemberian harian',
      done: (db.feed_logs || []).length > 0,
      action: () => onNavigate('pakan'),
      cta: 'Buka Pakan',
    },
  ];
  const showLiveChecklist = mode === 'live' && liveSteps.some((s) => !s.done);

  // Feed Ring SVG geometry
  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (feedBudgetPct / 100) * ringCircumference;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Greeting & 3 Key Metrics */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-5">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-[#6E7178]">
            {greeting()}, {session.name}
          </p>
          <h1 className="font-display text-[28px] sm:text-4xl font-semibold text-[#2B2B2B] tracking-tight leading-[1.12] mt-1">
            {db.farm.name || 'Kandang Anda'}
          </h1>
          <p className="mt-1.5 text-xs text-[#5A5D64] leading-relaxed">
            <span className="font-semibold text-[#2B2B2B]">{db.farm.location || 'Lokasi belum diatur'}</span>
            <span className="mx-1.5 text-[#9CA3AF]">·</span>
            <span>{mode === 'demo' ? 'Mode Demo' : 'Peternakan Saya'}</span>
            <span className="mx-1.5 text-[#9CA3AF]">·</span>
            <span className="font-medium text-[#2B2B2B]">{isOwner ? 'Pemilik' : 'Pekerja Kandang'}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 shrink-0">
          <div className="glass-tile rounded-2xl px-3.5 sm:px-4 py-3">
            <div className="text-[11px] font-semibold text-[#6E7178]">Populasi Aktif</div>
            <div className="font-metric text-3xl sm:text-4xl text-[#2B2B2B] leading-none mt-1.5 tabular-nums">
              {activeAnimals.length}
            </div>
            <div className="text-[11px] text-[#6E7178] mt-1">ekor di {db.pens.length} sekat</div>
          </div>
          <div className="glass-tile rounded-2xl px-3.5 sm:px-4 py-3">
            <div className="text-[11px] font-semibold text-[#6E7178]">
              Rata-rata {cows.length > 0 ? 'Sapi' : 'Bobot'}
            </div>
            <div className="font-metric text-3xl sm:text-4xl text-[#2B2B2B] leading-none mt-1.5 tabular-nums">
              {avgWeight}
              <span className="text-sm sm:text-base font-sans font-semibold text-[#6E7178] ml-0.5">kg</span>
            </div>
            <div className="text-[11px] text-[#6E7178] mt-1">bobot hidup kini</div>
          </div>
          <div className="col-span-2 sm:col-span-1 glass-tile rounded-2xl px-3.5 sm:px-4 py-3 flex sm:block items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-[#6E7178]">Siap Jual</div>
              <div className="text-[11px] text-[#6E7178] sm:hidden mt-0.5">ekor tayang di lapak</div>
            </div>
            <div className="flex sm:block items-baseline gap-1.5">
              <div className="font-metric text-3xl sm:text-4xl text-[#2B2B2B] leading-none sm:mt-1.5 tabular-nums">
                {readySaleCount}
              </div>
              <div className="text-[11px] text-[#6E7178] hidden sm:block mt-1">ekor di lapak</div>
              <span className="text-xs font-semibold text-[#6E7178] sm:hidden">ekor</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Status Progress Controls — No Truncation on 360px Mobile */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => onNavigate('ternak')}
          className="text-left glass-pill rounded-2xl sm:rounded-full px-3.5 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 hover:bg-white transition"
        >
          <span className="text-xs font-semibold text-[#2B2B2B] leading-tight">Ternak Sehat</span>
          <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full bg-[#2B2B2B] text-white text-[11px] font-bold tabular-nums whitespace-nowrap shrink-0">
            {healthyCount}/{activeAnimals.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('kesehatan')}
          className="text-left pill-striped rounded-2xl sm:rounded-full px-3.5 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 hover:bg-white transition"
        >
          <span className="text-xs font-semibold text-[#2B2B2B] leading-tight">Perhatian</span>
          <span className={`self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[11px] font-bold tabular-nums whitespace-nowrap shrink-0 ${attentionCount > 0 ? 'bg-[#C93B3B] text-white' : 'bg-white text-[#2B2B2B]'}`}>
            {attentionCount} ekor
          </span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('kandang')}
          className="text-left glass-accent rounded-2xl sm:rounded-full px-3.5 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 transition"
        >
          <span className="text-xs font-semibold text-[#2B2B2B] leading-tight">Tugas Hari Ini</span>
          <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full bg-[#2B2B2B] text-white text-[11px] font-bold tabular-nums whitespace-nowrap shrink-0">
            {tasksDoneCount}/{todayTasks.length}
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenWAReport}
          className="text-left glass-pill rounded-2xl sm:rounded-full px-3.5 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 hover:bg-white transition"
        >
          <span className="text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5 leading-tight">
            <Send className="w-3.5 h-3.5 text-[#1F7A4D] shrink-0" /> Laporan WA
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F7A4D] sm:text-[#6E7178]">
            <span className="sm:hidden">Kirim</span>
            <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          </span>
        </button>
      </section>

      {/* Active Subscription & Quota Summary */}
      <PlanQuotaSummaryCard db={db} subscription={subscription} onOpenUpgrade={onOpenUpgrade} />

      {/* Mode Live Getting Started Checklist */}
      {showLiveChecklist && (
        <section className="bento-card p-5 border-2 border-[#F5D547]/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#2B2B2B]">
                Mulai dari Sini — Siapkan Kandang Anda
              </h2>
              <p className="text-xs text-[#6E7178]">
                Lengkapi 4 langkah awal ini agar grafik pertumbuhan, pakan, dan saran harian aktif otomatis.
              </p>
            </div>
            <span className="text-xs font-bold text-[#2B2B2B] glass-accent px-3 py-1 rounded-full self-start">
              {liveSteps.filter((s) => s.done).length}/4 Selesai
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {liveSteps.map((step) => (
              <div
                key={step.id}
                className={`rounded-2xl p-3.5 border flex flex-col justify-between gap-3 ${
                  step.done ? 'bg-[#E9F7EF]/85 border-[#1F7A4D]/25' : 'glass-tile'
                }`}
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 mt-0.5 ${step.done ? 'text-[#1F7A4D]' : 'text-[#9CA3AF]'}`}
                  />
                  <span className={`text-xs font-semibold ${step.done ? 'text-[#1F7A4D] line-through' : 'text-[#2B2B2B]'}`}>
                    {step.label}
                  </span>
                </div>
                {!step.done && (
                  <button
                    type="button"
                    onClick={step.action}
                    className="w-full py-2 rounded-xl bg-[#2B2B2B] text-white text-xs font-semibold hover:bg-black transition"
                  >
                    {step.cta}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Bento Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Col 1: Featured Animal & Quick Actions */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bento-card p-5 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-semibold text-[#2B2B2B]">Sorotan Ternak</h2>
              <button
                type="button"
                onClick={() => onNavigate('ternak')}
                className="text-xs font-semibold text-[#6E7178] hover:text-[#2B2B2B] inline-flex items-center gap-1"
              >
                Semua <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {featuredAnimal ? (
              <div>
                <div className="relative h-44 rounded-[22px] overflow-hidden mb-3.5 bg-[#ECE5DC]">
                  {featuredAnimal.photo ? (
                    <img
                      src={featuredAnimal.photo}
                      alt={featuredAnimal.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AnimalIllustration species={featuredAnimal.species} breed={featuredAnimal.breed} />
                  )}
                  <div className="absolute top-3 left-3 glass-caption text-white px-3 py-1 rounded-full text-[11px] font-semibold">
                    {featuredAnimal.id} • {featuredPen ? `Sekat ${featuredPen.code}` : 'Tanpa Sekat'}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 glass-caption text-white rounded-2xl px-3.5 py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-display font-semibold text-base leading-tight">
                        {featuredAnimal.name}
                      </div>
                      <div className="text-[11px] text-white/80">
                        {featuredAnimal.species} {featuredAnimal.breed}
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="font-display font-bold text-lg leading-tight">{featuredWeight} kg</div>
                      <div className="text-[10px] text-[#F5D547] font-semibold">
                        {featuredPbbh !== null ? `+${featuredPbbh} kg/hr` : 'Catat timbang'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('ternak', featuredAnimal.id)}
                    className="btn-touch rounded-xl glass-tile hover:bg-white text-xs font-semibold text-[#2B2B2B]"
                  >
                    Profil
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenRecordWeight(featuredAnimal.id)}
                    className="btn-touch rounded-xl bg-[#2B2B2B] hover:bg-black text-white text-xs font-semibold inline-flex items-center justify-center gap-1"
                  >
                    <Scale className="w-3.5 h-3.5" /> Timbang
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPassport(featuredAnimal.id)}
                    className="btn-touch rounded-xl glass-accent text-xs font-bold text-[#2B2B2B] inline-flex items-center justify-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" /> QR
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl glass-tile p-6 text-center space-y-3">
                <p className="text-xs text-[#6E7178]">Belum ada ternak terdaftar di kandang Anda.</p>
                <button
                  type="button"
                  onClick={onOpenQuickAddAnimal}
                  className="btn-touch px-4 py-2 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Tambah Ternak Pertama
                </button>
              </div>
            )}
          </div>

          {/* Decision Engine Accordion */}
          <div className="bento-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2B2B2B]" />
                <h2 className="font-display text-base font-semibold text-[#2B2B2B]">Saran Hari Ini</h2>
              </div>
              <span className="text-[11px] font-bold text-[#6E7178] tabular-nums">
                {suggestions.length} catatan
              </span>
            </div>

            {suggestions.length === 0 ? (
              <div className="rounded-2xl glass-tile p-4 text-xs text-[#6E7178]">
                Kondisi kandang terpantau stabil. Tidak ada peringatan mendesak saat ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {suggestions.slice(0, 5).map((item) => {
                  const isOpen = expandedDecision === item.id;
                  const badgeTone =
                    item.level === 'danger'
                      ? 'bg-[#FCE8E8] text-[#9E2420]'
                      : item.level === 'warning'
                        ? 'bg-[#FFF3DA] text-[#8B4C06]'
                        : 'bg-[#E9F7EF] text-[#1F7A4D]';
                  return (
                    <div key={item.id} className="glass-tile rounded-2xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedDecision(isOpen ? null : item.id)}
                        className="w-full p-3.5 text-left flex items-start justify-between gap-2.5"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 mt-0.5 ${badgeTone}`}>
                            {item.level === 'danger' ? 'Tahan' : item.level === 'warning' ? 'Cek' : 'Optimal'}
                          </span>
                          <span className="text-xs font-semibold text-[#2B2B2B] leading-snug">
                            {item.title}
                          </span>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#6E7178] shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#6E7178] shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-3.5 pb-3.5 pt-0 space-y-2.5 border-t border-black/[0.05]">
                          <p className="text-xs text-[#6E7178] pt-2.5 leading-relaxed">{item.reason}</p>
                          <button
                            type="button"
                            onClick={() => onNavigate(item.actionPage, item.animalId || undefined)}
                            className="px-3.5 py-2 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold hover:bg-black transition inline-flex items-center gap-1"
                          >
                            {item.actionLabel} <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Col 2: Weekly Weight Bar Chart & Daily Feed Budget Ring */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bento-card p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-base font-semibold text-[#2B2B2B]">
                Tren Bobot Mingguan
              </h2>
              <TrendingUp className="w-4 h-4 text-[#1F7A4D]" />
            </div>
            <p className="text-xs text-[#6E7178] mb-5">
              Rata-rata bobot sampel ternak 6 minggu terakhir (kg).
            </p>

            <div className="h-44 flex items-end justify-between gap-2 px-1">
              {weeklyBars.map((bar, idx) => {
                const isLast = idx === weeklyBars.length - 1;
                return (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] font-bold text-[#2B2B2B] tabular-nums">
                      {bar.value || '-'}
                    </span>
                    <div className="w-full max-w-[34px] h-28 rounded-full bg-black/[0.05] flex items-end overflow-hidden p-0.5">
                      <div
                        className={`w-full rounded-full transition-all duration-300 ${
                          isLast ? 'bg-[#F5D547]' : 'bg-[#2B2B2B]'
                        }`}
                        style={{ height: `${bar.pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-[#6E7178] whitespace-nowrap">
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Feed Budget Ring */}
          <div className="bento-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-display text-base font-semibold text-[#2B2B2B]">
                  Biaya Pakan Hari Ini
                </h2>
                <p className="text-xs text-[#6E7178]">Bandingkan dengan anggaran harian</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('pakan')}
                className="text-xs font-semibold text-[#2B2B2B] glass-tile px-3 py-1.5 rounded-full hover:bg-white"
              >
                Catat Pakan
              </button>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative w-28 h-28 shrink-0">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r={ringRadius}
                    fill="none"
                    stroke="rgba(43,43,43,0.09)"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={ringRadius}
                    fill="none"
                    stroke={feedBudgetPct > 95 ? '#C93B3B' : '#F5D547'}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-metric text-2xl text-[#2B2B2B]">{feedBudgetPct}%</span>
                  <span className="text-[10px] text-[#6E7178] font-semibold">terpakai</span>
                </div>
              </div>

              <div className="space-y-2 min-w-0 flex-1">
                <div className="glass-tile rounded-xl p-2.5">
                  <div className="text-[10px] font-semibold text-[#6E7178]">Tercatat Hari Ini</div>
                  <div className="font-display font-bold text-base text-[#2B2B2B] tabular-nums">
                    {formatRp(feedTodayCost)}
                  </div>
                </div>
                <div className="glass-tile rounded-xl p-2.5">
                  <div className="text-[10px] font-semibold text-[#6E7178]">Anggaran Harian</div>
                  <div className="text-xs font-bold text-[#2B2B2B] tabular-nums">
                    {formatRpCompact(dailyBudget)} / hari
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Dark Tasks Card & Weekly Schedule */}
        <div className="lg:col-span-4 space-y-5">
          {/* Dark Bento Task Card */}
          <div className="bento-card-dark p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#F5D547]" />
                <h2 className="font-display text-base font-semibold text-white">Tugas Kandang Hari Ini</h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#F5D547] text-[#2B2B2B] text-xs font-bold tabular-nums">
                {tasksDoneCount}/{todayTasks.length}
              </span>
            </div>

            {todayTasks.length === 0 ? (
              <div className="rounded-2xl bg-white/10 p-4 text-xs text-white/75 space-y-2">
                <p>Belum ada daftar tugas hari ini.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('kandang')}
                  className="px-3 py-1.5 rounded-full bg-[#F5D547] text-[#2B2B2B] font-bold text-xs"
                >
                  Buat Checklist di Kandang
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {todayTasks.slice(0, 7).map((task) => {
                  const pen = db.pens.find((p) => p.id === task.pen_id);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onToggleTask(task.id)}
                      className={`w-full text-left rounded-2xl px-3.5 py-3 flex items-start gap-3 transition border ${
                        task.done
                          ? 'bg-white/[0.06] border-white/10 text-white/60'
                          : 'bg-white/[0.11] hover:bg-white/[0.16] border-white/15 text-white'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                          task.done
                            ? 'bg-[#F5D547] border-[#F5D547] text-[#2B2B2B]'
                            : 'border-white/40 text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-semibold leading-snug ${task.done ? 'line-through' : ''}`}>
                          {task.item}
                        </div>
                        <div className="text-[10px] text-white/60 mt-0.5">
                          {pen ? `Sekat ${pen.code}` : 'Umum'}
                          {task.done && task.done_by ? ` • ${task.done_by} (${task.done_at})` : ''}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => onNavigate('kandang')}
              className="mt-3 w-full py-2.5 rounded-full bg-white/12 hover:bg-white/20 text-white text-xs font-semibold transition"
            >
              Kelola Semua Tugas di Menu Kandang
            </button>
          </div>

          {/* Upcoming Schedule */}
          <div className="bento-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2B2B2B]" />
                <h2 className="font-display text-base font-semibold text-[#2B2B2B]">Jadwal Kesehatan</h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('kesehatan')}
                className="text-xs font-semibold text-[#6E7178] hover:text-[#2B2B2B]"
              >
                Lihat Semua
              </button>
            </div>

            {upcomingSchedules.length === 0 ? (
              <p className="text-xs text-[#6E7178]">Belum ada jadwal vaksin, obat cacing, atau kontrol rutin.</p>
            ) : (
              <div className="space-y-2">
                {upcomingSchedules.map((sch) => {
                  const isOverdue = !sch.done && sch.date < today;
                  return (
                    <div
                      key={sch.id}
                      className="glass-tile rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2.5"
                    >
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold truncate ${sch.done ? 'line-through text-[#6E7178]' : 'text-[#2B2B2B]'}`}>
                          {sch.title}
                        </div>
                        <div className="text-[11px] text-[#6E7178] flex items-center gap-1.5 mt-0.5">
                          <span>{formatShortDate(sch.date)}</span>
                          <span>•</span>
                          <span>{sch.category}</span>
                        </div>
                      </div>
                      {isOverdue ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#FCE8E8] text-[#9E2420] text-[10px] font-bold inline-flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-3 h-3" /> Terlewat
                        </span>
                      ) : sch.done ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#E9F7EF] text-[#1F7A4D] text-[10px] font-bold shrink-0">
                          Selesai
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-[#FBF6E3] text-[#2B2B2B] text-[10px] font-bold shrink-0">
                          {sch.time || 'Terjadwal'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
