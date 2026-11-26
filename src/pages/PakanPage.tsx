import { useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Calculator, CheckCircle2, Plus, Scale, Wheat } from 'lucide-react';
import type { FarmDatabase, FeedItem, FeedLog, RationFormula, Species } from '../types/termu';
import {
  calculateHPP,
  calculateRationStats,
  calculateSchoorl,
  getActiveAnimals,
} from '../utils/calculations';
import { formatDateID, formatRp, todayISO, uid } from '../utils/format';
import { Modal } from '../components/Modal';

interface PakanPageProps {
  db: FarmDatabase;
  userName: string;
  onAddFeed: (item: FeedItem) => void;
  onUpdateFeed: (feedId: string, patch: Partial<FeedItem>) => void;
  onSaveRation: (formula: RationFormula) => void;
  onAddFeedLog: (log: FeedLog) => void;
  onSaveEstimatedWeight: (animalId: string, kg: number) => void;
}

type PakanTab = 'stok' | 'mixer' | 'harian' | 'kalkulator';

export function PakanPage({
  db,
  userName,
  onAddFeed,
  onUpdateFeed,
  onSaveRation,
  onAddFeedLog,
  onSaveEstimatedWeight,
}: PakanPageProps) {
  const [tab, setTab] = useState<PakanTab>('stok');
  const [showAddFeed, setShowAddFeed] = useState(false);

  // Add feed state
  const [fName, setFName] = useState('');
  const [fPrice, setFPrice] = useState('3500');
  const [fPk, setFPk] = useState('12');
  const [fTdn, setFTdn] = useState('65');
  const [fStock, setFStock] = useState('500');
  const [fDaily, setFDaily] = useState('40');

  // Ration mixer state (Formula A vs B)
  const initialMapA = useMemo(() => {
    const map: Record<string, number> = {};
    const first = db.rations[0];
    for (const f of db.feeds) {
      map[f.id] = first?.items.find((i) => i.feed_id === f.id)?.kg || 0;
    }
    return map;
  }, [db.feeds, db.rations]);

  const initialMapB = useMemo(() => {
    const map: Record<string, number> = {};
    const second = db.rations[1] || db.rations[0];
    for (const f of db.feeds) {
      map[f.id] = second?.items.find((i) => i.feed_id === f.id)?.kg || 0;
    }
    return map;
  }, [db.feeds, db.rations]);

  const [mapA, setMapA] = useState<Record<string, number>>(initialMapA);
  const [mapB, setMapB] = useState<Record<string, number>>(initialMapB);

  const statsA = useMemo(() => calculateRationStats(db.feeds, mapA), [db.feeds, mapA]);
  const statsB = useMemo(() => calculateRationStats(db.feeds, mapB), [db.feeds, mapB]);

  // Daily feed log state
  const [logPenId, setLogPenId] = useState(db.pens[0]?.id || '');
  const [logRation, setLogRation] = useState(db.rations[0]?.name || 'Ransum Penggemukan');
  const [logKg, setLogKg] = useState('120');
  const [logCost, setLogCost] = useState('320000');

  // Schoorl & HPP calculator state
  const activeAnimals = useMemo(() => getActiveAnimals(db), [db]);
  const [calcSpecies, setCalcSpecies] = useState<Species>('Sapi');
  const [chestCm, setChestCm] = useState(182);
  const [carcassPct, setCarcassPct] = useState(52);
  const [saveAnimalId, setSaveAnimalId] = useState(activeAnimals[0]?.id || '');

  const [hppBuy, setHppBuy] = useState('19500000');
  const [hppFeed, setHppFeed] = useState('4200000');
  const [hppMed, setHppMed] = useState('350000');
  const [hppLabor, setHppLabor] = useState('650000');
  const [marketPriceKg, setMarketPriceKg] = useState('62000');

  const schoorl = useMemo(
    () => calculateSchoorl(calcSpecies, chestCm, carcassPct),
    [calcSpecies, chestCm, carcassPct]
  );

  const hpp = useMemo(
    () =>
      calculateHPP({
        estWeight: schoorl.estWeight,
        buyPrice: Number(hppBuy) || 0,
        feedCost: Number(hppFeed) || 0,
        medCost: Number(hppMed) || 0,
        laborCost: Number(hppLabor) || 0,
        marketPricePerKg: Number(marketPriceKg) || 0,
      }),
    [schoorl.estWeight, hppBuy, hppFeed, hppMed, hppLabor, marketPriceKg]
  );

  function handleAddFeedSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fName.trim()) return;
    onAddFeed({
      id: uid('feed'),
      farm_id: db.farm.id,
      name: fName.trim(),
      price: Math.max(0, Number(fPrice) || 0),
      pk: Math.max(0, Number(fPk) || 0),
      tdn: Math.max(0, Number(fTdn) || 0),
      stock_kg: Math.max(0, Number(fStock) || 0),
      daily_use_kg: Math.max(0, Number(fDaily) || 0),
      unit: 'kg',
    });
    setFName('');
    setShowAddFeed(false);
  }

  function handleAddLogSubmit(e: FormEvent) {
    e.preventDefault();
    onAddFeedLog({
      id: uid('flog'),
      date: todayISO(),
      pen_id: logPenId || db.pens[0]?.id || '',
      ration_name: logRation.trim() || 'Ransum Harian',
      total_kg: Math.max(1, Number(logKg) || 0),
      cost: Math.max(0, Number(logCost) || 0),
      recorded_by: userName,
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B2B2B]">
            Pakan, Ransum & Kalkulator HPP
          </h1>
          <p className="text-xs text-[#6E7178] mt-0.5">
            Kelola stok bahan, bandingkan formula ransum, catat pemberian harian, dan hitung Schoorl & HPP.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 glass-pill p-1 rounded-full self-start">
          {(
            [
              { id: 'stok', label: 'Bahan & Stok' },
              { id: 'mixer', label: 'Mixer Ransum' },
              { id: 'harian', label: 'Catat Harian' },
              { id: 'kalkulator', label: 'Schoorl & HPP' },
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

      {/* TAB 1: BAHAN & STOK */}
      {tab === 'stok' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowAddFeed(true)}
              className="btn-touch px-4 py-2 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tambah Bahan Pakan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {db.feeds.map((feed) => {
              const daysLeft = feed.daily_use_kg > 0 ? Math.floor(feed.stock_kg / feed.daily_use_kg) : null;
              const isLow = daysLeft !== null && daysLeft <= 5;

              return (
                <div key={feed.id} className="bento-card p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#FBF6E3] flex items-center justify-center text-[#2B2B2B]">
                        <Wheat className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-base text-[#2B2B2B]">{feed.name}</h3>
                        <p className="text-[11px] text-[#6E7178]">
                          PK {feed.pk}% • TDN {feed.tdn}%
                        </p>
                      </div>
                    </div>
                    {isLow ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FCE8E8] text-[#9E2420] text-[10px] font-bold inline-flex items-center gap-1 shrink-0">
                        <AlertTriangle className="w-3 h-3" /> ±{Math.max(1, daysLeft)} hr
                      </span>
                    ) : daysLeft !== null ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E9F7EF] text-[#1F7A4D] text-[10px] font-bold shrink-0">
                        ±{daysLeft} hari
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="glass-tile rounded-xl p-2.5 block">
                      <span className="block text-[10px] font-semibold text-[#6E7178]">Harga / kg (Rp)</span>
                      <input
                        type="number"
                        value={feed.price}
                        onChange={(e) => onUpdateFeed(feed.id, { price: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full mt-1 bg-transparent font-bold text-sm text-[#2B2B2B] tabular-nums"
                      />
                    </label>
                    <label className="glass-tile rounded-xl p-2.5 block">
                      <span className="block text-[10px] font-semibold text-[#6E7178]">Stok Gudang (kg)</span>
                      <input
                        type="number"
                        value={feed.stock_kg}
                        onChange={(e) => onUpdateFeed(feed.id, { stock_kg: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full mt-1 bg-transparent font-bold text-sm text-[#2B2B2B] tabular-nums"
                      />
                    </label>
                  </div>

                  <div className="text-[11px] text-[#6E7178] flex justify-between">
                    <span>Pemakaian harian: {feed.daily_use_kg} kg/hr</span>
                    <span className="font-semibold text-[#2B2B2B] tabular-nums">
                      Nilai stok: {formatRp(feed.stock_kg * feed.price)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MIXER RANSUM */}
      {tab === 'mixer' && (
        <div className="grid lg:grid-cols-2 gap-5">
          {[
            { label: 'Formula A (Utama)', map: mapA, setMap: setMapA, stats: statsA, id: db.rations[0]?.id || 'rat_a' },
            { label: 'Formula B (Pembanding)', map: mapB, setMap: setMapB, stats: statsB, id: db.rations[1]?.id || 'rat_b' },
          ].map((col) => (
            <div key={col.label} className="bento-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-[#2B2B2B]">{col.label}</h2>
                <button
                  type="button"
                  onClick={() =>
                    onSaveRation({
                      id: col.id,
                      name: col.label,
                      items: db.feeds
                        .filter((f) => (col.map[f.id] || 0) > 0)
                        .map((f) => ({ feed_id: f.id, kg: col.map[f.id] || 0 })),
                    })
                  }
                  className="px-3.5 py-1.5 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold"
                >
                  Simpan Formula
                </button>
              </div>

              <div className="space-y-2">
                {db.feeds.map((f) => (
                  <div key={f.id} className="glass-tile rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#2B2B2B] truncate">{f.name}</div>
                      <div className="text-[10px] text-[#6E7178]">
                        {formatRp(f.price)}/kg • PK {f.pk}% • TDN {f.tdn}%
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        aria-label={`${f.name} kg pada ${col.label}`}
                        value={col.map[f.id] ?? 0}
                        onChange={(e) =>
                          col.setMap((prev) => ({ ...prev, [f.id]: Math.max(0, Number(e.target.value) || 0) }))
                        }
                        className="w-20 px-2.5 py-1.5 rounded-lg bg-white border border-black/10 text-xs font-bold text-right tabular-nums"
                      />
                      <span className="text-xs text-[#6E7178]">kg</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-black/[0.06]">
                <div className="glass-tile rounded-xl p-2.5">
                  <div className="text-[10px] text-[#6E7178]">Total Bobot</div>
                  <div className="font-bold text-sm text-[#2B2B2B] tabular-nums">{col.stats.totalKg} kg</div>
                </div>
                <div className="glass-tile rounded-xl p-2.5">
                  <div className="text-[10px] text-[#6E7178]">Biaya/Ekor/Hr</div>
                  <div className="font-bold text-sm text-[#2B2B2B] tabular-nums">{formatRp(col.stats.totalCost)}</div>
                </div>
                <div className="glass-tile rounded-xl p-2.5">
                  <div className="text-[10px] text-[#6E7178]">Protein Kasar</div>
                  <div className="font-bold text-sm text-[#1F7A4D] tabular-nums">{col.stats.pk}%</div>
                </div>
                <div className="glass-tile rounded-xl p-2.5">
                  <div className="text-[10px] text-[#6E7178]">TDN Energi</div>
                  <div className="font-bold text-sm text-[#2B2B2B] tabular-nums">{col.stats.tdn}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: CATAT HARIAN */}
      {tab === 'harian' && (
        <div className="grid lg:grid-cols-12 gap-5">
          <form onSubmit={handleAddLogSubmit} className="lg:col-span-5 bento-card p-5 space-y-3.5 self-start">
            <h2 className="font-display text-lg font-semibold text-[#2B2B2B]">Catat Pemberian Pakan</h2>
            <div>
              <label htmlFor="flog-pen" className="block text-xs font-semibold mb-1">Sekat Kandang</label>
              <select
                id="flog-pen"
                value={logPenId}
                onChange={(e) => setLogPenId(e.target.value)}
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
              <label htmlFor="flog-ration" className="block text-xs font-semibold mb-1">Nama Ransum / Jenis</label>
              <input
                id="flog-ration"
                type="text"
                value={logRation}
                onChange={(e) => setLogRation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="flog-kg" className="block text-xs font-semibold mb-1">Total Berat (kg)</label>
                <input
                  id="flog-kg"
                  type="number"
                  value={logKg}
                  onChange={(e) => setLogKg(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
                  required
                />
              </div>
              <div>
                <label htmlFor="flog-cost" className="block text-xs font-semibold mb-1">Estimasi Biaya (Rp)</label>
                <input
                  id="flog-cost"
                  type="number"
                  value={logCost}
                  onChange={(e) => setLogCost(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
                  required
                />
              </div>
            </div>
            <button type="submit" className="w-full btn-touch rounded-full bg-[#2B2B2B] text-white text-sm font-semibold">
              Simpan Catatan Pakan
            </button>
          </form>

          <div className="lg:col-span-7 bento-card p-5 space-y-3">
            <h2 className="font-display text-lg font-semibold text-[#2B2B2B]">Riwayat Pemberian Pakan</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {[...(db.feed_logs || [])].reverse().map((log) => {
                const pen = db.pens.find((p) => p.id === log.pen_id);
                return (
                  <div key={log.id} className="glass-tile rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-[#2B2B2B]">
                        {log.ration_name} — {pen ? `Sekat ${pen.code}` : 'Umum'}
                      </div>
                      <div className="text-[11px] text-[#6E7178]">
                        {formatDateID(log.date)} • Dicatat oleh {log.recorded_by}
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="text-xs font-bold text-[#2B2B2B]">{formatRp(log.cost)}</div>
                      <div className="text-[11px] text-[#6E7178]">{log.total_kg} kg</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCHOORL & HPP */}
      {tab === 'kalkulator' && (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Schoorl Weight Estimator */}
          <div className="bento-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#2B2B2B]" />
              <h2 className="font-display text-lg font-semibold text-[#2B2B2B]">
                Taksir Bobot (Rumus Schoorl)
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['Sapi', 'Kambing', 'Domba'] as Species[]).map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => {
                    setCalcSpecies(sp);
                    setChestCm(sp === 'Sapi' ? 182 : 76);
                    setCarcassPct(sp === 'Sapi' ? 52 : 46);
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold transition ${
                    calcSpecies === sp ? 'bg-[#2B2B2B] text-white' : 'glass-tile text-[#2B2B2B]'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <label htmlFor="schoorl-chest">Lingkar Dada (cm)</label>
                <span className="tabular-nums font-bold">{chestCm} cm</span>
              </div>
              <input
                id="schoorl-chest"
                type="range"
                min={calcSpecies === 'Sapi' ? 120 : 45}
                max={calcSpecies === 'Sapi' ? 240 : 115}
                value={chestCm}
                onChange={(e) => setChestCm(Number(e.target.value))}
                className="w-full accent-[#2B2B2B]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <label htmlFor="schoorl-carcass">Estimasi Karkas (%)</label>
                <span className="tabular-nums font-bold">{carcassPct}%</span>
              </div>
              <input
                id="schoorl-carcass"
                type="range"
                min={40}
                max={60}
                value={carcassPct}
                onChange={(e) => setCarcassPct(Number(e.target.value))}
                className="w-full accent-[#2B2B2B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-accent rounded-2xl p-4">
                <div className="text-[11px] font-semibold text-[#2B2B2B]/80">Estimasi Bobot Hidup</div>
                <div className="font-metric text-3xl text-[#2B2B2B] mt-1">{schoorl.estWeight} kg</div>
              </div>
              <div className="glass-tile rounded-2xl p-4">
                <div className="text-[11px] font-semibold text-[#6E7178]">Estimasi Karkas</div>
                <div className="font-metric text-3xl text-[#2B2B2B] mt-1">{schoorl.estCarcass} kg</div>
              </div>
            </div>

            {activeAnimals.length > 0 && (
              <div className="pt-3 border-t border-black/[0.06] flex flex-col sm:flex-row gap-2">
                <select
                  aria-label="Pilih ternak untuk simpan estimasi bobot"
                  value={saveAnimalId}
                  onChange={(e) => setSaveAnimalId(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-full bg-white border border-black/10 text-xs font-semibold"
                >
                  {activeAnimals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} — {a.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onSaveEstimatedWeight(saveAnimalId || activeAnimals[0].id, schoorl.estWeight)}
                  className="btn-touch px-4 py-2 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" /> Simpan ke Riwayat Bobot
                </button>
              </div>
            )}
          </div>

          {/* HPP & Profit Calculator */}
          <div className="bento-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#2B2B2B]" />
              <h2 className="font-display text-lg font-semibold text-[#2B2B2B]">
                Kalkulator HPP & Estimasi Untung
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="block">
                <span className="font-semibold text-[#6E7178]">Harga Beli Bakalan (Rp)</span>
                <input
                  type="number"
                  value={hppBuy}
                  onChange={(e) => setHppBuy(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-black/10 tabular-nums"
                />
              </label>
              <label className="block">
                <span className="font-semibold text-[#6E7178]">Total Biaya Pakan (Rp)</span>
                <input
                  type="number"
                  value={hppFeed}
                  onChange={(e) => setHppFeed(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-black/10 tabular-nums"
                />
              </label>
              <label className="block">
                <span className="font-semibold text-[#6E7178]">Obat & Vaksin (Rp)</span>
                <input
                  type="number"
                  value={hppMed}
                  onChange={(e) => setHppMed(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-black/10 tabular-nums"
                />
              </label>
              <label className="block">
                <span className="font-semibold text-[#6E7178]">Tenaga & Operasional (Rp)</span>
                <input
                  type="number"
                  value={hppLabor}
                  onChange={(e) => setHppLabor(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-black/10 tabular-nums"
                />
              </label>
              <label className="block col-span-2">
                <span className="font-semibold text-[#6E7178]">Harga Pasar Bobot Hidup / kg (Rp)</span>
                <input
                  type="number"
                  value={marketPriceKg}
                  onChange={(e) => setMarketPriceKg(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-black/10 tabular-nums"
                />
              </label>
            </div>

            <div className="bento-card-dark p-4 space-y-2 text-xs">
              <div className="flex justify-between text-white/75">
                <span>Total Modal (HPP)</span>
                <span className="font-bold text-white tabular-nums">{formatRp(hpp.totalHPP)}</span>
              </div>
              <div className="flex justify-between text-white/75">
                <span>HPP per kg ({schoorl.estWeight} kg)</span>
                <span className="font-bold text-white tabular-nums">{formatRp(hpp.hppPerKg)}/kg</span>
              </div>
              <div className="flex justify-between text-white/75">
                <span>Estimasi Nilai Jual</span>
                <span className="font-bold text-white tabular-nums">{formatRp(hpp.marketVal)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/15 text-sm">
                <span className="font-semibold">Estimasi Margin Bersih</span>
                <span className={`font-display font-bold tabular-nums ${hpp.estProfit >= 0 ? 'text-[#F5D547]' : 'text-[#FCA5A5]'}`}>
                  {formatRp(hpp.estProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal open={showAddFeed} title="Tambah Bahan Pakan" onClose={() => setShowAddFeed(false)}>
        <form onSubmit={handleAddFeedSubmit} className="space-y-3">
          <div>
            <label htmlFor="fd-name" className="block text-xs font-semibold mb-1">Nama Bahan</label>
            <input
              id="fd-name"
              type="text"
              value={fName}
              onChange={(e) => setFName(e.target.value)}
              placeholder="Contoh: Bungkil Kopra / Kulit Singkong"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="fd-price" className="block text-xs font-semibold mb-1">Harga / kg (Rp)</label>
              <input
                id="fd-price"
                type="number"
                value={fPrice}
                onChange={(e) => setFPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="fd-stock" className="block text-xs font-semibold mb-1">Stok Awal (kg)</label>
              <input
                id="fd-stock"
                type="number"
                value={fStock}
                onChange={(e) => setFStock(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="fd-pk" className="block text-xs font-semibold mb-1">Protein Kasar (%)</label>
              <input
                id="fd-pk"
                type="number"
                step="0.1"
                value={fPk}
                onChange={(e) => setFPk(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="fd-tdn" className="block text-xs font-semibold mb-1">TDN (%)</label>
              <input
                id="fd-tdn"
                type="number"
                step="0.1"
                value={fTdn}
                onChange={(e) => setFTdn(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
              />
            </div>
          </div>
          <div>
            <label htmlFor="fd-daily" className="block text-xs font-semibold mb-1">Estimasi Pakai / Hari (kg)</label>
            <input
              id="fd-daily"
              type="number"
              value={fDaily}
              onChange={(e) => setFDaily(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
            />
          </div>
          <button type="submit" className="w-full btn-touch rounded-full bg-[#2B2B2B] text-white text-sm font-semibold">
            Simpan Bahan Pakan
          </button>
        </form>
      </Modal>
    </div>
  );
}
