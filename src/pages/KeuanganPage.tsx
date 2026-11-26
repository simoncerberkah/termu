import { useMemo, useState, type FormEvent } from 'react';
import { ArrowDownLeft, ArrowUpRight, Download, Plus, Printer, TrendingUp } from 'lucide-react';
import type { FarmDatabase, Transaction } from '../types/termu';
import {
  calculateBestSellSchedule,
  getActiveAnimals,
  getLatestWeight,
  getPBBH,
} from '../utils/calculations';
import { downloadTextFile, formatDateID, formatRp, todayISO, uid } from '../utils/format';
import { Modal } from '../components/Modal';

interface KeuanganPageProps {
  db: FarmDatabase;
  onAddTransaction: (tx: Transaction) => void;
}

export function KeuanganPage({ db, onAddTransaction }: KeuanganPageProps) {
  const [tab, setTab] = useState<'kas' | 'simulasi'>('kas');
  const [txFilter, setTxFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showAddTx, setShowAddTx] = useState(false);

  // Add tx form
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState('Pakan');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(todayISO());
  const [txNote, setTxNote] = useState('');

  // Best sell simulator state
  const activeAnimals = useMemo(() => getActiveAnimals(db), [db]);
  const [simAnimalId, setSimAnimalId] = useState(activeAnimals[0]?.id || '');
  const [simMarketPrice, setSimMarketPrice] = useState('62000');
  const [simDailyFeed, setSimDailyFeed] = useState('28000');

  const summary = useMemo(() => {
    const txs = db.transactions || [];
    const totalIn = txs.filter((t) => t.type === 'income').reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const totalOut = txs.filter((t) => t.type === 'expense').reduce((s, x) => s + (Number(x.amount) || 0), 0);
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [db.transactions]);

  const filteredTx = useMemo(() => {
    return [...(db.transactions || [])]
      .filter((t) => (txFilter === 'all' ? true : t.type === txFilter))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [db.transactions, txFilter]);

  const simAnimal = activeAnimals.find((a) => a.id === simAnimalId) || activeAnimals[0] || null;
  const bestSellRows = useMemo(() => {
    if (!simAnimal) return [];
    return calculateBestSellSchedule({
      species: simAnimal.species,
      baseWeight: getLatestWeight(db, simAnimal),
      pbbh: getPBBH(db, simAnimal.id),
      buyPrice: simAnimal.buy_price,
      marketPricePerKg: Number(simMarketPrice) || 62000,
      dailyFeedCost: Number(simDailyFeed) || 28000,
    });
  }, [db, simAnimal, simMarketPrice, simDailyFeed]);

  const bestProfitIdx = useMemo(() => {
    if (!bestSellRows.length) return -1;
    let best = 0;
    bestSellRows.forEach((row, i) => {
      if (row.profit > bestSellRows[best].profit) best = i;
    });
    return best;
  }, [bestSellRows]);

  function handleExportCSV() {
    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Nominal (Rp)', 'Catatan'];
    const rows = (db.transactions || []).map((t) => [
      t.date,
      t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      t.category,
      String(t.amount),
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadTextFile(csv, `termu-buku-kas-${todayISO()}.csv`, 'text/csv;charset=utf-8');
  }

  function handleAddTxSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = Number(txAmount) || 0;
    if (amount <= 0) return;
    onAddTransaction({
      id: uid('tx'),
      date: txDate,
      type: txType,
      category: txCategory.trim() || 'Lainnya',
      amount,
      note: txNote.trim(),
    });
    setTxAmount('');
    setTxNote('');
    setShowAddTx(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B2B2B]">
            Keuangan & Simulasi Jual
          </h1>
          <p className="text-xs text-[#6E7178] mt-0.5">
            Khusus Pemilik: pantau arus kas kandang, ekspor CSV/PDF, dan simulasi waktu jual optimal.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 glass-pill p-1 rounded-full self-start">
          <button
            type="button"
            onClick={() => setTab('kas')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
              tab === 'kas' ? 'bg-[#2B2B2B] text-white' : 'text-[#6E7178]'
            }`}
          >
            Buku Kas
          </button>
          <button
            type="button"
            onClick={() => setTab('simulasi')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
              tab === 'simulasi' ? 'bg-[#2B2B2B] text-white' : 'text-[#6E7178]'
            }`}
          >
            Waktu Jual Terbaik
          </button>
        </div>
      </div>

      {/* 3 Cashflow Cards */}
      <section className="grid sm:grid-cols-3 gap-4">
        <div className="bento-card p-5">
          <div className="text-xs font-semibold text-[#6E7178] inline-flex items-center gap-1.5">
            <ArrowDownLeft className="w-4 h-4 text-[#1F7A4D]" /> Total Pemasukan
          </div>
          <div className="font-metric text-3xl text-[#1F7A4D] mt-2">{formatRp(summary.totalIn)}</div>
        </div>
        <div className="bento-card p-5">
          <div className="text-xs font-semibold text-[#6E7178] inline-flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-[#C93B3B]" /> Total Pengeluaran
          </div>
          <div className="font-metric text-3xl text-[#9E2420] mt-2">{formatRp(summary.totalOut)}</div>
        </div>
        <div className="bento-card-dark p-5">
          <div className="text-xs font-semibold text-white/70">Arus Kas Bersih</div>
          <div className="font-metric text-3xl text-[#F5D547] mt-2">{formatRp(summary.net)}</div>
        </div>
      </section>

      {tab === 'kas' ? (
        <div className="bento-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1.5">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'income', label: 'Pemasukan' },
                  { id: 'expense', label: 'Pengeluaran' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTxFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold ${
                    txFilter === f.id ? 'bg-[#2B2B2B] text-white' : 'glass-tile text-[#6E7178]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 no-print">
              <button
                type="button"
                onClick={handleExportCSV}
                className="btn-touch px-3.5 py-2 rounded-full glass-tile hover:bg-white text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Ekspor CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-touch px-3.5 py-2 rounded-full glass-tile hover:bg-white text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Cetak / PDF
              </button>
              <button
                type="button"
                onClick={() => setShowAddTx(true)}
                className="btn-touch px-4 py-2 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Catat Transaksi
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredTx.map((tx) => (
              <div key={tx.id} className="glass-tile rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-[#2B2B2B]">{tx.category}</div>
                  <div className="text-[11px] text-[#6E7178]">
                    {formatDateID(tx.date)} {tx.note ? `• ${tx.note}` : ''}
                  </div>
                </div>
                <div
                  className={`text-sm font-bold tabular-nums shrink-0 ${
                    tx.type === 'income' ? 'text-[#1F7A4D]' : 'text-[#9E2420]'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'} {formatRp(tx.amount)}
                </div>
              </div>
            ))}
            {filteredTx.length === 0 && (
              <p className="text-xs text-[#6E7178] py-4 text-center">Belum ada catatan transaksi.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bento-card p-5 space-y-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#2B2B2B]" />
            <h2 className="font-display text-lg font-semibold text-[#2B2B2B]">
              Simulasi Waktu Jual Terbaik (0 / 30 / 60 / 90 Hari)
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <label className="block">
              <span className="font-semibold text-[#6E7178]">Pilih Ternak</span>
              <select
                value={simAnimal?.id || ''}
                onChange={(e) => setSimAnimalId(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              >
                {activeAnimals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.name} ({getLatestWeight(db, a)} kg)
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="font-semibold text-[#6E7178]">Harga Pasar Hidup / kg (Rp)</span>
              <input
                type="number"
                value={simMarketPrice}
                onChange={(e) => setSimMarketPrice(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
              />
            </label>
            <label className="block">
              <span className="font-semibold text-[#6E7178]">Biaya Pakan / Hari (Rp)</span>
              <input
                type="number"
                value={simDailyFeed}
                onChange={(e) => setSimDailyFeed(e.target.value)}
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {bestSellRows.map((row, idx) => {
              const isBest = idx === bestProfitIdx;
              return (
                <div
                  key={row.days}
                  className={`rounded-2xl p-4 space-y-2 border ${
                    isBest ? 'bento-card-dark border-[#F5D547]' : 'glass-tile'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isBest ? 'text-[#F5D547]' : 'text-[#2B2B2B]'}`}>
                      {row.days === 0 ? 'Jual Sekarang' : `+${row.days} Hari`}
                    </span>
                    {isBest && (
                      <span className="px-2 py-0.5 rounded-full bg-[#F5D547] text-[#2B2B2B] text-[10px] font-bold">
                        Optimal
                      </span>
                    )}
                  </div>
                  <div className={`font-metric text-2xl ${isBest ? 'text-white' : 'text-[#2B2B2B]'}`}>
                    {row.estW} kg
                  </div>
                  <div className={`text-[11px] space-y-1 ${isBest ? 'text-white/75' : 'text-[#6E7178]'}`}>
                    <div className="flex justify-between">
                      <span>Est. Omzet</span>
                      <span className="font-semibold tabular-nums">{formatRp(row.rev)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tambahan Pakan</span>
                      <span className="font-semibold tabular-nums">{formatRp(row.addFeed)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-current/15 text-xs">
                      <span>Est. Untung</span>
                      <span className={`font-bold tabular-nums ${isBest ? 'text-[#F5D547]' : 'text-[#1F7A4D]'}`}>
                        {formatRp(row.profit)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal open={showAddTx} title="Catat Transaksi Kas" onClose={() => setShowAddTx(false)}>
        <form onSubmit={handleAddTxSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTxType('income');
                setTxCategory('Penjualan Ternak');
              }}
              className={`py-2.5 rounded-xl text-xs font-bold ${
                txType === 'income' ? 'bg-[#1F7A4D] text-white' : 'glass-tile text-[#2B2B2B]'
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => {
                setTxType('expense');
                setTxCategory('Pakan');
              }}
              className={`py-2.5 rounded-xl text-xs font-bold ${
                txType === 'expense' ? 'bg-[#C93B3B] text-white' : 'glass-tile text-[#2B2B2B]'
              }`}
            >
              Pengeluaran
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-cat" className="block text-xs font-semibold mb-1">Kategori</label>
              <input
                id="tx-cat"
                type="text"
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="tx-date" className="block text-xs font-semibold mb-1">Tanggal</label>
              <input
                id="tx-date"
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="tx-amt" className="block text-xs font-semibold mb-1">Nominal (Rp)</label>
            <input
              id="tx-amt"
              type="number"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              placeholder="Contoh: 1250000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
              required
            />
          </div>
          <div>
            <label htmlFor="tx-note" className="block text-xs font-semibold mb-1">Keterangan</label>
            <input
              id="tx-note"
              type="text"
              value={txNote}
              onChange={(e) => setTxNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
            />
          </div>
          <button type="submit" className="w-full btn-touch rounded-full bg-[#2B2B2B] text-white text-sm font-semibold">
            Simpan Transaksi
          </button>
        </form>
      </Modal>
    </div>
  );
}
