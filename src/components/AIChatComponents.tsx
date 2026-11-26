import { useMemo, useRef, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Brain,
  Check,
  Crown,
  Database,
  Loader2,
  Lock,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import type {
  AIChatMessage,
  AIIntelligenceLevel,
  AppMode,
  FarmDatabase,
  MarketplaceOrder,
  SellerReview,
  SubscriptionState,
  UserRole,
} from '../types/termu';
import { getActiveAnimals, getFarmPredictionsSummary } from '../utils/calculations';
import { askFarmAI } from '../utils/aiClient';
import { nowTimeStr, todayISO, uid } from '../utils/format';
import {
  AI_INTELLIGENCE_LEVELS,
  ALL_AI_INTELLIGENCE_LEVELS,
  canUseAI,
  canUseAIIntelligence,
  getDefaultAIIntelligence,
  getPlanConfig,
  normalizeSubscription,
} from '../utils/subscription';
import { AILockedGate } from './SubscriptionModal';

function renderFormattedText(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className={line.trim() === '' ? 'h-2' : 'leading-relaxed'}>
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={j} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </p>
    );
  });
}

function IntelligenceIcon({ level, className }: { level: AIIntelligenceLevel; className?: string }) {
  if (level === 'cepat') return <Zap className={className} />;
  if (level === 'cerdas') return <Brain className={className} />;
  return <Sparkles className={className} />;
}

const OWNER_QUICK_PROMPTS = [
  'Ringkas kondisi ternak, kas & pesanan saya saat ini',
  'Buatkan caption promosi WhatsApp untuk sapi siap jual saya',
  'Prediksi bobot sapi & stok pakan 30 hari lagi',
  'Jelaskan strategi meningkatkan profit & efisiensi pakan',
];

const WORKER_QUICK_PROMPTS = [
  'Ternak mana yang butuh perhatian hari ini?',
  'Stok bahan pakan apa yang paling cepat habis?',
  'Prediksi bobot sapi 30 & 60 hari lagi',
  'Tips menjaga kebersihan kandang saat musim hujan',
];

interface AIChatSharedProps {
  db: FarmDatabase;
  ownerName: string;
  role: UserRole;
  mode: AppMode;
  subscription: SubscriptionState;
  orders: MarketplaceOrder[];
  reviews: SellerReview[];
  messages: AIChatMessage[];
  intelligenceLevel: AIIntelligenceLevel;
  includeOwnerData: boolean;
  onChangeIntelligenceLevel: (level: AIIntelligenceLevel) => void;
  onToggleOwnerData: (enabled: boolean) => void;
  onAppendMessages: (msgs: AIChatMessage[]) => void;
  onResetMessages: () => void;
  onConsumeAIQuota: () => void;
  onOpenUpgrade: (reason?: string) => void;
}

export function AIChatPage({
  db,
  ownerName,
  role,
  mode,
  subscription,
  orders,
  reviews,
  messages,
  intelligenceLevel,
  includeOwnerData,
  onChangeIntelligenceLevel,
  onToggleOwnerData,
  onAppendMessages,
  onResetMessages,
  onConsumeAIQuota,
  onOpenUpgrade,
}: AIChatSharedProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const today = todayISO();
  const normSub = normalizeSubscription(subscription);
  const plan = getPlanConfig(normSub.tier);
  const aiCheck = canUseAI(normSub, today);
  const isOwner = role === 'pemilik';

  const effectiveLevel: AIIntelligenceLevel = canUseAIIntelligence(normSub.tier, intelligenceLevel).allowed
    ? intelligenceLevel
    : getDefaultAIIntelligence(normSub.tier);
  const activeLevelCfg = AI_INTELLIGENCE_LEVELS[effectiveLevel];

  const summary = useMemo(() => getFarmPredictionsSummary(db, today), [db, today]);
  const activeCount = useMemo(() => getActiveAnimals(db).length, [db]);
  const quickPrompts = isOwner ? OWNER_QUICK_PROMPTS : WORKER_QUICK_PROMPTS;

  function handleSelectIntelligence(level: AIIntelligenceLevel) {
    const check = canUseAIIntelligence(normSub.tier, level);
    if (!check.allowed) {
      onOpenUpgrade(check.reason);
      return;
    }
    onChangeIntelligenceLevel(level);
  }

  async function sendQuestion(question: string) {
    const clean = question.trim();
    if (!clean || loading) return;

    const latestCheck = canUseAI(subscription, today);
    if (!latestCheck.allowed) {
      onOpenUpgrade(latestCheck.reason);
      return;
    }

    const levelCheck = canUseAIIntelligence(normSub.tier, effectiveLevel);
    if (!levelCheck.allowed) {
      onOpenUpgrade(levelCheck.reason);
      return;
    }

    const userMsg: AIChatMessage = {
      id: uid('msg'),
      role: 'user',
      text: clean,
      time: nowTimeStr(),
    };
    onAppendMessages([userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await askFarmAI({
        question: clean,
        db,
        role,
        mode,
        history: [...messages, userMsg],
        intelligenceLevel: effectiveLevel,
        tier: normSub.tier,
        includeOwnerData,
        ownerName,
        orders,
        reviews,
      });
      if (!reply.isError) {
        onConsumeAIQuota();
      }
      onAppendMessages([
        {
          id: uid('msg'),
          role: 'ai',
          text: reply.text,
          source: reply.source,
          intelligenceLevel: reply.intelligenceLevel || effectiveLevel,
          time: nowTimeStr(),
          isError: reply.isError,
        },
      ]);
    } catch {
      onAppendMessages([
        {
          id: uid('msg'),
          role: 'ai',
          text: 'Gagal menghubungi server AI TERMU. Periksa koneksi jaringan Anda lalu coba lagi.',
          source: 'Status Koneksi',
          time: nowTimeStr(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B2B2B]">
            Chatbot AI TERMU
          </h1>
          <p className="text-xs text-[#6E7178] mt-0.5">
            Tanyakan apa saja—topik umum, bisnis, promosi, hingga analisis otomatis seluruh data kandang &amp; pemilik Anda.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenUpgrade()}
          className="px-3.5 py-2 rounded-full glass-pill hover:bg-white text-xs font-bold text-[#2B2B2B] inline-flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap"
        >
          <Crown className="w-3.5 h-3.5 text-[#B58100]" />
          <span>
            {aiCheck.limit === 0
              ? `Paket ${plan.name} · AI Terkunci`
              : `Kuota AI (${plan.name}): ${aiCheck.remaining}/${aiCheck.limit} tersisa`}
          </span>
        </button>
      </div>

      {/* 3-Tier AI Intelligence Picker — Always Visible So Users See Premium Differentiation */}
      <section className="bento-card p-4 sm:p-5 space-y-3" aria-label="Pilih Tingkat Kecerdasan AI">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-sm sm:text-base font-semibold text-[#2B2B2B]">
              Pilih Tingkat Kecerdasan AI
            </h2>
            <p className="text-[11px] text-[#6E7178]">
              Semakin tinggi paket langganan Anda (Plus → Pro → Enterprise), semakin dalam tingkat kecerdasan AI yang terbuka.
            </p>
          </div>
          {aiCheck.allowed && (
            <span className="text-[11px] font-semibold text-[#1F7A4D] bg-[#E9F7EF] px-3 py-1 rounded-full self-start sm:self-auto whitespace-nowrap">
              Aktif: {activeLevelCfg.name}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {ALL_AI_INTELLIGENCE_LEVELS.map((levelId) => {
            const cfg = AI_INTELLIGENCE_LEVELS[levelId];
            const unlocked = canUseAIIntelligence(normSub.tier, levelId).allowed;
            const isSelected = unlocked && effectiveLevel === levelId;

            return (
              <button
                key={levelId}
                type="button"
                onClick={() => handleSelectIntelligence(levelId)}
                aria-pressed={isSelected}
                className={`text-left rounded-2xl p-3.5 transition border flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-[#2B2B2B] text-white border-[#2B2B2B] shadow-md'
                    : unlocked
                      ? 'glass-tile hover:bg-white text-[#2B2B2B] border-black/[0.08]'
                      : 'bg-white/50 text-[#5A5D64] border-dashed border-black/15 hover:border-[#2B2B2B]/40'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-display text-sm font-semibold">
                      <IntelligenceIcon
                        level={levelId}
                        className={`w-4 h-4 shrink-0 ${
                          isSelected
                            ? 'text-[#F5D547]'
                            : unlocked
                              ? 'text-[#B58100]'
                              : 'text-[#8C8F96]'
                        }`}
                      />
                      <span>{cfg.name}</span>
                    </span>

                    {isSelected ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#F5D547] text-[#2B2B2B] text-[10px] font-bold inline-flex items-center gap-0.5 shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" /> Dipilih
                      </span>
                    ) : unlocked ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#E9F7EF] text-[#1F7A4D] text-[10px] font-bold shrink-0">
                        Terbuka
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#FFF3DA] text-[#8B4C06] text-[10px] font-bold inline-flex items-center gap-1 shrink-0">
                        <Lock className="w-2.5 h-2.5" /> {cfg.minTierLabel}
                      </span>
                    )}
                  </div>

                  <div
                    className={`text-[11px] font-semibold ${
                      isSelected ? 'text-[#F5D547]' : 'text-[#5A5D64]'
                    }`}
                  >
                    {cfg.engineLabel}
                  </div>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      isSelected ? 'text-white/80' : 'text-[#6E7178]'
                    }`}
                  >
                    {cfg.description}
                  </p>
                </div>

                <div
                  className={`pt-2 border-t text-[10px] font-semibold flex items-center justify-between ${
                    isSelected
                      ? 'border-white/15 text-white/75'
                      : 'border-black/[0.06] text-[#6E7178]'
                  }`}
                >
                  <span>Paket minimal: {cfg.minTierLabel}</span>
                  <span>{unlocked ? (isSelected ? 'Sedang dipakai' : 'Ketuk untuk pakai') : 'Upgrade →'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3 Snapshot Prediction Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bento-card p-4">
          <div className="text-[11px] font-semibold text-[#6E7178]">Rata-rata Bobot {summary.groupLabel}</div>
          <div className="font-metric text-3xl text-[#2B2B2B] mt-1 tabular-nums">{summary.avgNow} kg</div>
          <div className="text-[11px] text-[#1F7A4D] font-semibold mt-1 tabular-nums">
            +30 hr: ±{summary.avg30} kg · +60 hr: ±{summary.avg60} kg
          </div>
        </div>
        <div className="bento-card p-4">
          <div className="text-[11px] font-semibold text-[#6E7178]">Stok Pakan Terkritis</div>
          <div className="font-display text-lg font-semibold text-[#2B2B2B] mt-1 truncate">
            {summary.lowFeeds[0] ? summary.lowFeeds[0].name : 'Belum ada data'}
          </div>
          <div className="text-[11px] text-[#6E7178] mt-1">
            {summary.lowFeeds[0]
              ? `Tersisa ${summary.lowFeeds[0].stock_kg} kg (±${Math.max(1, summary.lowFeeds[0].daysLeft)} hari)`
              : 'Tambahkan bahan pakan'}
          </div>
        </div>
        <div className="bento-card p-4">
          <div className="text-[11px] font-semibold text-[#6E7178]">Kandidat Siap Jual Teratas</div>
          <div className="font-display text-lg font-semibold text-[#2B2B2B] mt-1 truncate">
            {summary.readyCandidates[0]
              ? `${summary.readyCandidates[0].an.name} (${summary.readyCandidates[0].an.id})`
              : 'Belum ada'}
          </div>
          <div className="text-[11px] text-[#6E7178] mt-1 tabular-nums">
            {summary.readyCandidates[0]
              ? `${summary.readyCandidates[0].latestW} kg · PBBH ${summary.readyCandidates[0].pbbh} kg/hr`
              : '-'}
          </div>
        </div>
      </section>

      {/* Main Chat Container or Locked Gate */}
      {!aiCheck.allowed ? (
        <AILockedGate
          tier={normSub.tier}
          reason={aiCheck.reason || 'Upgrade paket untuk mengakses Chatbot AI TERMU.'}
          used={aiCheck.used}
          limit={aiCheck.limit}
          title="Chatbot AI TERMU Khusus Paket Premium"
          onOpenUpgrade={onOpenUpgrade}
        />
      ) : (
        <section className="bento-card p-4 sm:p-5 flex flex-col gap-3.5">
          {/* Owner Data Access Toggle & Reset Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/[0.06]">
            <button
              type="button"
              onClick={() => onToggleOwnerData(!includeOwnerData)}
              aria-pressed={includeOwnerData}
              className={`min-h-[36px] px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-2 transition ${
                includeOwnerData
                  ? 'bg-[#E9F7EF] text-[#1F7A4D] border border-[#1F7A4D]/25'
                  : 'glass-tile text-[#5A5D64]'
              }`}
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span>
                {includeOwnerData
                  ? isOwner
                    ? `Baca Data Pemilik: Aktif (${activeCount} ternak, kas & pesanan)`
                    : `Baca Data Kandang: Aktif (${activeCount} ternak)`
                  : 'Baca Data Pemilik: Nonaktif (Chat Umum)'}
              </span>
            </button>

            <button
              type="button"
              onClick={onResetMessages}
              disabled={loading}
              className="min-h-[36px] px-3 py-1.5 rounded-full glass-tile hover:bg-white text-[11px] font-semibold text-[#5A5D64] hover:text-[#2B2B2B] inline-flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Obrolan
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendQuestion(prompt)}
                disabled={loading}
                className="px-3 py-1.5 rounded-full glass-tile hover:bg-white text-[11px] sm:text-xs font-semibold text-[#2B2B2B] transition text-left"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Stream */}
          <div className="space-y-3 min-h-[280px] max-h-[460px] overflow-y-auto pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 py-3 text-xs space-y-1 ${
                    m.role === 'user'
                      ? 'bg-[#2B2B2B] text-white'
                      : m.isError
                        ? 'bg-[#FCE8E8] border border-[#9E2420]/25 text-[#9E2420]'
                        : 'glass-tile text-[#2B2B2B]'
                  }`}
                >
                  {m.role === 'ai' && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-75 mb-1">
                      {m.isError ? (
                        <AlertCircle className="w-3 h-3" />
                      ) : m.intelligenceLevel ? (
                        <IntelligenceIcon level={m.intelligenceLevel} className="w-3 h-3 text-[#B58100]" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>{m.source || 'Chatbot AI TERMU'}</span>
                      <span>· {m.time}</span>
                    </div>
                  )}
                  <div className="space-y-1">{renderFormattedText(m.text)}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="glass-tile rounded-2xl px-4 py-3 text-xs text-[#6E7178] inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {activeLevelCfg.name} sedang berpikir
                    {includeOwnerData ? ' & membaca data pemilik...' : '...'}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              sendQuestion(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Tanya apa saja ke ${activeLevelCfg.name}...`}
              aria-label="Pertanyaan untuk Chatbot AI TERMU"
              className="flex-1 min-w-0 px-4 py-3 rounded-full bg-white border border-black/10 text-xs"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-touch px-4 sm:px-5 rounded-full bg-[#2B2B2B] hover:bg-black disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

export function FloatingAIChat({
  db,
  ownerName,
  role,
  mode,
  subscription,
  orders,
  reviews,
  messages,
  intelligenceLevel,
  includeOwnerData,
  onChangeIntelligenceLevel,
  onToggleOwnerData,
  onAppendMessages,
  onConsumeAIQuota,
  onOpenUpgrade,
}: AIChatSharedProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const normSub = normalizeSubscription(subscription);
  const aiCheck = canUseAI(normSub);
  const effectiveLevel: AIIntelligenceLevel = canUseAIIntelligence(normSub.tier, intelligenceLevel).allowed
    ? intelligenceLevel
    : getDefaultAIIntelligence(normSub.tier);
  const activeLevelCfg = AI_INTELLIGENCE_LEVELS[effectiveLevel];

  function handlePickLevel(level: AIIntelligenceLevel) {
    const check = canUseAIIntelligence(normSub.tier, level);
    if (!check.allowed) {
      setOpen(false);
      onOpenUpgrade(check.reason);
      return;
    }
    onChangeIntelligenceLevel(level);
  }

  async function handleAsk(question: string) {
    const clean = question.trim();
    if (!clean || loading) return;
    const latestCheck = canUseAI(subscription);
    if (!latestCheck.allowed) {
      onOpenUpgrade(latestCheck.reason);
      return;
    }
    const levelCheck = canUseAIIntelligence(normSub.tier, effectiveLevel);
    if (!levelCheck.allowed) {
      onOpenUpgrade(levelCheck.reason);
      return;
    }
    const userMsg: AIChatMessage = {
      id: uid('msg'),
      role: 'user',
      text: clean,
      time: nowTimeStr(),
    };
    onAppendMessages([userMsg]);
    setInput('');
    setLoading(true);
    try {
      const reply = await askFarmAI({
        question: clean,
        db,
        role,
        mode,
        history: [...messages, userMsg],
        intelligenceLevel: effectiveLevel,
        tier: normSub.tier,
        includeOwnerData,
        ownerName,
        orders,
        reviews,
      });
      if (!reply.isError) {
        onConsumeAIQuota();
      }
      onAppendMessages([
        {
          id: uid('msg'),
          role: 'ai',
          text: reply.text,
          source: reply.source,
          intelligenceLevel: reply.intelligenceLevel || effectiveLevel,
          time: nowTimeStr(),
          isError: reply.isError,
        },
      ]);
    } catch {
      onAppendMessages([
        {
          id: uid('msg'),
          role: 'ai',
          text: 'Gagal terhubung ke server AI TERMU. Coba lagi beberapa saat.',
          source: 'Status Koneksi',
          time: nowTimeStr(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="no-print">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden lg:inline-flex fixed bottom-6 right-6 z-50 ai-fab text-white px-4 py-3 rounded-full items-center gap-2 text-xs font-semibold"
          aria-label="Buka Chatbot Tanya AI"
        >
          {aiCheck.allowed ? (
            <IntelligenceIcon level={effectiveLevel} className="w-4 h-4 text-[#F5D547]" />
          ) : (
            <Lock className="w-4 h-4 text-[#F5D547]" />
          )}
          <span>
            {aiCheck.allowed
              ? `Tanya AI · ${activeLevelCfg.shortLabel} (${aiCheck.remaining})`
              : 'Tanya AI · Premium'}
          </span>
        </button>
      ) : (
        <div
          className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm ai-drawer rounded-[28px] overflow-hidden flex flex-col max-h-[76vh] animate-modal"
          role="dialog"
          aria-label="Tanya Chatbot AI TERMU"
        >
          <div className="bg-[#2B2B2B] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#F5D547]" />
              <div>
                <div className="text-xs font-bold leading-tight">Chatbot AI TERMU</div>
                <div className="text-[10px] text-white/70">
                  {aiCheck.allowed
                    ? `${activeLevelCfg.name} · Sisa ${aiCheck.remaining}/${aiCheck.limit} kuota`
                    : 'Khusus paket Plus, Pro & Enterprise'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              aria-label="Tutup drawer Tanya AI"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!aiCheck.allowed ? (
            <div className="p-5 text-center space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-[#2B2B2B] text-[#F5D547] flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[#2B2B2B]">
                {normSub.tier === 'free' ? 'Akses AI Terkunci di Paket Gratis' : 'Kuota AI Bulan Ini Habis'}
              </div>
              <p className="text-[11px] text-[#6E7178] leading-relaxed">{aiCheck.reason}</p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenUpgrade(aiCheck.reason);
                }}
                className="btn-touch w-full rounded-full bg-[#2B2B2B] text-[#F5D547] text-xs font-bold inline-flex items-center justify-center gap-1.5"
              >
                <Crown className="w-4 h-4" /> Upgrade Paket Premium
              </button>
            </div>
          ) : (
            <>
              {/* Compact Intelligence Picker & Data Toggle */}
              <div className="px-3 py-2 bg-white/80 border-b border-black/[0.06] space-y-1.5">
                <div className="grid grid-cols-3 gap-1">
                  {ALL_AI_INTELLIGENCE_LEVELS.map((levelId) => {
                    const cfg = AI_INTELLIGENCE_LEVELS[levelId];
                    const unlocked = canUseAIIntelligence(normSub.tier, levelId).allowed;
                    const active = unlocked && effectiveLevel === levelId;
                    return (
                      <button
                        key={levelId}
                        type="button"
                        onClick={() => handlePickLevel(levelId)}
                        className={`h-8 rounded-full text-[11px] font-bold inline-flex items-center justify-center gap-1 transition ${
                          active
                            ? 'bg-[#2B2B2B] text-[#F5D547]'
                            : unlocked
                              ? 'glass-tile text-[#2B2B2B] hover:bg-white'
                              : 'bg-black/[0.04] text-[#8C8F96]'
                        }`}
                      >
                        {unlocked ? (
                          <IntelligenceIcon level={levelId} className="w-3 h-3" />
                        ) : (
                          <Lock className="w-2.5 h-2.5" />
                        )}
                        <span>{cfg.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => onToggleOwnerData(!includeOwnerData)}
                  className={`w-full py-1 px-2.5 rounded-full text-[10px] font-semibold inline-flex items-center justify-center gap-1.5 transition ${
                    includeOwnerData
                      ? 'bg-[#E9F7EF] text-[#1F7A4D]'
                      : 'bg-black/[0.05] text-[#6E7178]'
                  }`}
                >
                  <Database className="w-3 h-3" />
                  <span>
                    {includeOwnerData ? 'Baca Data Pemilik: Aktif' : 'Mode Chat Umum (Data Nonaktif)'}
                  </span>
                </button>
              </div>

              <div className="p-3.5 space-y-2.5 overflow-y-auto flex-1 min-h-[210px]">
                {messages.slice(-8).map((m) => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs ${
                        m.role === 'user'
                          ? 'bg-[#2B2B2B] text-white'
                          : m.isError
                            ? 'bg-[#FCE8E8] text-[#9E2420]'
                            : 'glass-tile text-[#2B2B2B]'
                      }`}
                    >
                      {m.role === 'ai' && m.source && (
                        <div className="text-[9px] font-bold uppercase tracking-wider opacity-65 mb-1">
                          {m.source}
                        </div>
                      )}
                      {renderFormattedText(m.text)}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="text-xs text-[#6E7178] inline-flex items-center gap-1.5 px-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {activeLevelCfg.name} sedang berpikir...
                  </div>
                )}
              </div>

              <form
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  handleAsk(input);
                }}
                className="p-2.5 border-t border-black/[0.06] bg-white/70 flex gap-1.5"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tanya apa saja atau data kandang..."
                  aria-label="Pertanyaan cepat Chatbot AI"
                  className="flex-1 px-3.5 py-2 rounded-full bg-white border border-black/10 text-xs"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-full bg-[#2B2B2B] text-white flex items-center justify-center shrink-0 disabled:opacity-50"
                  aria-label="Kirim pertanyaan"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
