import type {
  Animal,
  AppMode,
  CheckoutBreakdown,
  CheckoutFormValues,
  DecisionSuggestion,
  DeliveryMethod,
  FarmDatabase,
  FeedItem,
  HealthEvent,
  MarketplaceOrder,
  SellerReview,
  ShippingFleetOption,
  ShippingRegionTariff,
  Species,
  SubscriptionTier,
  UserRole,
  WeightRecord,
} from '../types/termu';
import { formatDateID, formatRp, formatShortDate } from './format';

export const SHIPPING_SERVICE_FEE = 10000;

export const SHIPPING_FLEETS: ShippingFleetOption[] = [
  {
    id: 'pickup_ternak',
    name: 'Pick-up Bak Ternak Khusus',
    subtitle: 'Cocok untuk 1 sapi atau 1–6 kambing/domba dengan sekat pengaman',
    etaLabel: 'Estimasi 2–6 jam (tergantung jarak)',
    multiplier: 1.0,
    suitableFor: ['Sapi', 'Kambing', 'Domba'],
  },
  {
    id: 'truk_sapi',
    name: 'Truk Engkel Angkut Ternak',
    subtitle: 'Lantai karet anti-selip, rangka besi pengikat, dan alas sekam kering',
    etaLabel: 'Estimasi 3–8 jam (tergantung jarak)',
    multiplier: 1.35,
    suitableFor: ['Sapi', 'Kambing', 'Domba'],
  },
  {
    id: 'ekspedisi_antarkota',
    name: 'Ekspedisi Hewan Antar-Kota Berizin',
    subtitle: 'Termasuk pendampingan pakan/minum di jalan & kelengkapan surat jalan',
    etaLabel: 'Estimasi 1 hari kerja (antar kota/provinsi)',
    multiplier: 1.65,
    suitableFor: ['Sapi', 'Kambing', 'Domba'],
  },
];

export const SHIPPING_REGIONS: ShippingRegionTariff[] = [
  {
    id: 'semarang_kota',
    name: 'Kota Semarang & Sekitarnya',
    province: 'Jawa Tengah',
    baseCowFee: 250000,
    baseSmallFee: 100000,
    distanceNote: 'Radius ≤ 25 km dari kandang Semarang Utara',
  },
  {
    id: 'kendal_demak',
    name: 'Kab. Kendal & Demak',
    province: 'Jawa Tengah',
    baseCowFee: 350000,
    baseSmallFee: 150000,
    distanceNote: 'Radius 25–45 km • Jalur Pantura',
  },
  {
    id: 'salatiga_boyolali',
    name: 'Salatiga, Ungaran & Boyolali',
    province: 'Jawa Tengah',
    baseCowFee: 450000,
    baseSmallFee: 185000,
    distanceNote: 'Radius 45–80 km • Jalur Tol Semarang–Solo',
  },
  {
    id: 'kudus_jepara_pati',
    name: 'Kudus, Jepara & Pati',
    province: 'Jawa Tengah',
    baseCowFee: 550000,
    baseSmallFee: 225000,
    distanceNote: 'Radius 60–95 km • Pantura Timur',
  },
  {
    id: 'solo_klaten',
    name: 'Surakarta (Solo), Sukoharjo & Klaten',
    province: 'Jawa Tengah',
    baseCowFee: 650000,
    baseSmallFee: 260000,
    distanceNote: 'Radius 95–120 km • Akses Tol Trans Jawa',
  },
  {
    id: 'jogja_magelang',
    name: 'DI Yogyakarta & Magelang',
    province: 'DIY / Jawa Tengah',
    baseCowFee: 750000,
    baseSmallFee: 300000,
    distanceNote: 'Radius 100–130 km • Jalur Selatan',
  },
  {
    id: 'jateng_barat',
    name: 'Pekalongan, Tegal & Purwokerto',
    province: 'Jawa Tengah',
    baseCowFee: 900000,
    baseSmallFee: 360000,
    distanceNote: 'Radius 130–200 km • Antar-Kabupaten',
  },
  {
    id: 'luar_jateng',
    name: 'Luar Jawa Tengah (Jatim / Jabar / Jabodetabek)',
    province: 'Antar-Provinsi',
    baseCowFee: 1450000,
    baseSmallFee: 550000,
    distanceNote: 'Pengiriman jarak jauh via jalur tol & surat jalan',
  },
];

export function calculateCheckoutTotals(params: {
  itemPrice: number;
  species: Species;
  deliveryMethod: DeliveryMethod;
  fleetId: string;
  regionId: string;
}): CheckoutBreakdown {
  const itemPrice = Math.max(0, Math.round(Number(params.itemPrice) || 0));

  if (params.deliveryMethod === 'pickup') {
    return {
      itemPrice,
      shippingFee: 0,
      serviceFee: 0,
      totalAmount: itemPrice,
      fleetName: 'Ambil Sendiri ke Kandang',
      regionName: 'Lokasi Kandang Penjual',
    };
  }

  const fleet = SHIPPING_FLEETS.find((f) => f.id === params.fleetId) || SHIPPING_FLEETS[0];
  const region = SHIPPING_REGIONS.find((r) => r.id === params.regionId) || SHIPPING_REGIONS[0];
  const baseFee = params.species === 'Sapi' ? region.baseCowFee : region.baseSmallFee;
  const rawShipping = baseFee * fleet.multiplier;
  const shippingFee = Math.round(rawShipping / 5000) * 5000;
  const serviceFee = SHIPPING_SERVICE_FEE;

  return {
    itemPrice,
    shippingFee,
    serviceFee,
    totalAmount: itemPrice + shippingFee + serviceFee,
    fleetName: fleet.name,
    regionName: region.name,
  };
}

export function validateCheckoutForm(values: CheckoutFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.buyerName.trim() || values.buyerName.trim().length < 2) {
    errors.buyerName = 'Masukkan nama pemesan minimal 2 karakter.';
  }
  const cleanPhone = values.buyerPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 9) {
    errors.buyerPhone = 'Masukkan nomor WhatsApp aktif minimal 9 digit.';
  }
  if (values.deliveryMethod === 'delivery') {
    if (!values.fleetId) errors.fleetId = 'Pilih layanan armada pengiriman hewan.';
    if (!values.regionId) errors.regionId = 'Pilih daerah tujuan pengiriman.';
    if (!values.address.trim() || values.address.trim().length < 10) {
      errors.address = 'Isi alamat tujuan lengkap (jalan/desa, kecamatan, patokan) minimal 10 karakter.';
    }
  }
  return errors;
}

export function getActiveAnimals(db: FarmDatabase): Animal[] {
  return (db.animals || []).filter((a) => a.status !== 'terjual' && a.status !== 'mati');
}

export function getAnimalWeights(db: FarmDatabase, animalId: string): WeightRecord[] {
  return (db.weights || [])
    .filter((w) => w.animal_id === animalId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getLatestWeight(db: FarmDatabase, animal: Animal): number {
  const list = getAnimalWeights(db, animal.id);
  return list.length > 0 ? Number(list[list.length - 1].kg) : Number(animal.entry_weight) || 0;
}

export function getPBBH(db: FarmDatabase, animalId: string): number | null {
  const list = getAnimalWeights(db, animalId);
  if (list.length < 2) return null;
  const prev = list[list.length - 2];
  const curr = list[list.length - 1];
  const days = Math.max(1, Math.round((new Date(curr.date).getTime() - new Date(prev.date).getTime()) / 86400000));
  return +((curr.kg - prev.kg) / days).toFixed(2);
}

export function getActiveWithdrawal(db: FarmDatabase, animalId: string, today: string): HealthEvent | null {
  return (
    (db.health_events || []).find(
      (ev) => ev.animal_id === animalId && Boolean(ev.withdrawal_until) && ev.withdrawal_until >= today
    ) || null
  );
}

export function calculateSchoorl(species: Species, chestCm: number, carcassPct: number) {
  const chest = Math.max(40, Number(chestCm) || 0);
  const constantAdd = species === 'Sapi' ? 22 : 18;
  const estWeight = +(((chest + constantAdd) ** 2) / 100).toFixed(1);
  const clampedCarcass = Math.min(65, Math.max(35, Number(carcassPct) || 50));
  const estCarcass = +(estWeight * (clampedCarcass / 100)).toFixed(1);
  return { chest, estWeight, carcassPct: clampedCarcass, estCarcass };
}

export function calculateHPP(params: {
  estWeight: number;
  buyPrice: number;
  feedCost: number;
  medCost: number;
  laborCost: number;
  marketPricePerKg: number;
}) {
  const totalHPP =
    (Number(params.buyPrice) || 0) +
    (Number(params.feedCost) || 0) +
    (Number(params.medCost) || 0) +
    (Number(params.laborCost) || 0);
  const hppPerKg = params.estWeight > 0 ? Math.round(totalHPP / params.estWeight) : 0;
  const marketVal = Math.round(params.estWeight * (Number(params.marketPricePerKg) || 0));
  const estProfit = marketVal - totalHPP;
  return { totalHPP, hppPerKg, marketVal, estProfit };
}

export function calculateRationStats(feeds: FeedItem[], kgMap: Record<string, number>) {
  let totalKg = 0;
  let totalCost = 0;
  let weightedPK = 0;
  let weightedTDN = 0;
  for (const f of feeds) {
    const kg = Math.max(0, Number(kgMap[f.id]) || 0);
    totalKg += kg;
    totalCost += kg * (Number(f.price) || 0);
    weightedPK += kg * (Number(f.pk) || 0);
    weightedTDN += kg * (Number(f.tdn) || 0);
  }
  return {
    totalKg: +totalKg.toFixed(1),
    totalCost: Math.round(totalCost),
    costPerKg: totalKg > 0 ? Math.round(totalCost / totalKg) : 0,
    pk: totalKg > 0 ? +(weightedPK / totalKg).toFixed(1) : 0,
    tdn: totalKg > 0 ? +(weightedTDN / totalKg).toFixed(1) : 0,
  };
}

export function calculateBestSellSchedule(params: {
  species: Species;
  baseWeight: number;
  pbbh: number | null;
  buyPrice: number;
  marketPricePerKg: number;
  dailyFeedCost: number;
}) {
  const effectivePbbh = params.pbbh ?? (params.species === 'Sapi' ? 0.85 : 0.11);
  const priceKg = Math.max(0, Number(params.marketPricePerKg) || 62000);
  const feedDay = Math.max(0, Number(params.dailyFeedCost) || 26000);
  const modalAwal = Number(params.buyPrice) > 0 ? Number(params.buyPrice) : Math.round(params.baseWeight * priceKg * 0.72);
  const factors = [1, 0.96, 0.88, 0.78];

  return [0, 30, 60, 90].map((days, idx) => {
    const estW = +(params.baseWeight + Math.max(0, effectivePbbh) * days * factors[idx]).toFixed(1);
    const rev = Math.round(estW * priceKg);
    const addFeed = days * feedDay;
    const profit = rev - (modalAwal + addFeed);
    return { days, estW, rev, addFeed, profit };
  });
}

export function getDecisionSuggestions(db: FarmDatabase, today: string): DecisionSuggestion[] {
  const items: DecisionSuggestion[] = [];
  const active = getActiveAnimals(db);

  // 1. Active withdrawal period
  for (const an of active) {
    const wd = getActiveWithdrawal(db, an.id, today);
    if (wd) {
      items.push({
        id: `wd_${an.id}`,
        level: 'danger',
        title: `Tahan penjualan ${an.name} (${an.id})`,
        reason: `Masih dalam masa henti obat (${wd.treatment}) hingga ${formatDateID(wd.withdrawal_until)}.`,
        actionLabel: 'Lihat Profil',
        actionPage: 'ternak',
        animalId: an.id,
      });
    }
  }

  // 2. Overdue schedules
  for (const s of (db.schedules || []).filter((x) => !x.done && x.date < today)) {
    items.push({
      id: `sch_${s.id}`,
      level: 'warning',
      title: `Jadwal terlewat: ${s.title}`,
      reason: `Dijadwalkan ${formatDateID(s.date)} dan belum ditandai selesai.`,
      actionLabel: 'Cek Kesehatan',
      actionPage: 'kesehatan',
      animalId: s.animal_id || null,
    });
  }

  // 3. Slow growth across last 2 intervals
  for (const an of active) {
    const wts = getAnimalWeights(db, an.id);
    if (wts.length >= 3) {
      const w1 = wts[wts.length - 3];
      const w2 = wts[wts.length - 2];
      const w3 = wts[wts.length - 1];
      const d1 = Math.max(1, Math.round((new Date(w2.date).getTime() - new Date(w1.date).getTime()) / 86400000));
      const d2 = Math.max(1, Math.round((new Date(w3.date).getTime() - new Date(w2.date).getTime()) / 86400000));
      const p1 = (w2.kg - w1.kg) / d1;
      const p2 = (w3.kg - w2.kg) / d2;
      const minGain = an.species === 'Sapi' ? 0.45 : 0.05;
      if (p1 < minGain && p2 < minGain) {
        const gainLast = +(w3.kg - w2.kg).toFixed(1);
        items.push({
          id: `slow_${an.id}`,
          level: 'warning',
          title: `Pertumbuhan ${an.name} (${an.id}) melambat`,
          reason: `Karena bobot naik hanya ${gainLast} kg dalam ${d2} hari (2 penimbangan berturut-turut di bawah target).`,
          actionLabel: 'Buka Ternak',
          actionPage: 'ternak',
          animalId: an.id,
        });
      }
    }
  }

  // 4. Low feed stock <= 5 days
  for (const fd of db.feeds || []) {
    if (fd.daily_use_kg > 0) {
      const days = Math.floor(fd.stock_kg / fd.daily_use_kg);
      if (days <= 5) {
        items.push({
          id: `fd_${fd.id}`,
          level: 'warning',
          title: `Stok ${fd.name} segera habis`,
          reason: `Tersisa ${fd.stock_kg} kg; diperkirakan habis dalam ±${Math.max(1, days)} hari lagi.`,
          actionLabel: 'Cek Stok Pakan',
          actionPage: 'pakan',
          animalId: null,
        });
      }
    }
  }

  // 5. Optimal sale weight
  const optimalCow = active.find(
    (a) => a.species === 'Sapi' && getLatestWeight(db, a) >= 480 && !getActiveWithdrawal(db, a.id, today)
  );
  if (optimalCow) {
    items.push({
      id: `opt_${optimalCow.id}`,
      level: 'success',
      title: `${optimalCow.name} (${optimalCow.id}) mendekati titik jual optimal`,
      reason: `Bobot sudah mencapai ${getLatestWeight(db, optimalCow)} kg dengan pertumbuhan stabil. Cek estimasi untung sebelum biaya pakan berlebih.`,
      actionLabel: 'Hitung HPP',
      actionPage: 'pakan',
      animalId: optimalCow.id,
    });
  }

  return items;
}

export function predictAnimal(db: FarmDatabase, an: Animal, today: string) {
  const latestW = getLatestWeight(db, an);
  const rawPbbh = getPBBH(db, an.id);
  const defaultPbbh = an.species === 'Sapi' ? 0.8 : 0.11;
  const pbbh = rawPbbh !== null ? rawPbbh : defaultPbbh;
  const proj30 = +(latestW + Math.max(0, pbbh) * 30 * 0.95).toFixed(1);
  const proj60 = +(latestW + Math.max(0, pbbh) * 60 * 0.88).toFixed(1);
  const targetW = an.species === 'Sapi' ? 500 : 40;
  const gap = Math.max(0, targetW - latestW);
  const daysToTarget = gap === 0 ? 0 : pbbh > 0.02 ? Math.ceil(gap / pbbh) : null;
  const wd = getActiveWithdrawal(db, an.id, today);
  return { an, latestW, pbbh, hasMeasuredPbbh: rawPbbh !== null, proj30, proj60, targetW, daysToTarget, wd };
}

export function getFarmPredictionsSummary(db: FarmDatabase, today: string) {
  const active = getActiveAnimals(db);
  const cows = active.filter((a) => a.species === 'Sapi');
  const group = cows.length > 0 ? cows : active;
  const preds = active.map((an) => predictAnimal(db, an, today));
  const groupPreds = group.map((an) => predictAnimal(db, an, today));

  const avgNow = groupPreds.length ? +(groupPreds.reduce((s, x) => s + x.latestW, 0) / groupPreds.length).toFixed(1) : 0;
  const avg30 = groupPreds.length ? +(groupPreds.reduce((s, x) => s + x.proj30, 0) / groupPreds.length).toFixed(1) : 0;
  const avg60 = groupPreds.length ? +(groupPreds.reduce((s, x) => s + x.proj60, 0) / groupPreds.length).toFixed(1) : 0;

  const readyCandidates = preds
    .filter((x) => !x.wd && x.an.status !== 'mati' && x.an.status !== 'terjual')
    .sort((a, b) => b.latestW / b.targetW - a.latestW / a.targetW);

  const lowFeeds = (db.feeds || [])
    .filter((f) => f.daily_use_kg > 0)
    .map((f) => ({ ...f, daysLeft: Math.floor(f.stock_kg / f.daily_use_kg) }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const slowGrowers = preds.filter((x) => x.hasMeasuredPbbh && x.pbbh < (x.an.species === 'Sapi' ? 0.45 : 0.05));
  const withdrawals = preds.filter((x) => Boolean(x.wd));

  return {
    totalActive: active.length,
    groupLabel: cows.length > 0 ? 'Sapi' : 'Ternak',
    avgNow,
    avg30,
    avg60,
    preds,
    readyCandidates,
    lowFeeds,
    slowGrowers,
    withdrawals,
    suggestions: getDecisionSuggestions(db, today),
  };
}

export interface OwnerAIContextExtras {
  ownerName?: string;
  subscriptionTier?: SubscriptionTier;
  orders?: MarketplaceOrder[];
  reviews?: SellerReview[];
}

export function buildFarmContextText(
  db: FarmDatabase,
  role: UserRole,
  mode: AppMode,
  today: string,
  extras?: OwnerAIContextExtras
): string {
  const isOwner = role === 'pemilik';
  const sum = getFarmPredictionsSummary(db, today);
  const pens = db.pens || [];

  const penLines = pens
    .map((p) => {
      const occ = sum.preds.filter((x) => x.an.pen_id === p.id).length;
      return `- Sekat ${p.code} (${p.name}): terisi ${occ}/${p.capacity} ekor, kebersihan: ${p.cleanliness}, air: ${p.water_status}${p.notes ? `, catatan: ${p.notes}` : ''}`;
    })
    .join('\n');

  const animalLines = sum.preds
    .slice(0, 60)
    .map((x) => {
      const pen = pens.find((p) => p.id === x.an.pen_id);
      const buyInfo = isOwner && x.an.buy_price > 0 ? `, modal beli: ${formatRp(x.an.buy_price)}` : '';
      const notesInfo = x.an.notes ? `, catatan: ${x.an.notes}` : '';
      return `- ${x.an.id} (${x.an.name}), ${x.an.species} ${x.an.breed}, ${x.an.sex}, Sekat ${pen ? pen.code : '-'}, status: ${x.an.status}, bobot kini: ${x.latestW} kg, PBBH: ${x.pbbh} kg/hr, prediksi +30hr: ${x.proj30} kg, +60hr: ${x.proj60} kg${buyInfo}${x.wd ? `, MASA HENTI OBAT s/d ${x.wd.withdrawal_until}` : ''}${x.an.ready_for_sale ? ', siap jual' : ''}${notesInfo}`;
    })
    .join('\n');

  const feedLines = (db.feeds || [])
    .map((f) => {
      const days = f.daily_use_kg > 0 ? Math.floor(f.stock_kg / f.daily_use_kg) : '-';
      return `- ${f.name}: stok ${f.stock_kg} kg, pakai ${f.daily_use_kg} kg/hr (habis ±${days} hr), harga Rp${f.price}/kg, PK ${f.pk}%, TDN ${f.tdn}%`;
    })
    .join('\n');

  const rationLines = (db.rations || [])
    .slice(0, 8)
    .map((r) => {
      const kgMap: Record<string, number> = {};
      for (const it of r.items || []) {
        kgMap[it.feed_id] = (kgMap[it.feed_id] || 0) + (Number(it.kg) || 0);
      }
      const calc = calculateRationStats(db.feeds || [], kgMap);
      return `- Ransum "${r.name}": total ${calc.totalKg} kg, PK ${calc.pk}%, TDN ${calc.tdn}%, biaya ${formatRp(calc.totalCost)}/porsi`;
    })
    .join('\n');

  const healthLines = (db.health_events || [])
    .slice(-10)
    .reverse()
    .map((h) => {
      const an = (db.animals || []).find((a) => a.id === h.animal_id);
      return `- ${h.date} | ${an ? `${an.name} (${an.id})` : h.animal_id} | ${h.type}: ${h.treatment}${h.withdrawal_until ? ` (henti obat s/d ${h.withdrawal_until})` : ''}${h.notes ? ` — ${h.notes}` : ''}`;
    })
    .join('\n');

  const reproLines = (db.reproduction_events || [])
    .slice(-6)
    .reverse()
    .map((r) => {
      const an = (db.animals || []).find((a) => a.id === r.animal_id);
      return `- ${r.date} | ${an ? `${an.name} (${an.id})` : r.animal_id} | ${r.type} (${r.status})${r.due_date ? `, perkiraan lahir ${r.due_date}` : ''}`;
    })
    .join('\n');

  const schedLines = (db.schedules || [])
    .filter((s) => !s.done)
    .slice(0, 12)
    .map((s) => `- ${s.date} (${s.category}): ${s.title}${s.date < today ? ' [TERLEWAT]' : ''}`)
    .join('\n');

  const tasksToday = (db.tasks || []).filter((t) => t.date === today);
  const tasksDone = tasksToday.filter((t) => t.done).length;

  let financeBlock = 'Data keuangan & transaksi pemilik dibatasi karena pengguna login sebagai Pekerja Kandang.';
  let commerceBlock = '';

  if (isOwner) {
    const txs = db.transactions || [];
    const totalIn = txs.filter((t) => t.type === 'income').reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const totalOut = txs.filter((t) => t.type === 'expense').reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const feedToday = (db.feed_logs || [])
      .filter((l) => l.date === today)
      .reduce((s, x) => s + (Number(x.cost) || 0), 0);
    const totalBuyModal = sum.preds.reduce((s, x) => s + (Number(x.an.buy_price) || 0), 0);
    const recentTxLines = txs
      .slice(-10)
      .reverse()
      .map((t) => `  • ${t.date} [${t.type === 'income' ? 'Masuk' : 'Keluar'}] ${t.category}: ${formatRp(t.amount)} (${t.note || '-'})`)
      .join('\n');

    financeBlock = [
      `Pemasukan total: ${formatRp(totalIn)}, Pengeluaran total: ${formatRp(totalOut)}, Arus kas bersih: ${formatRp(totalIn - totalOut)}.`,
      `Estimasi modal pembelian ternak aktif: ${formatRp(totalBuyModal)}. Biaya pakan tercatat hari ini: ${formatRp(feedToday)} (anggaran ${formatRp(db.farm.daily_feed_budget || 500000)}/hr).`,
      recentTxLines ? `Transaksi terbaru:\n${recentTxLines}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const listingLines = (db.listings || [])
      .map((l) => {
        const an = (db.animals || []).find((a) => a.id === l.animal_id);
        return `- Lapak ${an ? `${an.name} (${an.id})` : l.animal_id}: harga tayang ${formatRp(l.price)} — ${l.description || '-'}`;
      })
      .join('\n');

    const ownOrders = (extras?.orders || []).filter(
      (o) => o.farmName.toLowerCase() === (db.farm.name || '').toLowerCase() || o.sellerId === 'seller_own_farm'
    );
    const orderLines = ownOrders
      .slice(0, 8)
      .map(
        (o) =>
          `- ${o.orderCode} (${o.createdAt}): ${o.animalName} (${o.animalId}), pembeli ${o.buyerName}, metode ${o.deliveryMethod === 'delivery' ? o.fleetName : 'Ambil Sendiri'}, total ${formatRp(o.totalAmount)}, status: ${o.status}`
      )
      .join('\n');

    const ownReviews = (extras?.reviews || []).filter((r) => r.sellerId === 'seller_own_farm');
    const avgRating =
      ownReviews.length > 0
        ? (ownReviews.reduce((s, r) => s + r.rating, 0) / ownReviews.length).toFixed(1)
        : '-';
    const reviewLines = ownReviews
      .slice(0, 5)
      .map((r) => `- ★${r.rating} oleh ${r.buyerName} (${r.date}): "${r.comment}"`)
      .join('\n');

    commerceBlock = [
      `Lapak Pasar TERMU aktif (${(db.listings || []).length}):\n${listingLines || '(belum ada ternak ditayangkan)'}`,
      `Pesanan masuk pembeli (${ownOrders.length}):\n${orderLines || '(belum ada pesanan tercatat)'}`,
      `Rating & ulasan toko kandang (rata-rata ${avgRating}/5 dari ${ownReviews.length} ulasan):\n${reviewLines || '(belum ada ulasan)'}`,
    ].join('\n\n');
  }

  return [
    `Tanggal hari ini: ${today}`,
    `Pemilik/Pengguna: ${extras?.ownerName || '-'} | Peran: ${role} | Paket Langganan: ${(extras?.subscriptionTier || 'free').toUpperCase()}`,
    `Peternakan: ${db.farm.name} (${db.farm.location || '-'}) | WA: ${db.farm.phone || '-'} | Komoditas: ${(db.farm.commodities || []).join(', ') || '-'} | Mode: ${mode.toUpperCase()}`,
    `Ringkasan populasi: ${sum.totalActive} ekor aktif di ${pens.length} sekat. Rata-rata bobot ${sum.groupLabel}: ${sum.avgNow} kg (prediksi +30hr: ${sum.avg30} kg, +60hr: ${sum.avg60} kg).`,
    `Tugas hari ini selesai: ${tasksDone}/${tasksToday.length}.`,
    `Kondisi sekat kandang:\n${penLines || '(belum ada sekat)'}`,
    `Keuangan Pemilik:\n${financeBlock}`,
    commerceBlock,
    `Daftar ternak aktif (${sum.preds.length} ekor):\n${animalLines || '(belum ada ternak)'}`,
    `Stok bahan pakan:\n${feedLines || '(belum ada bahan pakan)'}`,
    rationLines ? `Formula ransum tersimpan:\n${rationLines}` : '',
    healthLines ? `Riwayat kesehatan terbaru:\n${healthLines}` : '',
    reproLines ? `Catatan reproduksi terbaru:\n${reproLines}` : '',
    `Jadwal belum selesai:\n${schedLines || '(tidak ada jadwal tertunda)'}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function localOfflineFallbackAnswer(db: FarmDatabase, question: string, isOwner: boolean, today: string): string {
  const q = (question || '').toLowerCase();
  const sum = getFarmPredictionsSummary(db, today);

  if (sum.totalActive === 0) {
    return 'Saat ini belum ada data ternak di kandang Anda. Tambahkan minimal 1 ekor ternak dan riwayat bobotnya terlebih dahulu agar perhitungan prediksi pertumbuhan dan stok pakan aktif.';
  }

  const matched = sum.preds.find(
    (x) => q.includes(x.an.id.toLowerCase()) || (x.an.name.length >= 3 && q.includes(x.an.name.toLowerCase()))
  );
  if (matched) {
    const estValNow = Math.round(matched.latestW * (matched.an.species === 'Sapi' ? 62000 : 85000));
    const estVal30 = Math.round(matched.proj30 * (matched.an.species === 'Sapi' ? 62000 : 85000));
    return [
      `**Analisis & Prediksi ${matched.an.name} (${matched.an.id})**`,
      `• Jenis/Ras: ${matched.an.species} ${matched.an.breed} (${matched.an.sex}) — status: **${matched.an.status}**`,
      `• Bobot terakhir: **${matched.latestW} kg** (PBBH: **${matched.pbbh} kg/hari**)`,
      `• Prediksi bobot **30 hari**: **±${matched.proj30} kg** | **60 hari**: **±${matched.proj60} kg**`,
      matched.wd
        ? `• **Peringatan:** Masa henti obat (${matched.wd.treatment}) hingga **${formatDateID(matched.wd.withdrawal_until)}**.`
        : matched.daysToTarget === 0
          ? `• **Status Jual:** Sudah mencapai bobot target (${matched.targetW} kg+).`
          : `• Perkiraan mencapai ${matched.targetW} kg: **±${matched.daysToTarget || '-'} hari lagi**.`,
      isOwner
        ? `• Estimasi nilai pasar acuan: kini ${formatRp(estValNow)} → +30 hari sekitar ${formatRp(estVal30)}.`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (q.includes('pakan') || q.includes('stok') || q.includes('habis')) {
    if (!sum.lowFeeds.length) return 'Belum ada bahan pakan dengan pemakaian harian tercatat.';
    return [
      '**Prediksi Stok Pakan Kandang (Mode Offline)**',
      ...sum.lowFeeds.map(
        (f) =>
          `• **${f.name}**: tersisa ${f.stock_kg} kg (pakai ${f.daily_use_kg} kg/hr) → habis **±${Math.max(1, f.daysLeft)} hari lagi**`
      ),
    ].join('\n');
  }

  if (q.includes('sehat') || q.includes('sakit') || q.includes('vaksin') || q.includes('obat')) {
    const overdue = (db.schedules || []).filter((s) => !s.done && s.date < today);
    return [
      '**Pantauan Kesehatan & Perhatian Kandang (Mode Offline)**',
      sum.withdrawals.length
        ? `• **Masa henti obat (${sum.withdrawals.length}):** ${sum.withdrawals.map((x) => `${x.an.name} (${x.an.id}) s/d ${formatDateID(x.wd!.withdrawal_until)}`).join('; ')}.`
        : '• Tidak ada ternak dalam masa henti obat aktif.',
      overdue.length
        ? `• **Jadwal terlewat (${overdue.length}):** ${overdue.map((s) => `${s.title} (${formatShortDate(s.date)})`).join('; ')}.`
        : '• Tidak ada jadwal kesehatan yang terlewat.',
    ].join('\n');
  }

  const top3 = sum.readyCandidates.slice(0, 3);
  return [
    `**Ringkasan Prediksi ${db.farm.name} (Mode Offline)**`,
    `• Rata-rata bobot ${sum.groupLabel}: **${sum.avgNow} kg** → +30 hr **±${sum.avg30} kg** | +60 hr **±${sum.avg60} kg**.`,
    ...top3.map(
      (x, idx) => `${idx + 1}. **${x.an.name} (${x.an.id})** — ${x.latestW} kg (PBBH ${x.pbbh} kg/hr) → +30 hr **${x.proj30} kg**`
    ),
  ].join('\n');
}
