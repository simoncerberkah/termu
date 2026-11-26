import { useMemo, useState, type FormEvent } from 'react';
import { Check, Droplets, Edit3, Plus, Sparkles, Warehouse } from 'lucide-react';
import type { FarmDatabase, Pen, SubscriptionState } from '../types/termu';
import { getActiveAnimals } from '../utils/calculations';
import { todayISO } from '../utils/format';
import {
  canCreatePen,
  formatLimitLabel,
  getPlanConfig,
  normalizeSubscription,
  validatePenCapacity,
} from '../utils/subscription';
import { Modal } from '../components/Modal';

interface KandangPageProps {
  db: FarmDatabase;
  subscription: SubscriptionState;
  onAddPen: (pen: Omit<Pen, 'id' | 'farm_id'>) => void;
  onUpdatePen: (penId: string, patch: Partial<Pen>) => void;
  onToggleTask: (taskId: string) => void;
  onAddTask: (penId: string, item: string) => void;
  onSeedDailyTasks: () => void;
  onOpenUpgrade: (reason?: string) => void;
}

export function KandangPage({
  db,
  subscription,
  onAddPen,
  onUpdatePen,
  onToggleTask,
  onAddTask,
  onSeedDailyTasks,
  onOpenUpgrade,
}: KandangPageProps) {
  const today = todayISO();
  const activeAnimals = useMemo(() => getActiveAnimals(db), [db]);
  const normSub = normalizeSubscription(subscription);
  const plan = getPlanConfig(normSub.tier);

  const [showPenModal, setShowPenModal] = useState(false);
  const [editingPen, setEditingPen] = useState<Pen | null>(null);
  const [penCode, setPenCode] = useState('');
  const [penName, setPenName] = useState('');
  const [penCap, setPenCap] = useState(String(Math.min(10, plan.maxAnimalsPerPen ?? 10)));
  const [penNotes, setPenNotes] = useState('');

  const [newTaskPen, setNewTaskPen] = useState(db.pens[0]?.id || '');
  const [newTaskText, setNewTaskText] = useState('');

  const todayTasks = useMemo(
    () => (db.tasks || []).filter((t) => t.date === today),
    [db.tasks, today]
  );

  function openCreatePen() {
    const check = canCreatePen({
      currentPenCount: db.pens.length,
      requestedCapacity: 1,
      tier: normSub.tier,
    });
    if (!check.allowed) {
      onOpenUpgrade(check.reason);
      return;
    }
    setEditingPen(null);
    setPenCode(`E${db.pens.length + 1}`);
    setPenName('');
    setPenCap(String(Math.min(10, plan.maxAnimalsPerPen ?? 10)));
    setPenNotes('');
    setShowPenModal(true);
  }

  function openEditPen(pen: Pen) {
    setEditingPen(pen);
    setPenCode(pen.code);
    setPenName(pen.name);
    setPenCap(String(pen.capacity));
    setPenNotes(pen.notes);
    setShowPenModal(true);
  }

  function handleSavePen(e: FormEvent) {
    e.preventDefault();
    if (!penCode.trim() || !penName.trim()) return;
    const requestedCap = Math.max(1, Number(penCap) || 1);
    if (editingPen) {
      const capCheck = validatePenCapacity(requestedCap, normSub.tier);
      if (!capCheck.allowed) {
        setShowPenModal(false);
        onOpenUpgrade(capCheck.reason);
        return;
      }
      onUpdatePen(editingPen.id, {
        code: penCode.trim(),
        name: penName.trim(),
        capacity: requestedCap,
        notes: penNotes.trim(),
      });
    } else {
      const penCheck = canCreatePen({
        currentPenCount: db.pens.length,
        requestedCapacity: requestedCap,
        tier: normSub.tier,
      });
      if (!penCheck.allowed) {
        setShowPenModal(false);
        onOpenUpgrade(penCheck.reason);
        return;
      }
      onAddPen({
        code: penCode.trim(),
        name: penName.trim(),
        capacity: requestedCap,
        cleanliness: 'Bersih',
        water_status: 'Cukup',
        notes: penNotes.trim(),
      });
    }
    setShowPenModal(false);
  }

  function handleAddTaskSubmit(e: FormEvent) {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(newTaskPen || db.pens[0]?.id || '', newTaskText.trim());
    setNewTaskText('');
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B2B2B]">
            Kandang & Tugas Harian
          </h1>
          <p className="text-xs text-[#6E7178] mt-0.5">
            Paket <strong>{plan.name}</strong>: <strong className="tabular-nums">{db.pens.length}/{plan.maxPens === null ? '∞' : plan.maxPens}</strong> sekat · Kapasitas maks.{' '}
            <strong>{formatLimitLabel(plan.maxAnimalsPerPen, 'ekor')}</strong> per 1 kandang.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreatePen}
          className="btn-touch px-5 py-2.5 rounded-full bg-[#2B2B2B] hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Tambah Sekat
        </button>
      </div>

      {/* Pen Map Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {db.pens.map((pen) => {
          const count = activeAnimals.filter((a) => a.pen_id === pen.id).length;
          const pct = Math.min(100, Math.round((count / Math.max(1, pen.capacity)) * 100));
          const isOver = count > pen.capacity;

          return (
            <div key={pen.id} className="bento-card p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#2B2B2B] text-[#F5D547] font-display font-bold flex items-center justify-center">
                      {pen.code}
                    </div>
                    <div>
                      <h2 className="font-display font-semibold text-base text-[#2B2B2B] leading-tight">
                        {pen.name}
                      </h2>
                      <p className="text-[11px] text-[#6E7178]">
                        Terisi <strong className="tabular-nums">{count}/{pen.capacity}</strong> ekor
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditPen(pen)}
                    className="w-8 h-8 rounded-full glass-tile hover:bg-white flex items-center justify-center text-[#6E7178] hover:text-[#2B2B2B]"
                    aria-label={`Ubah sekat ${pen.code}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Capacity Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-semibold mb-1">
                    <span className="text-[#6E7178]">Kapasitas Sekat</span>
                    <span className={`tabular-nums ${isOver ? 'text-[#C93B3B]' : 'text-[#2B2B2B]'}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-black/[0.07] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isOver ? 'bg-[#C93B3B]' : pct >= 85 ? 'bg-[#F5D547]' : 'bg-[#2B2B2B]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {pen.notes && <p className="text-[11px] text-[#6E7178] mt-3">{pen.notes}</p>}
              </div>

              {/* Cleanliness & Water Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePen(pen.id, {
                      cleanliness: pen.cleanliness === 'Bersih' ? 'Perlu Bersih' : 'Bersih',
                    })
                  }
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition ${
                    pen.cleanliness === 'Bersih'
                      ? 'bg-[#E9F7EF] text-[#1F7A4D]'
                      : 'bg-[#FFF3DA] text-[#8B4C06]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> {pen.cleanliness}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePen(pen.id, {
                      water_status: pen.water_status === 'Cukup' ? 'Perlu Isi' : 'Cukup',
                    })
                  }
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold inline-flex items-center justify-center gap-1 transition ${
                    pen.water_status === 'Cukup'
                      ? 'bg-[#E9F7EF] text-[#1F7A4D]'
                      : 'bg-[#FCE8E8] text-[#9E2420]'
                  }`}
                >
                  <Droplets className="w-3.5 h-3.5" /> Air {pen.water_status}
                </button>
              </div>
            </div>
          );
        })}

        {db.pens.length === 0 && (
          <div className="col-span-full bento-card p-8 text-center space-y-2">
            <Warehouse className="w-8 h-8 text-[#6E7178] mx-auto" />
            <p className="text-sm font-semibold text-[#2B2B2B]">Belum ada sekat kandang.</p>
            <button
              type="button"
              onClick={openCreatePen}
              className="btn-touch px-5 py-2 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold"
            >
              Buat Sekat Pertama
            </button>
          </div>
        )}
      </section>

      {/* Daily Worker Checklist */}
      <section className="bento-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#2B2B2B]">
              Checklist Pekerja Hari Ini
            </h2>
            <p className="text-xs text-[#6E7178]">
              Mencatat otomatis nama pekerja dan jam penyelesaian setiap tugas.
            </p>
          </div>
          {todayTasks.length === 0 && (
            <button
              type="button"
              onClick={onSeedDailyTasks}
              className="btn-touch px-4 py-2 rounded-full glass-accent text-xs font-bold text-[#2B2B2B] self-start"
            >
              Buat Tugas Rutin Hari Ini
            </button>
          )}
        </div>

        <form onSubmit={handleAddTaskSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <select
            aria-label="Pilih sekat untuk tugas"
            value={newTaskPen}
            onChange={(e) => setNewTaskPen(e.target.value)}
            className="sm:w-44 px-3.5 py-2.5 rounded-full bg-white border border-black/10 text-xs font-semibold"
          >
            {db.pens.map((p) => (
              <option key={p.id} value={p.id}>
                Sekat {p.code}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Tambah tugas harian (misal: Bersihkan tempat minum & beri vitamin)..."
            aria-label="Tugas harian baru"
            className="flex-1 px-4 py-2.5 rounded-full bg-white border border-black/10 text-xs"
          />
          <button
            type="submit"
            className="btn-touch px-5 py-2.5 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold whitespace-nowrap"
          >
            Tambah Tugas
          </button>
        </form>

        <div className="grid md:grid-cols-2 gap-2.5">
          {todayTasks.map((task) => {
            const pen = db.pens.find((p) => p.id === task.pen_id);
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onToggleTask(task.id)}
                className={`text-left rounded-2xl p-3.5 border flex items-start gap-3 transition ${
                  task.done
                    ? 'bg-[#E9F7EF]/80 border-[#1F7A4D]/25'
                    : 'glass-tile hover:bg-white'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                    task.done
                      ? 'bg-[#1F7A4D] border-[#1F7A4D] text-white'
                      : 'border-black/25 bg-white text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-semibold ${task.done ? 'line-through text-[#6E7178]' : 'text-[#2B2B2B]'}`}>
                    {task.item}
                  </div>
                  <div className="text-[11px] text-[#6E7178] mt-0.5">
                    {pen ? `Sekat ${pen.code} (${pen.name})` : 'Umum'}
                    {task.done && task.done_by ? ` • Selesai oleh ${task.done_by} pukul ${task.done_at}` : ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <Modal
        open={showPenModal}
        title={editingPen ? `Ubah Sekat ${editingPen.code}` : 'Tambah Sekat Kandang'}
        onClose={() => setShowPenModal(false)}
      >
        <form onSubmit={handleSavePen} className="space-y-3.5">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="pen-code" className="block text-xs font-semibold mb-1">Kode</label>
              <input
                id="pen-code"
                type="text"
                value={penCode}
                onChange={(e) => setPenCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
                required
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="pen-name" className="block text-xs font-semibold mb-1">Nama Sekat</label>
              <input
                id="pen-name"
                type="text"
                value={penName}
                onChange={(e) => setPenName(e.target.value)}
                placeholder="Contoh: Penggemukan Sapi C"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="pen-cap" className="block text-xs font-semibold mb-1">
              Kapasitas Maksimal (ekor{plan.maxAnimalsPerPen !== null ? `, batas paket: ${plan.maxAnimalsPerPen}` : ''})
            </label>
            <input
              id="pen-cap"
              type="number"
              min={1}
              max={plan.maxAnimalsPerPen ?? undefined}
              value={penCap}
              onChange={(e) => setPenCap(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
              required
            />
          </div>
          <div>
            <label htmlFor="pen-notes" className="block text-xs font-semibold mb-1">Catatan</label>
            <input
              id="pen-notes"
              type="text"
              value={penNotes}
              onChange={(e) => setPenNotes(e.target.value)}
              placeholder="Contoh: Lantai karet, khusus penggemukan"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
            />
          </div>
          <button type="submit" className="w-full btn-touch rounded-full bg-[#2B2B2B] text-white text-sm font-semibold">
            {editingPen ? 'Simpan Perubahan' : 'Tambah Sekat'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
