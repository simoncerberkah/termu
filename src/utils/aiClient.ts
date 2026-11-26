import type {
  AIChatMessage,
  AIIntelligenceLevel,
  AIScreeningResult,
  AppMode,
  FarmDatabase,
  MarketplaceOrder,
  SellerReview,
  SubscriptionTier,
  UserRole,
} from '../types/termu';
import { buildFarmContextText, localOfflineFallbackAnswer } from './calculations';
import { todayISO } from './format';

export const HEALTH_SCREENING_DISCLAIMER =
  'Ini skrining awal, bukan diagnosis. Hubungi dokter hewan/petugas kesehatan hewan.';

export async function checkServerAIStatus(): Promise<{ aiReady: boolean; model: string }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return { aiReady: false, model: 'gemini-4-hydrogen' };
    return (await res.json()) as { aiReady: boolean; model: string };
  } catch {
    return { aiReady: false, model: 'gemini-4-hydrogen' };
  }
}

export async function askFarmAI(params: {
  question: string;
  db: FarmDatabase;
  role: UserRole;
  mode: AppMode;
  history: AIChatMessage[];
  intelligenceLevel: AIIntelligenceLevel;
  tier: SubscriptionTier;
  includeOwnerData: boolean;
  ownerName?: string;
  orders?: MarketplaceOrder[];
  reviews?: SellerReview[];
}): Promise<{ text: string; source: string; intelligenceLevel?: AIIntelligenceLevel; isError?: boolean }> {
  const today = todayISO();

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      text: localOfflineFallbackAnswer(params.db, params.question, params.role === 'pemilik', today),
      source: 'Analisis Lokal (Offline)',
      intelligenceLevel: params.intelligenceLevel,
    };
  }

  const farmContext = params.includeOwnerData
    ? buildFarmContextText(params.db, params.role, params.mode, today, {
        ownerName: params.ownerName,
        subscriptionTier: params.tier,
        orders: params.orders,
        reviews: params.reviews,
      })
    : '';

  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: params.question,
      farmContext,
      intelligenceLevel: params.intelligenceLevel,
      tier: params.tier,
      includeOwnerData: params.includeOwnerData,
      history: params.history.slice(-8).map((m) => ({ role: m.role, text: m.text })),
    }),
  });

  const payload = (await res.json().catch(() => ({}))) as {
    text?: string;
    source?: string;
    intelligenceLevel?: AIIntelligenceLevel;
    error?: string;
  };
  if (!res.ok) {
    return {
      text:
        payload.error ||
        'Terjadi kendala saat menghubungi server AI TERMU. Periksa koneksi internet Anda lalu coba lagi.',
      source: 'Status Koneksi AI',
      isError: true,
    };
  }

  return {
    text: payload.text || 'Tidak ada jawaban dari AI.',
    source: payload.source || 'TERMU AI',
    intelligenceLevel: payload.intelligenceLevel || params.intelligenceLevel,
  };
}

export async function screenLivestockHealthPhoto(params: {
  imageDataUrl: string;
  animalLabel: string;
  notes: string;
}): Promise<{ ok: true; result: AIScreeningResult } | { ok: false; error: string }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      ok: false,
      error: 'Perangkat sedang offline. Sambungkan ke internet agar foto dapat dianalisis oleh Gemini Vision AI.',
    };
  }

  try {
    const res = await fetch('/api/ai/screen-health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const payload = (await res.json().catch(() => ({}))) as Partial<AIScreeningResult> & { error?: string };
    if (!res.ok) {
      return {
        ok: false,
        error: payload.error || `Gagal memproses skrining foto (HTTP ${res.status}).`,
      };
    }

    return {
      ok: true,
      result: {
        sourceLabel: payload.sourceLabel || 'GEMINI VISION AI',
        model: payload.model,
        area: payload.area || 'Pemeriksaan Umum',
        suspected: payload.suspected || 'Perlu pemeriksaan langsung petugas kesehatan hewan',
        confidence: payload.confidence || 'Sedang',
        urgency: payload.urgency || 'Sedang',
        observation: payload.observation || '',
        safeSteps: Array.isArray(payload.safeSteps) ? payload.safeSteps : [],
        disclaimer: payload.disclaimer || HEALTH_SCREENING_DISCLAIMER,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? `Koneksi ke server AI terputus: ${err.message}` : 'Koneksi ke server AI gagal.',
    };
  }
}
