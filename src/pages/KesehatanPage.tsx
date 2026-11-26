import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  Calendar,
  Camera,
  Check,
  HeartPulse,
  Loader2,
  MessageCircle,
  Plus,
  ShieldAlert,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import type {
  AIScreeningResult,
  FarmDatabase,
  HealthEvent,
  ReproductionEvent,
  ScheduleItem,
  SubscriptionState,
} from '../types/termu';
import { getActiveAnimals, getActiveWithdrawal } from '../utils/calculations';
import {
  buildWhatsAppUrl,
  compressImage,
  daysFromNowISO,
  formatDateID,
  todayISO,
  uid,
} from '../utils/format';
import { canUseAI, getPlanConfig, normalizeSubscription } from '../utils/subscription';
import { HEALTH_SCREENING_DISCLAIMER, screenLivestockHealthPhoto } from '../utils/aiClient';
import { Modal } from '../components/Modal';
import { AILockedGate } from '../components/SubscriptionModal';

interface KesehatanPageProps {
  db: FarmDatabase;
  subscription: SubscriptionState;
  onToggleSchedule: (id: string) => void;
  onAddSchedule: (item: ScheduleItem) => void;
  onAddHealthEvent: (item: HealthEvent) => void;
  onAddReproEvent: (item: ReproductionEvent) => void;
  onConsumeAIQuota: () => void;
  onOpenUpgrade: (reason?: string) => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

type HealthTab = 'jadwal' | 'medis' | 'reproduksi' | 'skrining';

export function KesehatanPage({
  db,
  subscription,
  onToggleSchedule,
  onAddSchedule,
  onAddHealthEvent,
  onAddReproEvent,
  onConsumeAIQuota,
  onOpenUpgrade,
  onNotify,
}: KesehatanPageProps) {
  const [tab, setTab] = useState<HealthTab>('jadwal');
  const today = todayISO();
  const activeAnimals = useMemo(() => getActiveAnimals(db), [db]);
  const normSub = normalizeSubscription(subscription);
  const plan = getPlanConfig(normSub.tier);
  const aiCheck = canUseAI(normSub, today);

  // Modals
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [showAddHealth, setShowAddHealth] = useState(false);
  const [showAddRepro, setShowAddRepro] = useState(false);

  // Schedule form
  const [schTitle, setSchTitle] = useState('');
  const [schCat, setSchCat] = useState('Vaksinasi');
  const [schDate, setSchDate] = useState(daysFromNowISO(3));
  const [schTime, setSchTime] = useState('08:00');
  const [schAnimal, setSchAnimal] = useState(activeAnimals[0]?.id || '');

  // Health event form
  const [hAnimal, setHAnimal] = useState(activeAnimals[0]?.id || '');
  const [hType, setHType] = useState('Pengobatan');
  const [hTreatment, setHTreatment] = useState('');
  const [hWithdrawalDays, setHWithdrawalDays] = useState('0');
  const [hNotes, setHNotes] = useState('');

  // Repro form
  const [rAnimal, setRAnimal] = useState(
    activeAnimals.find((a) => a.sex === 'Betina')?.id || activeAnimals[0]?.id || ''
  );
  const [rType, setRType] = useState('Inseminasi Buatan (IB)');
  const [rDate, setRDate] = useState(today);
  const [rStatus, setRStatus] = useState('Menunggu Cek Kebuntingan');
  const [rNotes, setRNotes] = useState('');

  // AI Photo Screening state
  const [screenAnimalId, setScreenAnimalId] = useState(activeAnimals[0]?.id || '');
  const [screenNotes, setScreenNotes] = useState('');
  const [screenPhoto, setScreenPhoto] = useState('');
  const [screenLoading, setScreenLoading] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [screenResult, setScreenResult] = useState<AIScreeningResult | null>(null);

  const activeWithdrawals = useMemo(
    () =>
      activeAnimals
        .map((an) => ({ an, wd: getActiveWithdrawal(db, an.id, today) }))
        .filter((x) => Boolean(x.wd)),
    [activeAnimals, db, today]
  );

  function handleScheduleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!schTitle.trim()) return;
    onAddSchedule({
      id: uid('sch'),
      title: schTitle.trim(),
      category: schCat,
      date: schDate,
      time: schTime,
      animal_id: schAnimal,
      pen_id: db.animals.find((a) => a.id === schAnimal)?.pen_id || '',
      done: false,
      notes: '',
    });
    setSchTitle('');
    setShowAddSchedule(false);
  }

  function handleHealthSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hTreatment.trim() || !hAnimal) return;
    const wdDays = Math.max(0, Number(hWithdrawalDays) || 0);
    onAddHealthEvent({
      id: uid('hlth'),
      animal_id: hAnimal,
      type: hType,
      date: today,
      treatment: hTreatment.trim(),
      notes: hNotes.trim(),
      withdrawal_until: wdDays > 0 ? daysFromNowISO(wdDays) : '',
    });
    setHTreatment('');
    setHNotes('');
    setHWithdrawalDays('0');
    setShowAddHealth(false);
  }

  function handleReproSubmit(e: FormEvent) {
    e.preventDefault();
    if (!rAnimal) return;
    const target = db.animals.find((a) => a.id === rAnimal);
    const gestationDays = target?.species === 'Sapi' ? 283 : 150;
    const base = new Date(rDate);
    base.setDate(base.getDate() + gestationDays);
    const dueDate = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
    onAddReproEvent({
      id: uid('rep'),
      animal_id: rAnimal,
      type: rType,
      date: rDate,
      status: rStatus,
      due_date: dueDate,
      notes: rNotes.trim(),
    });
    setRNotes('');
    setShowAddRepro(false);
  }

  async function handleScreenPhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 900, 0.82);
      setScreenPhoto(compressed);
      setScreenError(null);
      setScreenResult(null);
    } catch {
      onNotify('Gagal membaca file gambar. Pilih file JPG atau PNG.', 'error');
    }
  }

  async function handleRunAIScreening(e: FormEvent) {
    e.preventDefault();
    const latestCheck = canUseAI(subscription, today);
    if (!latestCheck.allowed) {
      onOpenUpgrade(latestCheck.reason);
      return;
    }
    if (!screenPhoto) {
      setScreenError('Unggah foto bagian tubuh ternak terlebih dahulu sebelum menjalankan skrining AI.');
      return;
    }
    const target = db.animals.find((a) => a.id === screenAnimalId);
    const animalLabel = target ? `${target.name} (${target.id} — ${target.species} ${target.breed})` : 'Ternak Kandang';

    setScreenLoading(true);
    setScreenError(null);
    setScreenResult(null);

    const res = await screenLivestockHealthPhoto({
      imageDataUrl: screenPhoto,
      animalLabel,
      notes: screenNotes.trim(),
    });

    setScreenLoading(false);
    if (!res.ok) {
      setScreenError(res.error);
      return;
    }
    onConsumeAIQuota();
    setScreenResult(res.result);
    onNotify('Skrining awal foto AI selesai. Tetap konfirmasi ke dokter hewan.', 'info');
  }

  const vetReferUrl = useMemo(() => {
    const target = db.animals.find((a) => a.id === screenAnimalId);
    const lines = [
      'Halo Dokter Hewan / Petugas Keswan,',
      `Saya dari ${db.farm.name || 'Kandang TERMU'} ingin konsultasi skrining awal ternak:`,
      target ? `- Ternak: ${target.name} (${target.id}, ${target.species} ${target.breed})` : '- Ternak kandang',
      screenNotes ? `- Keluhan pemilik: ${screenNotes}` : '',
      screenResult ? `- Catatan Skrining AI: ${screenResult.suspected} (Urgensi: ${screenResult.urgency})` : '',
      'Mohon arahan pemeriksaan langsung. Terima kasih.',
    ].filter(Boolean);
    return buildWhatsAppUrl('', lines.join('\n'));
  }, [db.animals, db.farm.name, screenAnimalId, screenNotes, screenResult]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B2B2B]">
            Kesehatan, Reproduksi & Skrining AI
          </h1>
          <p className="text-xs text-[#6E7178] mt-0.5">
            Pantau jadwal vaksin, masa henti obat, catatan IB, serta skrining visual awal via Gemini Vision.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 glass-pill p-1 rounded-full self-start">
          {(
            [
              { id: 'jadwal', label: 'Jadwal & Pengingat' },
              { id: 'medis', label: 'Log Sakit & Obat' },
              { id: 'reproduksi', label: 'Reproduksi' },
              { id: 'skrining', label: 'Skrining Foto AI' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                tab === item.id ? 'bg-[#2B2B2B] text-white' : 'text-[#6E7178] hover:text-[#2B2B2B]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Withdrawal Alert Banner */}
      {activeWithdrawals.length > 0 && (
        <div className="rounded-2xl bg-[#FCE8E8] border border-[#9E2420]/25 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#9E2420] shrink-0 mt-0.5" />
          <div className="text-xs text-[#9E2420]">
            <strong>Peringatan Masa Henti Obat ({activeWithdrawals.length} ekor):</strong>{' '}
            {activeWithdrawals
              .map((x) => `${x.an.name} (${x.an.id}) ditahan s/d ${formatDateID(x.wd!.withdrawal_until)}`)
              .join(' • ')}
          </div>
        </div>
      )}

      {/* TAB 1: JADWAL */}
      {tab === 'jadwal' && (
        <div className="bento-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[#2B2B2B] inline-flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Jadwal Vaksin, Obat Cacing & Kontrol
            </h2>
            <button
              type="button"
              onClick={() => setShowAddSchedule(true)}
              className="btn-touch px-4 py-2 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tambah Jadwal
            </button>
          </div>

          <div className="space-y-2.5">
            {[...(db.schedules || [])]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((s) => {
                const isOverdue = !s.done && s.date < today;
                const an = db.animals.find((a) => a.id === s.animal_id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onToggleSchedule(s.id)}
                    className={`w-full text-left rounded-2xl p-4 border flex items-center justify-between gap-3 transition ${
                      s.done
                        ? 'bg-[#E9F7EF]/80 border-[#1F7A4D]/25'
                        : isOverdue
                          ? 'bg-[#FCE8E8]/80 border-[#9E2420]/25'
                          : 'glass-tile hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                          s.done ? 'bg-[#1F7A4D] border-[#1F7A4D] text-white' : 'border-black/25 bg-white text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                      <div>
                        <div className={`text-xs font-semibold ${s.done ? 'line-through text-[#6E7178]' : 'text-[#2B2B2B]'}`}>
                          {s.title}
                        </div>
                        <div className="text-[11px] text-[#6E7178] mt-0.5">
                          {formatDateID(s.date)} • {s.time} • {s.category}
                          {an ? ` • ${an.name} (${an.id})` : ''}
                        </div>
                      </div>
                    </div>
                    {isOverdue && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#C93B3B] text-white text-[10px] font-bold shrink-0">
                        Terlewat
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: MEDIS */}
      {tab === 'medis' && (
        <div className="bento-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[#2B2B2B] inline-flex items-center gap-2">
              <Stethoscope className="w-5 h-5" /> Log Sakit, Vaksin & Pengobatan
            </h2>
            <button
              type="button"
              onClick={() => setShowAddHealth(true)}
              className="btn-touch px-4 py-2 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Catat Medis
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {[...(db.health_events || [])].reverse().map((ev) => {
              const an = db.animals.find((a) => a.id === ev.animal_id);
              const isWd = Boolean(ev.withdrawal_until && ev.withdrawal_until >= today);
              return (
                <div key={ev.id} className="glass-tile rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-[#2B2B2B]">
                        {an ? `${an.name} (${an.id})` : ev.animal_id}
                      </div>
                      <div className="text-xs font-semibold text-[#1F7A4D]">
                        {ev.type}: {ev.treatment}
                      </div>
                    </div>
                    <span className="text-[11px] text-[#6E7178] shrink-0">{formatDateID(ev.date)}</span>
                  </div>
                  {ev.notes && <p className="text-xs text-[#6E7178]">{ev.notes}</p>}
                  {isWd && (
                    <div className="text-[11px] font-bold text-[#9E2420] pt-1">
                      Masa henti obat aktif hingga {formatDateID(ev.withdrawal_until)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: REPRODUKSI */}
      {tab === 'reproduksi' && (
        <div className="bento-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[#2B2B2B] inline-flex items-center gap-2">
              <HeartPulse className="w-5 h-5" /> Catatan IB, Kawin & Perkiraan Lahir (HPL)
            </h2>
            <button
              type="button"
              onClick={() => setShowAddRepro(true)}
              className="btn-touch px-4 py-2 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Catat Reproduksi
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {[...(db.reproduction_events || [])].reverse().map((rep) => {
              const an = db.animals.find((a) => a.id === rep.animal_id);
              return (
                <div key={rep.id} className="glass-tile rounded-2xl p-4 space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="text-xs font-bold text-[#2B2B2B]">
                      {an ? `${an.name} (${an.id})` : rep.animal_id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FBF6E3] text-[10px] font-bold text-[#2B2B2B]">
                      {rep.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#6E7178]">
                    {rep.type} pada {formatDateID(rep.date)}
                  </div>
                  {rep.due_date && (
                    <div className="text-xs font-semibold text-[#1F7A4D]">
                      Perkiraan Lahir (HPL): {formatDateID(rep.due_date)}
                    </div>
                  )}
                  {rep.notes && <p className="text-[11px] text-[#6E7178]">{rep.notes}</p>}
                </div>
              );
            })}
            {db.reproduction_events.length === 0 && (
              <p className="text-xs text-[#6E7178]">Belum ada catatan reproduksi.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SKRINING FOTO AI */}
      {tab === 'skrining' && (
        !aiCheck.allowed ? (
          <AILockedGate
            tier={normSub.tier}
            reason={aiCheck.reason || 'Upgrade ke paket premium untuk membuka Skrining Foto AI.'}
            used={aiCheck.used}
            limit={aiCheck.limit}
            title="Skrining Foto AI Khusus Paket Premium"
            onOpenUpgrade={onOpenUpgrade}
          />
        ) : (
        <div className="grid lg:grid-cols-12 gap-5">
          <form onSubmit={handleRunAIScreening} className="lg:col-span-5 bento-card p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#2B2B2B]" />
                <h2 className="font-display text-lg font-semibold text-[#2B2B2B]">
                  Skrining Awal Foto Ternak (Gemini Vision)
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#E9F7EF] text-[#1F7A4D] text-[10px] font-bold tabular-nums">
                {plan.name} · Sisa {aiCheck.remaining}/{aiCheck.limit} AI
              </span>
            </div>

            <div className="rounded-2xl bg-[#FFF3DA] border border-[#8B4C06]/20 p-3 flex items-start gap-2.5 text-[11px] text-[#7A3F04]">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Penting:</strong> {HEALTH_SCREENING_DISCLAIMER} Sistem tidak memberikan resep atau dosis obat otomatis.
              </span>
            </div>

            <div>
              <label htmlFor="scr-animal" className="block text-xs font-semibold mb-1">
                Pilih Ternak
              </label>
              <select
                id="scr-animal"
                value={screenAnimalId}
                onChange={(e) => setScreenAnimalId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              >
                {activeAnimals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.name} ({a.species})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="scr-photo" className="block text-xs font-semibold mb-1">
                Unggah Foto Bagian yang Diperiksa (Kuku, Mulut, Kulit, Mata)
              </label>
              <label className="block rounded-2xl border-2 border-dashed border-black/15 bg-white/75 hover:bg-white p-4 text-center cursor-pointer transition">
                {screenPhoto ? (
                  <div className="space-y-2">
                    <img
                      src={screenPhoto}
                      alt="Pratinjau foto skrining ternak"
                      className="max-h-48 mx-auto rounded-xl object-contain"
                    />
                    <span className="inline-block text-xs font-semibold text-[#2B2B2B]">
                      Klik untuk ganti foto
                    </span>
                  </div>
                ) : (
                  <div className="py-5 space-y-2">
                    <Camera className="w-7 h-7 mx-auto text-[#6E7178]" />
                    <div className="text-xs font-semibold text-[#2B2B2B]">
                      Ambil Foto / Pilih dari Galeri
                    </div>
                    <div className="text-[11px] text-[#6E7178]">
                      Foto akan dikirim ke server Gemini Vision AI untuk skrining awal.
                    </div>
                  </div>
                )}
                <input
                  id="scr-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleScreenPhotoChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label htmlFor="scr-notes" className="block text-xs font-semibold mb-1">
                Keluhan / Gejala yang Terlihat
              </label>
              <textarea
                id="scr-notes"
                rows={3}
                value={screenNotes}
                onChange={(e) => setScreenNotes(e.target.value)}
                placeholder="Contoh: Nafsu makan turun sejak kemarin, ada luka lecet di sekitar kuku belakang..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={screenLoading}
              className="w-full btn-touch rounded-full bg-[#2B2B2B] hover:bg-black disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              {screenLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Menganalisis Foto dengan Gemini Vision...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#F5D547]" /> Mulai Skrining Awal AI
                </>
              )}
            </button>
          </form>

          <div className="lg:col-span-7 bento-card p-5 space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#2B2B2B]">Hasil Skrining Awal</h2>

            {screenError && (
              <div className="rounded-2xl bg-[#FCE8E8] border border-[#9E2420]/25 p-4 text-xs text-[#9E2420] space-y-1">
                <div className="font-bold">Skrining AI Tidak Dapat Diproses</div>
                <p>{screenError}</p>
              </div>
            )}

            {screenResult ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#2B2B2B] text-[#F5D547] text-[11px] font-bold">
                    {screenResult.sourceLabel}
                  </span>
                  <span className="px-3 py-1 rounded-full glass-tile text-[11px] font-semibold text-[#2B2B2B]">
                    Area: {screenResult.area}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                      screenResult.urgency.toLowerCase().includes('tinggi')
                        ? 'bg-[#FCE8E8] text-[#9E2420]'
                        : 'bg-[#FFF3DA] text-[#8B4C06]'
                    }`}
                  >
                    Urgensi: {screenResult.urgency}
                  </span>
                  <span className="px-3 py-1 rounded-full glass-tile text-[11px] font-semibold text-[#6E7178]">
                    Keyakinan: {screenResult.confidence}
                  </span>
                </div>

                <div className="glass-tile rounded-2xl p-4 space-y-2">
                  <div className="text-[11px] font-semibold text-[#6E7178]">Indikasi Visual Awal</div>
                  <div className="font-display text-lg font-semibold text-[#2B2B2B]">
                    {screenResult.suspected}
                  </div>
                  <p className="text-xs text-[#2B2B2B] leading-relaxed">{screenResult.observation}</p>
                </div>

                <div className="glass-tile rounded-2xl p-4 space-y-2">
                  <div className="text-xs font-bold text-[#2B2B2B]">Langkah Awal Aman (Tanpa Dosis Obat)</div>
                  <ul className="space-y-1.5 text-xs text-[#2B2B2B] list-disc pl-4">
                    {screenResult.safeSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-[#FFF3DA] p-3.5 text-xs font-semibold text-[#7A3F04]">
                  {screenResult.disclaimer}
                </div>

                <a
                  href={vetReferUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-touch w-full rounded-full bg-[#1F7A4D] hover:bg-[#17613C] text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Kirim Ringkasan ke Dokter Hewan (WhatsApp)
                </a>
              </div>
            ) : (
              !screenError && (
                <div className="glass-tile rounded-2xl p-8 text-center space-y-2">
                  <Stethoscope className="w-8 h-8 text-[#6E7178] mx-auto" />
                  <p className="text-sm font-semibold text-[#2B2B2B]">Belum ada hasil skrining foto</p>
                  <p className="text-xs text-[#6E7178] max-w-md mx-auto">
                    Unggah foto kondisi ternak di sebelah kiri dan tulis gejala singkat untuk mendapatkan analisis visual awal beserta panduan penanganan aman dari Gemini Vision AI.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
        )
      )}

      {/* Add Schedule Modal */}
      <Modal open={showAddSchedule} title="Tambah Jadwal Kesehatan" onClose={() => setShowAddSchedule(false)}>
        <form onSubmit={handleScheduleSubmit} className="space-y-3">
          <div>
            <label htmlFor="sch-title" className="block text-xs font-semibold mb-1">Judul Jadwal</label>
            <input
              id="sch-title"
              type="text"
              value={schTitle}
              onChange={(e) => setSchTitle(e.target.value)}
              placeholder="Contoh: Vaksinasi PMK Booster Sekat A1"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sch-cat" className="block text-xs font-semibold mb-1">Kategori</label>
              <select
                id="sch-cat"
                value={schCat}
                onChange={(e) => setSchCat(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              >
                <option value="Vaksinasi">Vaksinasi</option>
                <option value="Obat Cacing">Obat Cacing</option>
                <option value="Timbang Rutin">Timbang Rutin</option>
                <option value="Cek Kebuntingan">Cek Kebuntingan</option>
              </select>
            </div>
            <div>
              <label htmlFor="sch-animal" className="block text-xs font-semibold mb-1">Ternak (Opsional)</label>
              <select
                id="sch-animal"
                value={schAnimal}
                onChange={(e) => setSchAnimal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              >
                <option value="">Semua / Sekat</option>
                {activeAnimals.map((a) => (
                  <option key={a.id} value={a.id}>{a.id} — {a.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sch-date" className="block text-xs font-semibold mb-1">Tanggal</label>
              <input
                id="sch-date"
                type="date"
                value={schDate}
                onChange={(e) => setSchDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="sch-time" className="block text-xs font-semibold mb-1">Jam</label>
              <input
                id="sch-time"
                type="time"
                value={schTime}
                onChange={(e) => setSchTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              />
            </div>
          </div>
          <button type="submit" className="w-full btn-touch rounded-full bg-[#2B2B2B] text-white text-sm font-semibold">
            Simpan Jadwal
          </button>
        </form>
      </Modal>

      {/* Add Health Event Modal */}
      <Modal open={showAddHealth} title="Catat Pengobatan / Vaksin" onClose={() => setShowAddHealth(false)}>
        <form onSubmit={handleHealthSubmit} className="space-y-3">
          <div>
            <label htmlFor="h-an" className="block text-xs font-semibold mb-1">Ternak</label>
            <select
              id="h-an"
              value={hAnimal}
              onChange={(e) => setHAnimal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              required
            >
              {activeAnimals.map((a) => (
                <option key={a.id} value={a.id}>{a.id} — {a.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="h-type" className="block text-xs font-semibold mb-1">Tipe</label>
              <select
                id="h-type"
                value={hType}
                onChange={(e) => setHType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              >
                <option value="Pengobatan">Pengobatan</option>
                <option value="Vaksinasi">Vaksinasi</option>
                <option value="Vitamin">Vitamin</option>
                <option value="Obat Cacing">Obat Cacing</option>
              </select>
            </div>
            <div>
              <label htmlFor="h-wd" className="block text-xs font-semibold mb-1">Masa Henti Obat (hari)</label>
              <input
                id="h-wd"
                type="number"
                min={0}
                value={hWithdrawalDays}
                onChange={(e) => setHWithdrawalDays(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
              />
            </div>
          </div>
          <div>
            <label htmlFor="h-treat" className="block text-xs font-semibold mb-1">Tindakan / Obat</label>
            <input
              id="h-treat"
              type="text"
              value={hTreatment}
              onChange={(e) => setHTreatment(e.target.value)}
              placeholder="Contoh: Vaksin PMK / Antibiotik dari Dokter Hewan"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="h-notes" className="block text-xs font-semibold mb-1">Catatan</label>
            <input
              id="h-notes"
              type="text"
              value={hNotes}
              onChange={(e) => setHNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
            />
          </div>
          <button type="submit" className="w-full btn-touch rounded-full bg-[#2B2B2B] text-white text-sm font-semibold">
            Simpan Catatan Medis
          </button>
        </form>
      </Modal>

      {/* Add Repro Modal */}
      <Modal open={showAddRepro} title="Catat Reproduksi (IB / Kawin)" onClose={() => setShowAddRepro(false)}>
        <form onSubmit={handleReproSubmit} className="space-y-3">
          <div>
            <label htmlFor="r-an" className="block text-xs font-semibold mb-1">Indukan</label>
            <select
              id="r-an"
              value={rAnimal}
              onChange={(e) => setRAnimal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              required
            >
              {activeAnimals.map((a) => (
                <option key={a.id} value={a.id}>{a.id} — {a.name} ({a.sex})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="r-type" className="block text-xs font-semibold mb-1">Metode</label>
              <select
                id="r-type"
                value={rType}
                onChange={(e) => setRType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              >
                <option value="Inseminasi Buatan (IB)">Inseminasi Buatan (IB)</option>
                <option value="Kawin Alami">Kawin Alami</option>
                <option value="Cek Kebuntingan (PKB)">Cek Kebuntingan (PKB)</option>
              </select>
            </div>
            <div>
              <label htmlFor="r-date" className="block text-xs font-semibold mb-1">Tanggal</label>
              <input
                id="r-date"
                type="date"
                value={rDate}
                onChange={(e) => setRDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="r-status" className="block text-xs font-semibold mb-1">Status</label>
            <input
              id="r-status"
              type="text"
              value={rStatus}
              onChange={(e) => setRStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
            />
          </div>
          <div>
            <label htmlFor="r-notes" className="block text-xs font-semibold mb-1">Catatan (Straw / Pejantan)</label>
            <input
              id="r-notes"
              type="text"
              value={rNotes}
              onChange={(e) => setRNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
            />
          </div>
          <button type="submit" className="w-full btn-touch rounded-full bg-[#2B2B2B] text-white text-sm font-semibold">
            Simpan & Hitung HPL Otomatis
          </button>
        </form>
      </Modal>
    </div>
  );
}
