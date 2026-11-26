import type {
  AIIntelligenceConfig,
  AIIntelligenceLevel,
  FarmDatabase,
  PlanConfig,
  SubscriptionState,
  SubscriptionTier,
} from '../types/termu';
import { getActiveAnimals } from './calculations';
import { todayISO } from './format';

export const AI_INTELLIGENCE_LEVELS: Record<AIIntelligenceLevel, AIIntelligenceConfig> = {
  cepat: {
    id: 'cepat',
    name: 'TERMU Cepat',
    shortLabel: 'Cepat',
    engineLabel: 'Flash Lite · Respons Instan',
    description:
      'Chatbot serba bisa berkecepatan tinggi untuk tanya jawab harian apa saja dan membaca ringkasan data kandang pemilik.',
    minTier: 'plus',
    minTierLabel: 'Plus',
  },
  cerdas: {
    id: 'cerdas',
    name: 'TERMU Cerdas',
    shortLabel: 'Cerdas',
    engineLabel: 'Penalaran Menengah · Analitis',
    description:
      'Kecerdasan lebih dalam untuk analisis data ternak, racikan ransum, penulisan promosi, serta diskusi bisnis & umum yang detail.',
    minTier: 'pro',
    minTierLabel: 'Pro',
  },
  pakar: {
    id: 'pakar',
    name: 'TERMU Pakar',
    shortLabel: 'Pakar',
    engineLabel: 'Deep Reasoning XHigh · Maksimal',
    description:
      'Penalaran terdalam untuk audit menyeluruh seluruh data pemilik (ternak, kas, pakan, pesanan), simulasi profit, dan strategi kompleks.',
    minTier: 'enterprise',
    minTierLabel: 'Enterprise',
  },
};

export const ALL_AI_INTELLIGENCE_LEVELS: AIIntelligenceLevel[] = ['cepat', 'cerdas', 'pakar'];

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, PlanConfig> = {
  free: {
    id: 'free',
    level: 0,
    name: 'Gratis',
    tagline: 'Untuk mencoba pencatatan kandang skala kecil dengan kuota dasar.',
    priceMonthly: 0,
    originalPriceMonthly: 0,
    discountPercent: 0,
    hasAds: true,
    maxAnimals: 10,
    maxPens: 2,
    maxAnimalsPerPen: 5,
    aiMonthlyQuota: 0,
    aiIntelligenceLevels: [],
    aiIntelligenceSummary: 'Terkunci',
    qrPrintMonthlyQuota: 3,
    maxWorkers: 1,
    highlights: [
      'Maksimal 10 ekor ternak terdaftar',
      'Maksimal 2 kandang / sekat (maks. 5 ekor per sekat)',
      'Tanpa akses Asisten AI & Skrining Foto AI',
      'Menampilkan banner iklan sponsor kandang',
      'Cetak / unduh Paspor QR maks. 3 kali / bulan',
    ],
  },
  plus: {
    id: 'plus',
    level: 1,
    name: 'Plus',
    badge: 'Level 1 · Hemat 37%',
    tagline: 'Cocok untuk peternak berkembang yang butuh bebas iklan & Chatbot AI Cepat.',
    priceMonthly: 49999,
    originalPriceMonthly: 79000,
    discountPercent: 37,
    hasAds: false,
    maxAnimals: 50,
    maxPens: 6,
    maxAnimalsPerPen: 15,
    aiMonthlyQuota: 30,
    aiIntelligenceLevels: ['cepat'],
    aiIntelligenceSummary: 'AI Cepat',
    qrPrintMonthlyQuota: 15,
    maxWorkers: 2,
    highlights: [
      'Bebas iklan di seluruh halaman kandang',
      'Hingga 50 ekor ternak aktif & 6 sekat kandang (maks. 15 ekor/sekat)',
      'Chatbot AI serba bisa + baca data pemilik: Kecerdasan Cepat (30 kuota/bln)',
      'Cetak / unduh Paspor QR hingga 15 kali / bulan',
      'Hingga 2 akun pekerja kandang',
    ],
  },
  pro: {
    id: 'pro',
    level: 2,
    name: 'Pro',
    badge: 'Level 2 · Paling Populer',
    tagline: 'Ideal untuk peternakan komersial dengan AI Cerdas & cetak Paspor QR melimpah.',
    priceMonthly: 99999,
    originalPriceMonthly: 159000,
    discountPercent: 37,
    hasAds: false,
    maxAnimals: 150,
    maxPens: 15,
    maxAnimalsPerPen: 30,
    aiMonthlyQuota: 150,
    aiIntelligenceLevels: ['cepat', 'cerdas'],
    aiIntelligenceSummary: 'AI Cepat + Cerdas',
    qrPrintMonthlyQuota: 75,
    maxWorkers: 5,
    highlights: [
      'Bebas iklan sepenuhnya & hingga 150 ekor ternak (15 sekat, maks. 30/sekat)',
      'Pilihan Kecerdasan AI Cepat & Cerdas + baca data pemilik (150 kuota/bln)',
      'Cetak / unduh Paspor QR jauh lebih banyak: 75 kali / bulan',
      'Skrining Foto Kesehatan AI dengan analisis detail',
      'Hingga 5 akun pekerja & prioritas tampil di Pasar TERMU',
    ],
  },
  enterprise: {
    id: 'enterprise',
    level: 3,
    name: 'Enterprise',
    badge: 'Level 3 · Hemat 40%',
    tagline: 'Untuk feedlot & peternakan besar tanpa batas populasi dengan AI Pakar terdalam.',
    priceMonthly: 149999,
    originalPriceMonthly: 249000,
    discountPercent: 40,
    hasAds: false,
    maxAnimals: null,
    maxPens: null,
    maxAnimalsPerPen: null,
    aiMonthlyQuota: 500,
    aiIntelligenceLevels: ['cepat', 'cerdas', 'pakar'],
    aiIntelligenceSummary: 'Semua (Cepat, Cerdas, Pakar)',
    qrPrintMonthlyQuota: null,
    maxWorkers: null,
    highlights: [
      'Bebas iklan · Ternak, sekat kandang & cetak Paspor QR Tanpa Batas',
      'Buka semua Kecerdasan AI: Cepat, Cerdas & Pakar (Deep Reasoning, 500 kuota/bln)',
      'Audit lengkap seluruh data pemilik (ternak, kas, pakan, pesanan & ulasan)',
      'Akun pekerja kandang Tanpa Batas + cadangan JSON penuh',
    ],
  },
};

export const PREMIUM_TIERS: SubscriptionTier[] = ['plus', 'pro', 'enterprise'];
export const ALL_TIERS: SubscriptionTier[] = ['free', 'plus', 'pro', 'enterprise'];

export function currentMonthKey(isoDate = todayISO()): string {
  return isoDate.slice(0, 7);
}

export function createDefaultSubscription(
  tier: SubscriptionTier = 'free',
  today = todayISO()
): SubscriptionState {
  return {
    tier,
    activatedAt: today,
    usageMonth: currentMonthKey(today),
    aiUsed: 0,
    qrPrintUsed: 0,
  };
}

export function normalizeSubscription(
  sub?: SubscriptionState | null,
  today = todayISO()
): SubscriptionState {
  const month = currentMonthKey(today);
  if (!sub || !SUBSCRIPTION_PLANS[sub.tier]) {
    return createDefaultSubscription('free', today);
  }
  if (sub.usageMonth !== month) {
    return {
      ...sub,
      usageMonth: month,
      aiUsed: 0,
      qrPrintUsed: 0,
    };
  }
  return sub;
}

export function getPlanConfig(tier: SubscriptionTier): PlanConfig {
  return SUBSCRIPTION_PLANS[tier] || SUBSCRIPTION_PLANS.free;
}

export function shouldShowAds(tier: SubscriptionTier): boolean {
  return getPlanConfig(tier).hasAds;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  recommendedTier?: SubscriptionTier;
}

export function getNextTier(tier: SubscriptionTier): SubscriptionTier {
  if (tier === 'free') return 'plus';
  if (tier === 'plus') return 'pro';
  return 'enterprise';
}

export function canRegisterAnimals(params: {
  db: FarmDatabase;
  tier: SubscriptionTier;
  addCount: number;
  targetPenId: string;
}): QuotaCheckResult {
  const plan = getPlanConfig(params.tier);
  const active = getActiveAnimals(params.db);
  const addCount = Math.max(1, Math.floor(params.addCount));

  if (plan.maxAnimals !== null && active.length + addCount > plan.maxAnimals) {
    const next = getNextTier(params.tier);
    return {
      allowed: false,
      recommendedTier: next,
      reason: `Batas registrasi ternak paket ${plan.name} adalah ${plan.maxAnimals} ekor (saat ini ${active.length} ekor). Upgrade ke paket ${getPlanConfig(next).name} untuk menambah lebih banyak ternak.`,
    };
  }

  if (params.targetPenId) {
    const pen = (params.db.pens || []).find((p) => p.id === params.targetPenId);
    const inPen = active.filter((a) => a.pen_id === params.targetPenId).length;
    if (plan.maxAnimalsPerPen !== null && inPen + addCount > plan.maxAnimalsPerPen) {
      const next = getNextTier(params.tier);
      return {
        allowed: false,
        recommendedTier: next,
        reason: `Batas maksimal per 1 kandang pada paket ${plan.name} adalah ${plan.maxAnimalsPerPen} ekor/sekat (Sekat ${pen?.code || '-'} sudah terisi ${inPen} ekor). Upgrade ke ${getPlanConfig(next).name} untuk kapasitas kandang lebih besar.`,
      };
    }
    if (pen && inPen + addCount > pen.capacity) {
      return {
        allowed: false,
        reason: `Kapasitas Sekat ${pen.code} sudah penuh (${inPen}/${pen.capacity} ekor). Pilih sekat lain atau perbesar kapasitas sekat.`,
      };
    }
  }

  return { allowed: true };
}

export function canCreatePen(params: {
  currentPenCount: number;
  requestedCapacity: number;
  tier: SubscriptionTier;
}): QuotaCheckResult {
  const plan = getPlanConfig(params.tier);
  if (plan.maxPens !== null && params.currentPenCount >= plan.maxPens) {
    const next = getNextTier(params.tier);
    return {
      allowed: false,
      recommendedTier: next,
      reason: `Paket ${plan.name} dibatasi maksimal ${plan.maxPens} kandang/sekat. Upgrade ke ${getPlanConfig(next).name} untuk menambah jumlah kandang.`,
    };
  }
  return validatePenCapacity(params.requestedCapacity, params.tier);
}

export function validatePenCapacity(
  requestedCapacity: number,
  tier: SubscriptionTier
): QuotaCheckResult {
  const plan = getPlanConfig(tier);
  const cap = Math.max(1, Math.floor(Number(requestedCapacity) || 0));
  if (plan.maxAnimalsPerPen !== null && cap > plan.maxAnimalsPerPen) {
    const next = getNextTier(tier);
    return {
      allowed: false,
      recommendedTier: next,
      reason: `Kapasitas maksimal untuk 1 kandang pada paket ${plan.name} adalah ${plan.maxAnimalsPerPen} ekor. Upgrade ke ${getPlanConfig(next).name} untuk batas lebih besar.`,
    };
  }
  return { allowed: true };
}

export function canUseAI(sub: SubscriptionState, today = todayISO()): QuotaCheckResult & {
  remaining: number;
  limit: number;
  used: number;
} {
  const norm = normalizeSubscription(sub, today);
  const plan = getPlanConfig(norm.tier);
  const limit = plan.aiMonthlyQuota;
  const used = norm.aiUsed;
  const remaining = Math.max(0, limit - used);

  if (limit <= 0) {
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      used: 0,
      recommendedTier: 'plus',
      reason: 'Paket Gratis tidak mendapatkan akses Asisten AI maupun Skrining Foto AI. Upgrade ke Plus, Pro, atau Enterprise untuk membuka fitur AI.',
    };
  }

  if (used >= limit) {
    const next = getNextTier(norm.tier);
    return {
      allowed: false,
      remaining: 0,
      limit,
      used,
      recommendedTier: next,
      reason: `Kuota AI bulanan paket ${plan.name} (${limit} kali/bulan) telah habis. Upgrade ke ${getPlanConfig(next).name} untuk kuota AI lebih besar.`,
    };
  }

  return { allowed: true, remaining, limit, used };
}

export function canPrintPassportQR(sub: SubscriptionState, today = todayISO()): QuotaCheckResult & {
  remaining: number | null;
  limit: number | null;
  used: number;
} {
  const norm = normalizeSubscription(sub, today);
  const plan = getPlanConfig(norm.tier);
  const limit = plan.qrPrintMonthlyQuota;
  const used = norm.qrPrintUsed;

  if (limit === null) {
    return { allowed: true, remaining: null, limit: null, used };
  }

  const remaining = Math.max(0, limit - used);
  if (used >= limit) {
    const next: SubscriptionTier = norm.tier === 'free' ? 'pro' : norm.tier === 'plus' ? 'pro' : 'enterprise';
    return {
      allowed: false,
      remaining: 0,
      limit,
      used,
      recommendedTier: next,
      reason: `Kuota cetak/unduh Paspor QR paket ${plan.name} (${limit} kali/bulan) telah habis. Upgrade ke Pro (75/bulan) atau Enterprise (Tanpa Batas) untuk mencetak lebih banyak Paspor QR.`,
    };
  }

  return { allowed: true, remaining, limit, used };
}

export function canAddWorker(currentWorkerCount: number, tier: SubscriptionTier): QuotaCheckResult {
  const plan = getPlanConfig(tier);
  if (plan.maxWorkers !== null && currentWorkerCount >= plan.maxWorkers) {
    const next = getNextTier(tier);
    return {
      allowed: false,
      recommendedTier: next,
      reason: `Paket ${plan.name} maksimal ${plan.maxWorkers} akun pekerja. Upgrade ke ${getPlanConfig(next).name} untuk menambah tim kandang.`,
    };
  }
  return { allowed: true };
}

export function getAllowedAIIntelligenceLevels(tier: SubscriptionTier): AIIntelligenceLevel[] {
  return getPlanConfig(tier).aiIntelligenceLevels;
}

export function getDefaultAIIntelligence(tier: SubscriptionTier): AIIntelligenceLevel {
  const allowed = getAllowedAIIntelligenceLevels(tier);
  if (allowed.length === 0) return 'cepat';
  return allowed[allowed.length - 1];
}

export function canUseAIIntelligence(
  tier: SubscriptionTier,
  level: AIIntelligenceLevel
): QuotaCheckResult {
  const allowed = getAllowedAIIntelligenceLevels(tier);
  if (allowed.includes(level)) {
    return { allowed: true };
  }
  const cfg = AI_INTELLIGENCE_LEVELS[level];
  const reqPlan = getPlanConfig(cfg.minTier);
  return {
    allowed: false,
    recommendedTier: cfg.minTier,
    reason: `Kecerdasan ${cfg.name} (${cfg.engineLabel}) tersedia mulai paket ${reqPlan.name} (${reqPlan.aiMonthlyQuota} kuota AI/bulan). Upgrade paket Anda untuk memilih kecerdasan ini.`,
  };
}

export function formatLimitLabel(val: number | null, unit: string): string {
  if (val === null) return 'Tanpa Batas';
  return `${val} ${unit}`;
}
