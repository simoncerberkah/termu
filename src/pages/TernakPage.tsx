import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRightLeft,
  Camera,
  Layers,
  Plus,
  QrCode,
  Scale,
  Search,
  Tag,
  Trash2,
} from 'lucide-react';
import type {
  Animal,
  AnimalStatus,
  FarmDatabase,
  Species,
  SubscriptionState,
  UserRole,
} from '../types/termu';
import {
  getActiveAnimals,
  getActiveWithdrawal,
  getAnimalWeights,
  getLatestWeight,
  getPBBH,
} from '../utils/calculations';
import {
  calcAgeLabel,
  compressImage,
  formatDateID,
  formatRp,
  formatShortDate,
  todayISO,
  uid,
} from '../utils/format';
import {
  canRegisterAnimals,
  formatLimitLabel,
  getNextTier,
  getPlanConfig,
  normalizeSubscription,
} from '../utils/subscription';
import { AnimalIllustration } from '../components/BrandLogo';
import { Modal } from '../components/Modal';

interface TernakPageProps {
  db: FarmDatabase;
  role: UserRole;
  subscription: SubscriptionState;
  selectedAnimalId: string | null;
  onSelectAnimal: (id: string | null) => void;
  onAddAnimal: (animal: Animal, initialWeight: number) => void;
  onAddBulkAnimals: (animals: Animal[], initialWeights: { animalId: string; kg: number }[]) => void;
  onDeleteAnimal: (animalId: string) => void;
  onUpdateAnimal: (animalId: string, patch: Partial<Animal>) => void;
  onMarkReadyForSale: (animalId: string, price: number, description: string) => void;
  onOpenRecordWeight: (animalId: string) => void;
  onOpenPassport: (animalId: string) => void;
  onOpenUpgrade: (reason?: string) => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  openAddModalSignal: number;
}

export function TernakPage({
  db,
  role,
  subscription,
  selectedAnimalId,
  onSelectAnimal,
  onAddAnimal,
  onAddBulkAnimals,
  onDeleteAnimal,
  onUpdateAnimal,
  onMarkReadyForSale,
  onOpenRecordWeight,
  onOpenPassport,
  onOpenUpgrade,
  onNotify,
  openAddModalSignal,
}: TernakPageProps) {
  const isOwner = role === 'pemilik';
  const today = todayISO();
  const normSub = normalizeSubscription(subscription);
  const plan = getPlanConfig(normSub.tier);
  const activeCount = useMemo(() => getActiveAnimals(db).length, [db]);

  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<'Semua' | Species>('Semua');
  const [penFilter, setPenFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<'Aktif' | AnimalStatus | 'Semua'>('Aktif');

  const [showAddModal, setShowAddModal] = useState(false);
  const [lastSignal, setLastSignal] = useState(openAddModalSignal);
  if (openAddModalSignal !== lastSignal) {
    setLastSignal(openAddModalSignal);
    setShowAddModal(true);
  }
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single');

  // Single form state
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('Sapi');
  const [breed, setBreed] = useState('Limosin Cross');
  const [sex, setSex] = useState<'Jantan' | 'Betina'>('Jantan');
  const [penId, setPenId] = useState(db.pens[0]?.id || '');
  const [entryWeight, setEntryWeight] = useState('340');
  const [buyPrice, setBuyPrice] = useState('19500000');
  const [origin, setOrigin] = useState('Pasar Hewan Ambarawa');
  const [birth, setBirth] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState('');

  // Bulk form state
  const [bulkPrefix, setBulkPrefix] = useState('Domba Batch');
  const [bulkCount, setBulkCount] = useState('5');
  const [bulkSpecies, setBulkSpecies] = useState<Species>('Domba');
  const [bulkBreed, setBulkBreed] = useState('Garut');
  const [bulkAvgWeight, setBulkAvgWeight] = useState('24');
  const [bulkPenId, setBulkPenId] = useState(db.pens[0]?.id || '');

  // Action modals
  const [deleteTarget, setDeleteTarget] = useState<Animal | null>(null);
  const [mutateTarget, setMutateTarget] = useState<Animal | null>(null);
  const [mutatePenId, setMutatePenId] = useState('');
  const [mutateStatus, setMutateStatus] = useState<AnimalStatus>('sehat');
  const [saleTarget, setSaleTarget] = useState<Animal | null>(null);
  const [salePrice, setSalePrice] = useState('');
  const [saleDesc, setSaleDesc] = useState('');

  const filteredAnimals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (db.animals || []).filter((a) => {
      if (statusFilter === 'Aktif' && (a.status === 'terjual' || a.status === 'mati')) return false;
      if (statusFilter !== 'Aktif' && statusFilter !== 'Semua' && a.status !== statusFilter) return false;
      if (speciesFilter !== 'Semua' && a.species !== speciesFilter) return false;
      if (penFilter !== 'Semua' && a.pen_id !== penFilter) return false;
      if (q) {
        const hay = `${a.id} ${a.name} ${a.breed} ${a.species}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [db.animals, search, speciesFilter, penFilter, statusFilter]);

  const selectedAnimal = useMemo(
    () => (selectedAnimalId ? db.animals.find((a) => a.id === selectedAnimalId) || null : null),
    [db.animals, selectedAnimalId]
  );

  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 720, 0.78);
      setPhoto(dataUrl);
      onNotify('Foto ternak dikompresi dan siap disimpan.', 'success');
    } catch {
      onNotify('Gagal memproses foto. Gunakan format JPG/PNG.', 'error');
    }
  }

  function handleRequestAddAnimal() {
    if (plan.maxAnimals !== null && activeCount >= plan.maxAnimals) {
      const next = getPlanConfig(getNextTier(normSub.tier));
      const reason = `Batas registrasi ternak paket ${plan.name} adalah ${plan.maxAnimals} ekor (saat ini ${activeCount} ekor aktif). Upgrade ke paket ${next.name} untuk menambah lebih banyak ternak.`;
      onOpenUpgrade(reason);
      return;
    }
    setShowAddModal(true);
  }

  function handleAddSingleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      onNotify('Nama atau kode ternak wajib diisi.', 'warning');
      return;
    }
    const targetPen = penId || db.pens[0]?.id || '';
    const quota = canRegisterAnimals({
      db,
      tier: normSub.tier,
      addCount: 1,
      targetPenId: targetPen,
    });
    if (!quota.allowed) {
      setShowAddModal(false);
      if (quota.recommendedTier) {
        onOpenUpgrade(quota.reason);
      } else {
        onNotify(quota.reason || 'Kapasitas sekat sudah penuh.', 'warning');
      }
      return;
    }
    const prefix = species === 'Sapi' ? 'SP' : species === 'Kambing' ? 'KB' : 'DM';
    const nextNum = String((db.animals?.length || 0) + 1).padStart(3, '0');
    const newId = `${prefix}-${nextNum}-${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
    const kg = Math.max(1, Number(entryWeight) || 0);
    const animal: Animal = {
      id: newId,
      farm_id: db.farm.id,
      name: name.trim(),
      species,
      breed: breed.trim() || 'Lokal',
      sex,
      birth,
      origin: origin.trim() || 'Kandang sendiri',
      entry_weight: kg,
      entry_date: today,
      pen_id: penId || db.pens[0]?.id || '',
      status: 'sehat',
      buy_price: Math.max(0, Number(buyPrice) || 0),
      ready_for_sale: false,
      photo,
      notes: notes.trim(),
    };
    onAddAnimal(animal, kg);
    setShowAddModal(false);
    setName('');
    setNotes('');
    setPhoto('');
  }

  function handleAddBulkSubmit(e: FormEvent) {
    e.preventDefault();
    const count = Math.min(30, Math.max(2, Number(bulkCount) || 2));
    const targetPen = bulkPenId || db.pens[0]?.id || '';
    const quota = canRegisterAnimals({
      db,
      tier: normSub.tier,
      addCount: count,
      targetPenId: targetPen,
    });
    if (!quota.allowed) {
      setShowAddModal(false);
      if (quota.recommendedTier) {
        onOpenUpgrade(quota.reason);
      } else {
        onNotify(quota.reason || 'Kapasitas sekat sudah penuh.', 'warning');
      }
      return;
    }
    const avgW = Math.max(1, Number(bulkAvgWeight) || 25);
    const prefix = bulkSpecies === 'Sapi' ? 'SP' : bulkSpecies === 'Kambing' ? 'KB' : 'DM';
    const baseIdx = (db.animals?.length || 0) + 1;
    const batchAnimals: Animal[] = [];
    const batchWeights: { animalId: string; kg: number }[] = [];

    for (let i = 0; i < count; i++) {
      const id = `${prefix}-${String(baseIdx + i).padStart(3, '0')}`;
      batchAnimals.push({
        id,
        farm_id: db.farm.id,
        name: `${bulkPrefix.trim() || bulkSpecies} #${i + 1}`,
        species: bulkSpecies,
        breed: bulkBreed.trim() || 'Lokal',
        sex: i % 2 === 0 ? 'Jantan' : 'Betina',
        birth: '',
        origin: 'Input kelompok',
        entry_weight: avgW,
        entry_date: today,
        pen_id: bulkPenId || db.pens[0]?.id || '',
        status: 'sehat',
        buy_price: bulkSpecies === 'Sapi' ? 16000000 : 2100000,
        ready_for_sale: false,
        photo: '',
        notes: 'Ditambahkan melalui mode kelompok',
      });
      batchWeights.push({ animalId: id, kg: avgW });
    }
    onAddBulkAnimals(batchAnimals, batchWeights);
    setShowAddModal(false);
  }

  // Detail View
  if (selectedAnimal) {
    const weights = getAnimalWeights(db, selectedAnimal.id);
    const latestW = getLatestWeight(db, selectedAnimal);
    const pbbh = getPBBH(db, selectedAnimal.id);
    const wd = getActiveWithdrawal(db, selectedAnimal.id, today);
    const pen = db.pens.find((p) => p.id === selectedAnimal.pen_id);
    const healthLogs = (db.health_events || [])
      .filter((h) => h.animal_id === selectedAnimal.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    const reproLogs = (db.reproduction_events || [])
      .filter((r) => r.animal_id === selectedAnimal.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    // SVG polyline chart points
    const chartPoints = weights.slice(-8);
    const minKg = chartPoints.length ? Math.min(...chartPoints.map((w) => w.kg)) - 5 : 0;
    const maxKg = chartPoints.length ? Math.max(...chartPoints.map((w) => w.kg)) + 5 : 100;
    const svgPoints = chartPoints
      .map((pt, idx) => {
        const x = chartPoints.length === 1 ? 150 : 24 + (idx / (chartPoints.length - 1)) * 252;
        const y = 112 - ((pt.kg - minKg) / Math.max(1, maxKg - minKg)) * 88;
        return { x, y, ...pt };
      });

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onSelectAnimal(null)}
            className="btn-touch px-4 py-2 rounded-full glass-pill text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5 hover:bg-white"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Ternak
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenRecordWeight(selectedAnimal.id)}
              className="btn-touch px-4 py-2 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-black"
            >
              <Scale className="w-4 h-4" /> Catat Bobot
            </button>
            <button
              type="button"
              onClick={() => {
                setMutateTarget(selectedAnimal);
                setMutatePenId(selectedAnimal.pen_id);
                setMutateStatus(selectedAnimal.status);
              }}
              className="btn-touch px-4 py-2 rounded-full glass-pill text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5 hover:bg-white"
            >
              <ArrowRightLeft className="w-4 h-4" /> Mutasi / Status
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  const est = Math.round(latestW * (selectedAnimal.species === 'Sapi' ? 62000 : 85000));
                  setSaleTarget(selectedAnimal);
                  setSalePrice(String(est));
                  setSaleDesc(selectedAnimal.notes || `${selectedAnimal.species} ${selectedAnimal.breed} sehat, bobot ${latestW} kg.`);
                }}
                className="btn-touch px-4 py-2 rounded-full glass-accent text-xs font-bold text-[#2B2B2B] inline-flex items-center gap-1.5"
              >
                <Tag className="w-4 h-4" /> {selectedAnimal.ready_for_sale ? 'Perbarui Harga Jual' : 'Tandai Siap Jual'}
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenPassport(selectedAnimal.id)}
              className="btn-touch px-4 py-2 rounded-full glass-pill text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5 hover:bg-white"
            >
              <QrCode className="w-4 h-4" /> Paspor QR
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(selectedAnimal)}
              className="btn-touch px-3.5 py-2 rounded-full bg-[#FCE8E8] text-[#9E2420] text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#FAD4D4]"
              aria-label={`Hapus ${selectedAnimal.name}`}
            >
              <Trash2 className="w-4 h-4" /> Hapus
            </button>
          </div>
        </div>

        {wd && (
          <div className="rounded-2xl bg-[#FCE8E8] border border-[#9E2420]/25 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#9E2420] shrink-0 mt-0.5" />
            <div className="text-xs text-[#9E2420]">
              <strong>Masa Henti Obat Aktif:</strong> Ternak menerima {wd.treatment} pada {formatDateID(wd.date)}. Tahan penjualan atau pemotongan hingga{' '}
              <strong>{formatDateID(wd.withdrawal_until)}</strong>.
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bento-card p-5 space-y-4">
            <div className="h-56 rounded-[22px] overflow-hidden bg-[#ECE5DC] relative">
              {selectedAnimal.photo ? (
                <img src={selectedAnimal.photo} alt={selectedAnimal.name} className="w-full h-full object-cover" />
              ) : (
                <AnimalIllustration species={selectedAnimal.species} breed={selectedAnimal.breed} />
              )}
              <span className="absolute top-3 left-3 glass-caption text-white px-3 py-1 rounded-full text-xs font-semibold">
                {selectedAnimal.id}
              </span>
              {selectedAnimal.ready_for_sale && (
                <span className="absolute top-3 right-3 glass-accent text-[#2B2B2B] px-3 py-1 rounded-full text-xs font-bold">
                  Siap Jual
                </span>
              )}
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold text-[#2B2B2B]">{selectedAnimal.name}</h2>
              <p className="text-xs text-[#6E7178] mt-0.5">
                {selectedAnimal.species} {selectedAnimal.breed} • {selectedAnimal.sex} • Umur {calcAgeLabel(selectedAnimal.birth)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="glass-tile rounded-xl p-3">
                <div className="text-[#6E7178] text-[11px]">Bobot Terkini</div>
                <div className="font-display text-xl font-bold text-[#2B2B2B] tabular-nums">{latestW} kg</div>
              </div>
              <div className="glass-tile rounded-xl p-3">
                <div className="text-[#6E7178] text-[11px]">PBBH Terakhir</div>
                <div className="font-display text-xl font-bold text-[#1F7A4D] tabular-nums">
                  {pbbh !== null ? `${pbbh > 0 ? '+' : ''}${pbbh} kg/hr` : '-'}
                </div>
              </div>
              <div className="glass-tile rounded-xl p-3">
                <div className="text-[#6E7178] text-[11px]">Lokasi Sekat</div>
                <div className="font-semibold text-[#2B2B2B]">{pen ? `${pen.code} — ${pen.name}` : '-'}</div>
              </div>
              <div className="glass-tile rounded-xl p-3">
                <div className="text-[#6E7178] text-[11px]">Status</div>
                <div className="font-semibold capitalize text-[#2B2B2B]">{selectedAnimal.status}</div>
              </div>
              {isOwner && (
                <div className="glass-tile rounded-xl p-3 col-span-2">
                  <div className="text-[#6E7178] text-[11px]">Harga Beli / Masuk</div>
                  <div className="font-semibold text-[#2B2B2B] tabular-nums">
                    {formatRp(selectedAnimal.buy_price)} ({formatDateID(selectedAnimal.entry_date)})
                  </div>
                </div>
              )}
            </div>

            {selectedAnimal.notes && (
              <div className="glass-tile rounded-xl p-3 text-xs text-[#2B2B2B]">
                <div className="text-[11px] font-semibold text-[#6E7178] mb-1">Catatan Kandang</div>
                {selectedAnimal.notes}
              </div>
            )}
          </div>

          <div className="lg:col-span-7 space-y-5">
            {/* Weight History SVG Line Chart */}
            <div className="bento-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-base font-semibold text-[#2B2B2B]">Grafik Pertumbuhan Bobot</h3>
                <span className="text-xs text-[#6E7178]">{weights.length} catatan timbang</span>
              </div>

              {svgPoints.length > 0 ? (
                <div className="w-full overflow-x-auto">
                  <svg viewBox="0 0 300 135" className="w-full h-40">
                    <line x1="20" y1="112" x2="284" y2="112" stroke="rgba(43,43,43,0.12)" strokeWidth="1" />
                    {svgPoints.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#2B2B2B"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={svgPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                      />
                    )}
                    {svgPoints.map((p) => (
                      <g key={p.id}>
                        <circle cx={p.x} cy={p.y} r="5" fill="#F5D547" stroke="#2B2B2B" strokeWidth="2" />
                        <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fontWeight="700" fill="#2B2B2B">
                          {p.kg}
                        </text>
                        <text x={p.x} y="128" textAnchor="middle" fontSize="8" fill="#6E7178">
                          {formatShortDate(p.date)}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              ) : (
                <p className="text-xs text-[#6E7178]">Belum ada riwayat penimbangan.</p>
              )}

              <div className="mt-3 grid sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                {[...weights].reverse().map((w) => (
                  <div key={w.id} className="glass-tile rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                    <span className="text-[#6E7178]">{formatDateID(w.date)} • {w.method}</span>
                    <span className="font-bold text-[#2B2B2B] tabular-nums">{w.kg} kg</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Health & Repro Logs */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bento-card p-5">
                <h3 className="font-display text-sm font-semibold text-[#2B2B2B] mb-2.5">Riwayat Kesehatan</h3>
                {healthLogs.length === 0 ? (
                  <p className="text-xs text-[#6E7178]">Belum ada catatan medis/vaksin.</p>
                ) : (
                  <div className="space-y-2">
                    {healthLogs.map((h) => (
                      <div key={h.id} className="glass-tile rounded-xl p-2.5 text-xs">
                        <div className="font-semibold text-[#2B2B2B]">{h.type}: {h.treatment}</div>
                        <div className="text-[11px] text-[#6E7178]">{formatDateID(h.date)}</div>
                        {h.notes && <p className="text-[11px] text-[#6E7178] mt-1">{h.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bento-card p-5">
                <h3 className="font-display text-sm font-semibold text-[#2B2B2B] mb-2.5">Riwayat Reproduksi</h3>
                {reproLogs.length === 0 ? (
                  <p className="text-xs text-[#6E7178]">Belum ada catatan IB / kebuntingan.</p>
                ) : (
                  <div className="space-y-2">
                    {reproLogs.map((r) => (
                      <div key={r.id} className="glass-tile rounded-xl p-2.5 text-xs">
                        <div className="font-semibold text-[#2B2B2B]">{r.type} — {r.status}</div>
                        <div className="text-[11px] text-[#6E7178]">Tanggal: {formatDateID(r.date)}</div>
                        {r.due_date && (
                          <div className="text-[11px] font-semibold text-[#1F7A4D]">
                            HPL: {formatDateID(r.due_date)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mutasi Modal */}
        <Modal
          open={Boolean(mutateTarget)}
          title="Mutasi Sekat & Status Ternak"
          subtitle={mutateTarget ? `${mutateTarget.name} (${mutateTarget.id})` : ''}
          onClose={() => setMutateTarget(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!mutateTarget) return;
              const isMovingActive =
                mutatePenId &&
                mutatePenId !== mutateTarget.pen_id &&
                mutateStatus !== 'terjual' &&
                mutateStatus !== 'mati';
              if (isMovingActive) {
                const activeInTarget = getActiveAnimals(db).filter((a) => a.pen_id === mutatePenId).length;
                const targetPen = db.pens.find((p) => p.id === mutatePenId);
                if (plan.maxAnimalsPerPen !== null && activeInTarget + 1 > plan.maxAnimalsPerPen) {
                  const next = getPlanConfig(getNextTier(normSub.tier));
                  const reason = `Batas maksimal per 1 kandang pada paket ${plan.name} adalah ${plan.maxAnimalsPerPen} ekor/sekat (Sekat ${targetPen?.code || '-'} sudah terisi ${activeInTarget} ekor). Upgrade ke ${next.name} untuk kapasitas lebih besar.`;
                  onNotify(reason, 'warning');
                  setMutateTarget(null);
                  onOpenUpgrade(reason);
                  return;
                }
                if (targetPen && activeInTarget + 1 > targetPen.capacity) {
                  onNotify(`Kapasitas Sekat ${targetPen.code} sudah penuh (${activeInTarget}/${targetPen.capacity} ekor).`, 'warning');
                  return;
                }
              }
              onUpdateAnimal(mutateTarget.id, { pen_id: mutatePenId, status: mutateStatus });
              setMutateTarget(null);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="mutate-pen" className="block text-xs font-semibold text-[#2B2B2B] mb-1.5">
                Pindah ke Sekat Kandang
              </label>
              <select
                id="mutate-pen"
                value={mutatePenId}
                onChange={(e) => setMutatePenId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              >
                {db.pens.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mutate-status" className="block text-xs font-semibold text-[#2B2B2B] mb-1.5">
                Status Kondisi
              </label>
              <select
                id="mutate-status"
                value={mutateStatus}
                onChange={(e) => setMutateStatus(e.target.value as AnimalStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              >
                <option value="sehat">Sehat</option>
                <option value="perhatian">Perlu Perhatian</option>
                <option value="terjual">Terjual</option>
                <option value="mati">Mati</option>
              </select>
            </div>
            <button type="submit" className="w-full btn-touch rounded-full bg-[#2B2B2B] text-white text-sm font-semibold">
              Simpan Perubahan
            </button>
          </form>
        </Modal>

        {/* Mark Ready For Sale Modal */}
        <Modal
          open={Boolean(saleTarget)}
          title="Tandai Siap Jual ke Pasar TERMU"
          subtitle={saleTarget ? `${saleTarget.name} (${saleTarget.id})` : ''}
          onClose={() => setSaleTarget(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!saleTarget) return;
              const priceNum = Number(salePrice) || 0;
              if (priceNum < 100000) {
                onNotify('Masukkan harga penawaran yang wajar (min. Rp 100.000).', 'warning');
                return;
              }
              onMarkReadyForSale(saleTarget.id, priceNum, saleDesc.trim());
              setSaleTarget(null);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="sale-price" className="block text-xs font-semibold text-[#2B2B2B] mb-1.5">
                Harga Penawaran (Rp)
              </label>
              <input
                id="sale-price"
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
                required
              />
            </div>
            <div>
              <label htmlFor="sale-desc" className="block text-xs font-semibold text-[#2B2B2B] mb-1.5">
                Keterangan untuk Pembeli
              </label>
              <textarea
                id="sale-desc"
                rows={3}
                value={saleDesc}
                onChange={(e) => setSaleDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              />
            </div>
            <button type="submit" className="w-full btn-touch rounded-full glass-accent text-[#2B2B2B] text-sm font-bold">
              Tayangkan di Lapak & Pasar TERMU
            </button>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          open={Boolean(deleteTarget)}
          title="Hapus Data Ternak?"
          subtitle="Tindakan ini menghapus data ternak, riwayat bobot, dan listing terkait."
          onClose={() => setDeleteTarget(null)}
        >
          {deleteTarget && (
            <div className="space-y-4">
              <p className="text-xs text-[#2B2B2B]">
                Anda yakin ingin menghapus <strong>{deleteTarget.name} ({deleteTarget.id})</strong> dari kandang?
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 btn-touch rounded-full glass-tile text-xs font-semibold text-[#2B2B2B]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteAnimal(deleteTarget.id);
                    setDeleteTarget(null);
                    onSelectAnimal(null);
                  }}
                  className="flex-1 btn-touch rounded-full bg-[#C93B3B] text-white text-xs font-bold"
                >
                  Ya, Hapus Ternak
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B2B2B]">Data Ternak</h1>
          <p className="text-xs text-[#6E7178] mt-0.5">
            Paket <strong>{plan.name}</strong>: <strong className="tabular-nums">{activeCount}/{plan.maxAnimals === null ? '∞' : plan.maxAnimals}</strong> ekor aktif · Maks.{' '}
            <strong>{formatLimitLabel(plan.maxAnimalsPerPen, 'ekor')}</strong> per 1 kandang.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRequestAddAnimal}
          className="btn-touch px-5 py-2.5 rounded-full bg-[#2B2B2B] hover:bg-black text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Tambah Ternak
        </button>
      </div>

      {/* Filters */}
      <div className="bento-card p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6E7178] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode (SP-001), nama, atau ras..."
            aria-label="Cari ternak"
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/80 border border-black/10 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Filter jenis ternak"
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value as 'Semua' | Species)}
            className="px-3.5 py-2.5 rounded-full bg-white/80 border border-black/10 text-xs font-semibold"
          >
            <option value="Semua">Semua Jenis</option>
            <option value="Sapi">Sapi</option>
            <option value="Kambing">Kambing</option>
            <option value="Domba">Domba</option>
          </select>
          <select
            aria-label="Filter sekat kandang"
            value={penFilter}
            onChange={(e) => setPenFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-full bg-white/80 border border-black/10 text-xs font-semibold"
          >
            <option value="Semua">Semua Sekat</option>
            {db.pens.map((p) => (
              <option key={p.id} value={p.id}>
                Sekat {p.code}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter status ternak"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'Aktif' | AnimalStatus | 'Semua')}
            className="px-3.5 py-2.5 rounded-full bg-white/80 border border-black/10 text-xs font-semibold"
          >
            <option value="Aktif">Aktif di Kandang</option>
            <option value="sehat">Sehat</option>
            <option value="perhatian">Perlu Perhatian</option>
            <option value="terjual">Terjual</option>
            <option value="Semua">Semua Status</option>
          </select>
        </div>
      </div>

      {/* Animal Cards Grid */}
      {filteredAnimals.length === 0 ? (
        <div className="bento-card p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-[#2B2B2B]">Tidak ada data ternak sesuai filter.</p>
          <p className="text-xs text-[#6E7178]">Ubah filter atau tambahkan ternak baru ke kandang Anda.</p>
          <button
            type="button"
            onClick={handleRequestAddAnimal}
            className="btn-touch px-5 py-2.5 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Tambah Ternak
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAnimals.map((an) => {
            const w = getLatestWeight(db, an);
            const pbbh = getPBBH(db, an.id);
            const wd = getActiveWithdrawal(db, an.id, today);
            const pen = db.pens.find((p) => p.id === an.pen_id);

            return (
              <div key={an.id} className="bento-card p-3.5 flex flex-col justify-between gap-3">
                <div>
                  <button
                    type="button"
                    onClick={() => onSelectAnimal(an.id)}
                    className="w-full text-left block group"
                  >
                    <div className="h-36 rounded-2xl overflow-hidden bg-[#ECE5DC] relative mb-3">
                      {an.photo ? (
                        <img src={an.photo} alt={an.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition" />
                      ) : (
                        <AnimalIllustration species={an.species} breed={an.breed} />
                      )}
                      <span className="absolute top-2.5 left-2.5 glass-caption text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        {an.id}
                      </span>
                      {wd ? (
                        <span className="absolute top-2.5 right-2.5 bg-[#C93B3B] text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          Henti Obat
                        </span>
                      ) : an.ready_for_sale ? (
                        <span className="absolute top-2.5 right-2.5 glass-accent text-[#2B2B2B] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          Siap Jual
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-display font-semibold text-base text-[#2B2B2B] truncate">
                          {an.name}
                        </h3>
                        <p className="text-[11px] text-[#6E7178] truncate">
                          {an.species} {an.breed} • {pen ? `Sekat ${pen.code}` : '-'}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize shrink-0 ${
                          an.status === 'perhatian'
                            ? 'bg-[#FFF3DA] text-[#8B4C06]'
                            : an.status === 'sehat'
                              ? 'bg-[#E9F7EF] text-[#1F7A4D]'
                              : 'bg-black/10 text-[#2B2B2B]'
                        }`}
                      >
                        {an.status}
                      </span>
                    </div>
                  </button>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="glass-tile rounded-xl px-2.5 py-2">
                      <div className="text-[10px] text-[#6E7178]">Bobot Kini</div>
                      <div className="font-display font-bold text-sm text-[#2B2B2B] tabular-nums">{w} kg</div>
                    </div>
                    <div className="glass-tile rounded-xl px-2.5 py-2">
                      <div className="text-[10px] text-[#6E7178]">PBBH</div>
                      <div className="font-display font-bold text-sm text-[#1F7A4D] tabular-nums">
                        {pbbh !== null ? `${pbbh > 0 ? '+' : ''}${pbbh} kg/hr` : '-'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => onSelectAnimal(an.id)}
                    className="flex-1 py-2 rounded-xl glass-tile hover:bg-white text-xs font-semibold text-[#2B2B2B]"
                  >
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenRecordWeight(an.id)}
                    className="flex-1 py-2 rounded-xl bg-[#2B2B2B] text-white text-xs font-semibold hover:bg-black"
                  >
                    Timbang
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPassport(an.id)}
                    className="w-9 h-9 rounded-xl glass-accent flex items-center justify-center text-[#2B2B2B]"
                    aria-label={`Paspor QR ${an.name}`}
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(an)}
                    className="w-9 h-9 rounded-xl bg-[#FCE8E8] hover:bg-[#FAD4D4] flex items-center justify-center text-[#9E2420]"
                    aria-label={`Hapus ${an.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Animal Modal (Single / Bulk) */}
      <Modal
        open={showAddModal}
        title="Tambah Data Ternak"
        subtitle="Pilih input satu ekor lengkap atau mode kelompok cepat."
        maxWidth="max-w-lg"
        onClose={() => setShowAddModal(false)}
      >
        <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-black/[0.05] mb-4">
          <button
            type="button"
            onClick={() => setAddMode('single')}
            className={`py-2 rounded-full text-xs font-semibold transition ${
              addMode === 'single' ? 'bg-[#2B2B2B] text-white' : 'text-[#6E7178]'
            }`}
          >
            Input 1 Ekor
          </button>
          <button
            type="button"
            onClick={() => setAddMode('bulk')}
            className={`py-2 rounded-full text-xs font-semibold transition inline-flex items-center justify-center gap-1 ${
              addMode === 'bulk' ? 'bg-[#2B2B2B] text-white' : 'text-[#6E7178]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Mode Kelompok
          </button>
        </div>

        {addMode === 'single' ? (
          <form onSubmit={handleAddSingleSubmit} className="space-y-3.5">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="an-name" className="block text-xs font-semibold mb-1">
                  Nama / Ear Tag *
                </label>
                <input
                  id="an-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Bima 09"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="an-species" className="block text-xs font-semibold mb-1">
                  Jenis Ternak
                </label>
                <select
                  id="an-species"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value as Species)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
                >
                  <option value="Sapi">Sapi</option>
                  <option value="Kambing">Kambing</option>
                  <option value="Domba">Domba</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="an-breed" className="block text-xs font-semibold mb-1">
                  Ras
                </label>
                <input
                  id="an-breed"
                  type="text"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
                />
              </div>
              <div>
                <label htmlFor="an-sex" className="block text-xs font-semibold mb-1">
                  Kelamin
                </label>
                <select
                  id="an-sex"
                  value={sex}
                  onChange={(e) => setSex(e.target.value as 'Jantan' | 'Betina')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
                >
                  <option value="Jantan">Jantan</option>
                  <option value="Betina">Betina</option>
                </select>
              </div>
              <div>
                <label htmlFor="an-weight" className="block text-xs font-semibold mb-1">
                  Bobot Awal (kg)
                </label>
                <input
                  id="an-weight"
                  type="number"
                  step="0.5"
                  value={entryWeight}
                  onChange={(e) => setEntryWeight(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="an-pen" className="block text-xs font-semibold mb-1">
                  Sekat Kandang
                </label>
                <select
                  id="an-pen"
                  value={penId}
                  onChange={(e) => setPenId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
                >
                  {db.pens.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="an-price" className="block text-xs font-semibold mb-1">
                  Harga Beli (Rp)
                </label>
                <input
                  id="an-price"
                  type="number"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="an-birth" className="block text-xs font-semibold mb-1">
                  Tgl Lahir (Opsional)
                </label>
                <input
                  id="an-birth"
                  type="date"
                  value={birth}
                  onChange={(e) => setBirth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
                />
              </div>
              <div>
                <label htmlFor="an-origin" className="block text-xs font-semibold mb-1">
                  Asal Ternak
                </label>
                <input
                  id="an-origin"
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="an-photo" className="block text-xs font-semibold mb-1">
                Foto Ternak (Opsional, otomatis diperkecil)
              </label>
              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-black/20 bg-white/70 cursor-pointer text-xs font-semibold text-[#2B2B2B] hover:bg-white">
                <Camera className="w-4 h-4" />
                {photo ? 'Foto terpilih — klik untuk ganti' : 'Pilih Foto dari Galeri / Kamera'}
                <input id="an-photo" type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>

            <div>
              <label htmlFor="an-notes" className="block text-xs font-semibold mb-1">
                Catatan Singkat
              </label>
              <input
                id="an-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ciri fisik atau catatan kesehatan awal"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              />
            </div>

            <button type="submit" className="w-full btn-touch rounded-full bg-[#2B2B2B] text-white text-sm font-semibold">
              Simpan Data Ternak
            </button>
          </form>
        ) : (
          <form onSubmit={handleAddBulkSubmit} className="space-y-3.5">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="bulk-prefix" className="block text-xs font-semibold mb-1">
                  Nama Kelompok
                </label>
                <input
                  id="bulk-prefix"
                  type="text"
                  value={bulkPrefix}
                  onChange={(e) => setBulkPrefix(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="bulk-count" className="block text-xs font-semibold mb-1">
                  Jumlah Ekor (2–30)
                </label>
                <input
                  id="bulk-count"
                  type="number"
                  min={2}
                  max={30}
                  value={bulkCount}
                  onChange={(e) => setBulkCount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
                  required
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="bulk-species" className="block text-xs font-semibold mb-1">
                  Jenis
                </label>
                <select
                  id="bulk-species"
                  value={bulkSpecies}
                  onChange={(e) => setBulkSpecies(e.target.value as Species)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
                >
                  <option value="Domba">Domba</option>
                  <option value="Kambing">Kambing</option>
                  <option value="Sapi">Sapi</option>
                </select>
              </div>
              <div>
                <label htmlFor="bulk-breed" className="block text-xs font-semibold mb-1">
                  Ras
                </label>
                <input
                  id="bulk-breed"
                  type="text"
                  value={bulkBreed}
                  onChange={(e) => setBulkBreed(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
                />
              </div>
              <div>
                <label htmlFor="bulk-weight" className="block text-xs font-semibold mb-1">
                  Rata-rata Bobot (kg)
                </label>
                <input
                  id="bulk-weight"
                  type="number"
                  value={bulkAvgWeight}
                  onChange={(e) => setBulkAvgWeight(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
                />
              </div>
            </div>
            <div>
              <label htmlFor="bulk-pen" className="block text-xs font-semibold mb-1">
                Masukkan ke Sekat
              </label>
              <select
                id="bulk-pen"
                value={bulkPenId}
                onChange={(e) => setBulkPenId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              >
                {db.pens.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full btn-touch rounded-full bg-[#2B2B2B] text-white text-sm font-semibold">
              Buat {Math.min(30, Math.max(2, Number(bulkCount) || 2))} Data Ternak Sekaligus
            </button>
          </form>
        )}
      </Modal>

      {/* Delete Modal in List View */}
      <Modal
        open={Boolean(deleteTarget)}
        title="Hapus Data Ternak?"
        subtitle="Data ternak dan riwayat bobotnya akan dihapus permanen."
        onClose={() => setDeleteTarget(null)}
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-xs text-[#2B2B2B]">
              Anda yakin ingin menghapus <strong>{deleteTarget.name} ({deleteTarget.id})</strong>?
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 btn-touch rounded-full glass-tile text-xs font-semibold text-[#2B2B2B]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAnimal(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 btn-touch rounded-full bg-[#C93B3B] text-white text-xs font-bold"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
