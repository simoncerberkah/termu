import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

type AIIntelligenceId = 'cepat' | 'cerdas' | 'pakar';
type TierId = 'free' | 'plus' | 'pro' | 'enterprise';

const TIER_ALLOWED_INTELLIGENCE: Record<TierId, AIIntelligenceId[]> = {
  free: [],
  plus: ['cepat'],
  pro: ['cepat', 'cerdas'],
  enterprise: ['cepat', 'cerdas', 'pakar'],
};

const INTELLIGENCE_ENGINE_MAP: Record<
  AIIntelligenceId,
  {
    model: string;
    thinkingLevel?: ThinkingLevel;
    sourceLabel: string;
    styleGuidance: string;
  }
> = {
  cepat: {
    model: 'gemini-3.1-flash-lite',
    sourceLabel: 'TERMU AI · Cepat',
    styleGuidance: 'Berikan jawaban yang lugas, cepat dipahami, langsung ke inti, dan tetap akurat.',
  },
  cerdas: {
    model: 'gemini-4-hydrogen',
    thinkingLevel: ThinkingLevel.MEDIUM,
    sourceLabel: 'TERMU AI · Cerdas',
    styleGuidance:
      'Berikan analisis yang terstruktur, tajam, dan lengkap dengan perhitungan atau rekomendasi praktis yang relevan.',
  },
  pakar: {
    model: 'gemini-4-hydrogen',
    thinkingLevel: ThinkingLevel.XHIGH,
    sourceLabel: 'TERMU AI · Pakar',
    styleGuidance:
      'Gunakan penalaran terdalam: bedah faktor penyebab, hitung skenario/angka secara menyeluruh, bandingkan opsi, dan berikan rekomendasi strategis kelas konsultan senior.',
  },
};

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function toFriendlyAIError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || '');
  if (raw.includes('503') || raw.includes('UNAVAILABLE') || raw.toLowerCase().includes('high demand')) {
    return 'Server Gemini AI sedang menerima permintaan tinggi. Silakan tunggu beberapa detik lalu coba kirim ulang.';
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'Batas permintaan Gemini AI sementara tercapai. Silakan coba lagi sebentar lagi.';
  }
  if (raw.includes('401') || raw.includes('403') || raw.includes('API_KEY')) {
    return 'Konfigurasi kunci Gemini AI pada server perlu diperiksa oleh administrator.';
  }
  return 'Gagal terhubung ke layanan Gemini AI saat ini. Silakan coba beberapa saat lagi.';
}

async function withBackoff<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let delay = 800;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const status = (err as { status?: number })?.status;
      if (status && status !== 429 && status < 500) {
        throw err;
      }
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      }
    }
  }
  throw lastErr;
}

async function callWithFallback<T>(
  runner: (model: string) => Promise<T>,
  preferredModel = MODEL_NAME
): Promise<{ result: T; modelUsed: string }> {
  const result = await withBackoff(() => runner(preferredModel), 2);
  return { result, modelUsed: preferredModel };
}

const app = express();
app.use(express.json({ limit: '10mb' }));

// Health check & AI readiness status
app.get('/api/health', (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({ ok: true, aiReady: hasKey, model: MODEL_NAME });
});

// Server-side Gemini Universal Chatbot + Owner Farm Data Reader + 3-Tier Intelligence Routing
app.post('/api/ai/chat', async (req, res) => {
  try {
    const {
      question,
      farmContext,
      history,
      intelligenceLevel = 'cepat',
      tier = 'plus',
      includeOwnerData = true,
    } = req.body as {
      question?: string;
      farmContext?: string;
      history?: Array<{ role: string; text: string }>;
      intelligenceLevel?: AIIntelligenceId;
      tier?: TierId;
      includeOwnerData?: boolean;
    };

    if (!question || typeof question !== 'string' || !question.trim()) {
      res.status(400).json({ error: 'Pertanyaan tidak boleh kosong.' });
      return;
    }

    const safeTier: TierId = tier in TIER_ALLOWED_INTELLIGENCE ? tier : 'free';
    const safeLevel: AIIntelligenceId =
      intelligenceLevel in INTELLIGENCE_ENGINE_MAP ? intelligenceLevel : 'cepat';
    const allowedLevels = TIER_ALLOWED_INTELLIGENCE[safeTier];

    if (!allowedLevels.includes(safeLevel)) {
      res.status(403).json({
        error:
          safeTier === 'free'
            ? 'Paket Gratis belum memiliki akses Chatbot AI. Upgrade ke paket Plus, Pro, atau Enterprise.'
            : `Kecerdasan ${INTELLIGENCE_ENGINE_MAP[safeLevel].sourceLabel} tidak termasuk dalam paket ${safeTier.toUpperCase()}. Upgrade paket Anda untuk membukanya.`,
        code: 'TIER_LOCKED',
      });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Layanan Gemini AI belum dikonfigurasi pada server (GEMINI_API_KEY tidak tersedia).',
        code: 'NO_API_KEY',
      });
      return;
    }

    const engine = INTELLIGENCE_ENGINE_MAP[safeLevel];

    const systemInstructionParts = [
      'Kamu adalah Asisten AI TERMU, chatbot cerdas serba bisa milik ekosistem peternakan TERMU Indonesia.',
      'PERAN UTAMA:',
      '- Kamu BISA menjawab pertanyaan APAPUN dari pengguna: pengetahuan umum, bisnis, pemasaran/caption jualan, hitungan matematika, teknologi, ide usaha, tips harian, resep, hingga ilmu peternakan & manajemen kandang.',
      '- Gunakan bahasa yang ramah, jelas, rapi, dan sesuai bahasa pengguna (utamanya Bahasa Indonesia yang mudah dibaca di HP).',
      `- Gaya penalaran aktif (${engine.sourceLabel}): ${engine.styleGuidance}`,
      'ATURAN WAJIB:',
      '1. Jika pengguna bertanya topik umum (di luar kandang), langsung jawab dengan cerdas & membantu tanpa memaksakan mengaitkannya dengan kandang.',
      '2. Jika pengguna bertanya tentang peternakan, ternak, bobot, pakan, keuangan, lapak, pesanan, ulasan, atau meminta analisis/saran berdasarkan data miliknya, baca dan gunakan HANYA angka nyata dari DATA PEMILIK & KANDANG di bawah ini—jangan pernah mengarang data atau statistik kandang palsu.',
      '3. Untuk proyeksi bobot/waktu jual, sampaikan jujur bahwa angka tersebut adalah estimasi berdasarkan tren penimbangan tercatat.',
      '4. Untuk keluhan kesehatan/penyakit hewan maupun medis, JANGAN memberikan diagnosis pasti atau resep dosis obat keras otomatis; berikan edukasi aman dan sarankan konsultasi dokter hewan/tenaga medis.',
      '5. Jika peran pengguna adalah pekerja kandang, jangan pernah membocorkan angka kas/keuangan pribadi pemilik.',
      '6. Format jawaban bersih dengan poin singkat dan penebalan (**teks**) seperlunya agar enak dibaca di layar HP.',
    ];

    if (includeOwnerData && farmContext) {
      systemInstructionParts.push(
        '',
        '=== DATA PEMILIK & KANDANG SAAT INI (AKSES AKTIF) ===',
        String(farmContext)
      );
    } else {
      systemInstructionParts.push(
        '',
        '=== CATATAN: Mode Baca Data Pemilik sedang dimatikan oleh pengguna. Jawab pertanyaan secara umum, dan ingatkan dengan sopan jika pengguna menanyakan angka spesifik kandangnya agar mengaktifkan tombol "Baca Data Pemilik". ==='
      );
    }

    const systemInstruction = systemInstructionParts.join('\n');

    const contents = [
      ...(Array.isArray(history) ? history.slice(-8) : []).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(m.text || '') }],
      })),
      { role: 'user', parts: [{ text: question.trim() }] },
    ];

    const { result: response, modelUsed } = await callWithFallback(
      (model) =>
        ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            ...(engine.thinkingLevel
              ? { thinkingConfig: { thinkingLevel: engine.thinkingLevel } }
              : {}),
          },
        }),
      engine.model
    );

    const text = (response.text || '').trim();
    if (!text) {
      res.status(502).json({ error: 'Model tidak mengembalikan jawaban. Coba ulangi pertanyaan Anda.' });
      return;
    }

    res.json({
      text,
      source: engine.sourceLabel,
      model: modelUsed,
      intelligenceLevel: safeLevel,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghubungi layanan Gemini AI.';
    console.error('[TERMU /api/ai/chat error]', message);
    res.status(502).json({
      error: toFriendlyAIError(err),
      code: 'UPSTREAM_ERROR',
    });
  }
});

// Server-side Gemini Vision Skrining Foto Kesehatan Ternak
app.post('/api/ai/screen-health', async (req, res) => {
  try {
    const { imageDataUrl, animalLabel, notes } = req.body as {
      imageDataUrl?: string;
      animalLabel?: string;
      notes?: string;
    };

    const cleanNotes = String(notes || '').trim();
    if (!imageDataUrl && !cleanNotes) {
      res.status(400).json({ error: 'Unggah foto ternak atau tuliskan gejala yang terlihat di kandang.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Layanan Gemini Vision belum dikonfigurasi pada server (GEMINI_API_KEY tidak tersedia).',
        code: 'NO_API_KEY',
      });
      return;
    }

    const promptText = [
      'Anda adalah asisten skrining awal visual kesehatan ternak (sapi/kambing/domba) untuk peternak di Indonesia.',
      `Data ternak: ${String(animalLabel || 'Ternak')}.`,
      `Catatan gejala dari peternak: ${cleanNotes || 'tidak ada catatan tambahan'}.`,
      'Tugas:',
      '- Amati foto (jika dilampirkan) dan gejala secara cermat, objektif, dan jujur.',
      '- Jika foto bukan gambar ternak atau terlalu buram/gelap untuk dinilai, sampaikan secara jujur pada field observation dan suspected.',
      '- Berikan dugaan area kelainan awal (area), ringkasan dugaan awal yang jujur (suspected), tingkat keyakinan visual (confidence, mis. Rendah / Sedang / Tinggi), ringkasan pengamatan visual (observation), tingkat urgensi (urgency: Rendah / Sedang / Prioritas), dan 3-4 langkah aman awal non-medis (safe_steps: isolasi sementara, bersihkan kandang, pantau suhu/nafsu makan, hubungi dokter hewan/mantri hewan).',
      'ATURAN KESELAMATAN WAJIB: JANGAN mendiagnosis secara pasti dan DILARANG menyebutkan nama obat keras, antibiotik, atau dosis obat otomatis.',
    ].join('\n');

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: promptText },
    ];

    if (imageDataUrl && typeof imageDataUrl === 'string') {
      const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imageDataUrl);
      if (!match) {
        res.status(400).json({ error: 'Format gambar tidak valid. Gunakan file JPG/PNG/WebP.' });
        return;
      }
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      });
    }

    const { result: response, modelUsed } = await callWithFallback((model) =>
      ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              area: { type: Type.STRING, description: 'Area tubuh yang diperiksa (Kulit, Mulut/Kuku, Mata, Umum)' },
              suspected: { type: Type.STRING, description: 'Dugaan awal yang hati-hati tanpa diagnosis pasti' },
              confidence: { type: Type.STRING, description: 'Tingkat keyakinan visual: Rendah, Sedang, atau Tinggi' },
              urgency: { type: Type.STRING, description: 'Tingkat urgensi: Rendah, Sedang, atau Prioritas' },
              observation: { type: Type.STRING, description: 'Pengamatan visual objektif dari foto/gejala' },
              safe_steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3-4 langkah aman awal non-medis tanpa dosis obat',
              },
            },
            required: ['area', 'suspected', 'confidence', 'urgency', 'observation', 'safe_steps'],
          },
        },
      })
    );

    const rawText = (response.text || '').trim();
    if (!rawText) {
      res.status(502).json({ error: 'Gemini Vision tidak mengembalikan hasil skrining.' });
      return;
    }

    const parsed = JSON.parse(rawText) as {
      area?: string;
      suspected?: string;
      confidence?: string;
      urgency?: string;
      observation?: string;
      safe_steps?: string[];
    };

    res.json({
      sourceLabel: imageDataUrl ? 'GEMINI VISION AI' : 'GEMINI AI (ANALISIS GEJALA)',
      model: modelUsed,
      area: parsed.area || 'Pemeriksaan Umum',
      suspected: parsed.suspected || 'Perlu pemeriksaan langsung petugas kesehatan hewan',
      confidence: parsed.confidence || 'Sedang',
      urgency: parsed.urgency || 'Sedang',
      observation: parsed.observation || 'Pengamatan awal berdasarkan informasi yang diberikan.',
      safeSteps:
        Array.isArray(parsed.safe_steps) && parsed.safe_steps.length > 0
          ? parsed.safe_steps
          : [
              'Pisahkan sementara ternak di sekat observasi agar tidak kontak dengan ternak sehat.',
              'Pastikan air minum bersih dan pakan mudah dikonsumsi.',
              'Hubungi dokter hewan atau mantri hewan setempat untuk pemeriksaan langsung.',
            ],
      disclaimer: 'Ini skrining awal, bukan diagnosis. Hubungi dokter hewan/petugas kesehatan hewan.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menjalankan skrining foto AI.';
    console.error('[TERMU /api/ai/screen-health error]', message);
    res.status(502).json({
      error: toFriendlyAIError(err),
      code: 'UPSTREAM_ERROR',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TERMU server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
