import type {
  Animal,
  FarmDatabase,
  FarmListing,
  FeedItem,
  FeedLog,
  HealthEvent,
  MarketplaceCatalogItem,
  Pen,
  RationFormula,
  ReproductionEvent,
  ScheduleItem,
  TaskItem,
  Transaction,
  WeightRecord,
} from '../types/termu';
import { daysAgoISO, daysFromNowISO, sha256, todayISO, uid } from '../utils/format';
import { createDefaultSubscription } from '../utils/subscription';

export function createEmptyLiveDB(): FarmDatabase {
  return {
    users: [],
    farm: {
      id: 'farm_live_1',
      name: 'Peternakan Saya',
      location: '',
      phone: '',
      commodities: ['Sapi Potong'],
      daily_feed_budget: 500000,
      onboarding_done: false,
    },
    pens: [],
    animals: [],
    weights: [],
    feeds: [],
    rations: [],
    feed_logs: [],
    health_events: [],
    reproduction_events: [],
    schedules: [],
    transactions: [],
    tasks: [],
    listings: [],
    subscription: createDefaultSubscription('free'),
  };
}

export async function createDemoDB(): Promise<FarmDatabase> {
  const passHash = await sha256('demo123');
  const farmId = 'farm_demo_1';
  const today = todayISO();

  const users = [
    {
      id: 'usr_demo_owner',
      name: 'Pak Sigit',
      contact: 'demo@termu.id',
      passwordHash: passHash,
      role: 'pemilik' as const,
      createdAt: daysAgoISO(120),
    },
    {
      id: 'usr_demo_worker',
      name: 'Naufal',
      contact: 'pekerja@termu.id',
      passwordHash: passHash,
      role: 'pekerja' as const,
      createdAt: daysAgoISO(90),
    },
  ];

  const pens: Pen[] = [
    { id: 'pen_a1', farm_id: farmId, code: 'A1', name: 'Sekat A1 • Penggemukan Utama', capacity: 10, cleanliness: 'Bersih', water_status: 'Cukup', notes: 'Sapi Limousin & Simental siap panen 1–2 bulan ke depan.' },
    { id: 'pen_a2', farm_id: farmId, code: 'A2', name: 'Sekat A2 • Bakalan Sapi', capacity: 10, cleanliness: 'Bersih', water_status: 'Cukup', notes: 'Sapi PO & Limousin cross fase awal penggemukan.' },
    { id: 'pen_a3', farm_id: farmId, code: 'A3', name: 'Sekat A3 • Sapi & Observasi', capacity: 10, cleanliness: 'Perlu Bersih', water_status: 'Cukup', notes: 'Pantau bobot SP-019 dan masa henti obat SP-022.' },
    { id: 'pen_a4', farm_id: farmId, code: 'A4', name: 'Sekat A4 • Kambing & Domba', capacity: 12, cleanliness: 'Bersih', water_status: 'Cukup', notes: 'Kandang panggung kering, sirkulasi udara baik.' },
  ];

  const cowSpecs: Array<[string, string, string, 'Jantan' | 'Betina', string, number, number, number, boolean]> = [
    ['SP-001', 'Bima', 'Limousin Cross', 'Jantan', 'pen_a1', 428, 514, 23500000, true],
    ['SP-002', 'Gagah', 'Simental', 'Jantan', 'pen_a1', 415, 498, 22800000, true],
    ['SP-003', 'Jaya', 'Limousin Cross', 'Jantan', 'pen_a1', 402, 486, 22000000, true],
    ['SP-004', 'Seno', 'PO (Peranakan Ongole)', 'Jantan', 'pen_a1', 378, 452, 19800000, false],
    ['SP-005', 'Kencana', 'Simental', 'Jantan', 'pen_a1', 392, 474, 21500000, true],
    ['SP-006', 'Bagus', 'Limousin Cross', 'Jantan', 'pen_a1', 385, 461, 21000000, false],
    ['SP-007', 'Panca', 'PO (Peranakan Ongole)', 'Jantan', 'pen_a1', 360, 434, 19200000, false],
    ['SP-008', 'Darma', 'Limousin Cross', 'Jantan', 'pen_a1', 370, 448, 20400000, false],
    ['SP-009', 'Tegar', 'Simental', 'Jantan', 'pen_a2', 320, 392, 17800000, false],
    ['SP-010', 'Wira', 'Limousin Cross', 'Jantan', 'pen_a2', 310, 384, 17500000, false],
    ['SP-011', 'Nugroho', 'PO (Peranakan Ongole)', 'Jantan', 'pen_a2', 298, 362, 16200000, false],
    ['SP-012', 'Rama', 'Limousin Cross', 'Jantan', 'pen_a2', 305, 376, 17100000, false],
    ['SP-013', 'Prabu', 'Simental', 'Jantan', 'pen_a2', 318, 395, 18000000, false],
    ['SP-014', 'Satria', 'PO (Peranakan Ongole)', 'Jantan', 'pen_a2', 290, 354, 15900000, false],
    ['SP-015', 'Arjuna', 'Limousin Cross', 'Jantan', 'pen_a2', 312, 382, 17200000, false],
    ['SP-016', 'Murni', 'PO (Peranakan Ongole)', 'Betina', 'pen_a2', 285, 344, 15400000, false],
    ['SP-017', 'Laras', 'Simental', 'Betina', 'pen_a3', 315, 378, 17600000, false],
    ['SP-018', 'Raden', 'Limousin Cross', 'Jantan', 'pen_a3', 330, 404, 18400000, false],
    ['SP-019', 'Cakra', 'PO (Peranakan Ongole)', 'Jantan', 'pen_a3', 308, 336, 16500000, false],
    ['SP-020', 'Baskara', 'Limousin Cross', 'Jantan', 'pen_a3', 325, 396, 18100000, false],
    ['SP-021', 'Surya', 'Simental', 'Jantan', 'pen_a3', 338, 408, 18800000, false],
    ['SP-022', 'Banyu', 'Limousin Cross', 'Jantan', 'pen_a3', 342, 412, 18900000, false],
    ['SP-023', 'Mega', 'PO (Peranakan Ongole)', 'Betina', 'pen_a3', 282, 340, 15200000, false],
    ['SP-024', 'Tirta', 'Simental', 'Jantan', 'pen_a3', 316, 386, 17700000, false],
  ];

  const goatSpecs: Array<[string, string, 'Kambing' | 'Domba', string, 'Jantan' | 'Betina', number, number, number, boolean]> = [
    ['KB-001', 'Kliwon', 'Kambing', 'Jawa Randu', 'Jantan', 27, 41, 2400000, true],
    ['KB-002', 'Pon', 'Kambing', 'Etawa Cross', 'Jantan', 25, 37, 2250000, false],
    ['KB-003', 'Legi', 'Kambing', 'Jawa Randu', 'Betina', 22, 31, 1850000, false],
    ['KB-004', 'Pahing', 'Domba', 'Domba Texel', 'Jantan', 26, 39, 2350000, false],
    ['KB-005', 'Wage', 'Domba', 'Domba Garut', 'Jantan', 24, 36, 2200000, false],
    ['KB-006', 'Sari', 'Kambing', 'Jawa Randu', 'Betina', 21, 30, 1750000, false],
    ['KB-007', 'Guntur', 'Domba', 'Domba Texel', 'Jantan', 23, 35, 2100000, false],
    ['KB-008', 'Mekar', 'Domba', 'Domba Lokal', 'Betina', 20, 29, 1650000, false],
  ];

  const animals: Animal[] = [];
  const weights: WeightRecord[] = [];

  cowSpecs.forEach(([id, name, breed, sex, pen_id, entryW, currW, buyPrice, ready], idx) => {
    const isPerhatian = id === 'SP-019' || id === 'SP-021' || id === 'SP-022';
    const noteMap: Record<string, string> = {
      'SP-019': 'Nafsu makan sedikit turun 2 minggu terakhir, cek obat cacing dan kualitas konsentrat.',
      'SP-021': 'Jadwal vaksin PMK booster sudah melewati tanggal rencana.',
      'SP-022': 'Baru diberi antibiotik ringan karena luka kuku; tunggu masa henti obat selesai.',
    };
    animals.push({
      id,
      farm_id: farmId,
      name,
      species: 'Sapi',
      breed,
      sex,
      birth: daysAgoISO(540 + idx * 14),
      origin: idx % 2 === 0 ? 'Pasar Hewan Ambarawa' : 'Peternak Mitra Demak',
      entry_weight: entryW,
      entry_date: daysAgoISO(84),
      pen_id,
      status: isPerhatian ? 'perhatian' : 'sehat',
      buy_price: buyPrice,
      ready_for_sale: ready,
      photo: '',
      notes: noteMap[id] || 'Pertumbuhan stabil, pakan lahap.',
    });

    const steps = [70, 56, 42, 28, 14, 0];
    steps.forEach((ago, sIdx) => {
      let kg: number;
      if (id === 'SP-019') {
        const slowSeries = [312, 322, 330, 333, 334.5, 336];
        kg = slowSeries[sIdx];
      } else {
        const ratio = sIdx / (steps.length - 1);
        kg = +(entryW + (currW - entryW) * ratio).toFixed(1);
      }
      weights.push({
        id: uid('wt'),
        animal_id: id,
        date: daysAgoISO(ago),
        kg,
        method: sIdx === steps.length - 1 ? 'Timbangan Digital' : 'Timbangan Kandang',
      });
    });
  });

  goatSpecs.forEach(([id, name, species, breed, sex, entryW, currW, buyPrice, ready], idx) => {
    animals.push({
      id,
      farm_id: farmId,
      name,
      species,
      breed,
      sex,
      birth: daysAgoISO(330 + idx * 18),
      origin: 'Peternak Kendal',
      entry_weight: entryW,
      entry_date: daysAgoISO(70),
      pen_id: 'pen_a4',
      status: 'sehat',
      buy_price: buyPrice,
      ready_for_sale: ready,
      photo: '',
      notes: 'Kondisi lincah, bulu bersih.',
    });
    [56, 28, 14, 0].forEach((ago, sIdx) => {
      const kg = +(entryW + (currW - entryW) * (sIdx / 3)).toFixed(1);
      weights.push({
        id: uid('wt'),
        animal_id: id,
        date: daysAgoISO(ago),
        kg,
        method: 'Timbangan Gantung',
      });
    });
  });

  const feeds: FeedItem[] = [
    { id: 'fd_rumput', farm_id: farmId, name: 'Rumput Gajah / Odot', price: 450, pk: 9.2, tdn: 54, stock_kg: 1800, daily_use_kg: 320, unit: 'kg' },
    { id: 'fd_jerami', farm_id: farmId, name: 'Jerami Padi Fermentasi', price: 750, pk: 6.5, tdn: 48, stock_kg: 950, daily_use_kg: 110, unit: 'kg' },
    { id: 'fd_kons', farm_id: farmId, name: 'Konsentrat Penggemukan 16%', price: 4400, pk: 16.0, tdn: 72, stock_kg: 260, daily_use_kg: 78, unit: 'kg' },
    { id: 'fd_dedak', farm_id: farmId, name: 'Dedak Padi Halus', price: 2900, pk: 11.5, tdn: 66, stock_kg: 340, daily_use_kg: 48, unit: 'kg' },
    { id: 'fd_ampas', farm_id: farmId, name: 'Ampas Tahu Segar', price: 850, pk: 21.0, tdn: 76, stock_kg: 420, daily_use_kg: 65, unit: 'kg' },
  ];

  const rations: RationFormula[] = [
    {
      id: 'rat_a',
      name: 'Formula A • Penggemukan Cepat',
      items: [
        { feed_id: 'fd_rumput', kg: 12 },
        { feed_id: 'fd_kons', kg: 3.5 },
        { feed_id: 'fd_dedak', kg: 1.5 },
        { feed_id: 'fd_ampas', kg: 3 },
      ],
    },
    {
      id: 'rat_b',
      name: 'Formula B • Hemat Harian',
      items: [
        { feed_id: 'fd_rumput', kg: 10 },
        { feed_id: 'fd_jerami', kg: 4 },
        { feed_id: 'fd_kons', kg: 2.2 },
        { feed_id: 'fd_dedak', kg: 2 },
        { feed_id: 'fd_ampas', kg: 2.5 },
      ],
    },
  ];

  const feed_logs: FeedLog[] = [
    { id: 'fl_1', date: today, pen_id: 'pen_a1', ration_name: 'Formula A • Penggemukan Cepat (Pagi)', total_kg: 160, cost: 221600, recorded_by: 'Naufal' },
    { id: 'fl_2', date: today, pen_id: 'pen_a2', ration_name: 'Formula B • Hemat Harian (Pagi)', total_kg: 155, cost: 186400, recorded_by: 'Naufal' },
    { id: 'fl_3', date: today, pen_id: 'pen_a3', ration_name: 'Formula B • Hemat Harian (Pagi)', total_kg: 148, cost: 178200, recorded_by: 'Naufal' },
    { id: 'fl_4', date: today, pen_id: 'pen_a4', ration_name: 'Hijauan + Konsentrat Kambing', total_kg: 44, cost: 68500, recorded_by: 'Naufal' },
    { id: 'fl_5', date: daysAgoISO(1), pen_id: 'pen_a1', ration_name: 'Formula A • Penggemukan Cepat', total_kg: 320, cost: 443200, recorded_by: 'Naufal' },
  ];

  const health_events: HealthEvent[] = [
    { id: 'he_1', animal_id: 'SP-001', type: 'Vaksin', date: daysAgoISO(45), treatment: 'Vaksin PMK Booster', notes: 'Kondisi sehat, tanpa demam.', withdrawal_until: '' },
    { id: 'he_2', animal_id: 'SP-002', type: 'Obat Cacing', date: daysAgoISO(30), treatment: 'Albendazole Oral', notes: 'Pemberian rutin 3 bulanan.', withdrawal_until: '' },
    { id: 'he_3', animal_id: 'SP-022', type: 'Pengobatan', date: daysAgoISO(3), treatment: 'Antibiotik Oxytetracycline (luka kuku)', notes: 'Kuku dibersihkan, luka mulai mengering.', withdrawal_until: daysFromNowISO(11) },
    { id: 'he_4', animal_id: 'SP-019', type: 'Vitamin', date: daysAgoISO(10), treatment: 'Vitamin B-Kompleks Injeksi', notes: 'Pemulihan nafsu makan.', withdrawal_until: '' },
  ];

  const reproduction_events: ReproductionEvent[] = [
    { id: 'rep_1', animal_id: 'SP-016', type: 'IB (Inseminasi Buatan)', date: daysAgoISO(95), status: 'Bunting Terkonfirmasi', due_date: daysFromNowISO(188), notes: 'Straw Limousin, cek PKB positif.' },
    { id: 'rep_2', animal_id: 'KB-003', type: 'Kawin Alami', date: daysAgoISO(50), status: 'Menunggu Cek Kebuntingan', due_date: daysFromNowISO(100), notes: 'Pejantan Jawa Randu unggul.' },
  ];

  const schedules: ScheduleItem[] = [
    { id: 'sch_1', title: 'Vaksin PMK Booster SP-021', category: 'Vaksin', date: daysAgoISO(2), time: '08:30', animal_id: 'SP-021', pen_id: 'pen_a3', done: false, notes: 'Terlewat dari jadwal semula, koordinasi petugas.' },
    { id: 'sch_2', title: 'Cek Kebuntingan (PKB) SP-017', category: 'Reproduksi', date: today, time: '09:30', animal_id: 'SP-017', pen_id: 'pen_a3', done: false, notes: 'Bersama mantri hewan setempat.' },
    { id: 'sch_3', title: 'Obat Cacing Massal Sekat A2', category: 'Obat Cacing', date: daysFromNowISO(1), time: '07:30', animal_id: '', pen_id: 'pen_a2', done: false, notes: 'Diberikan sebelum pakan pagi.' },
    { id: 'sch_4', title: 'Ganti Transisi Pakan Sekat A1', category: 'Pakan', date: daysFromNowISO(2), time: '15:00', animal_id: '', pen_id: 'pen_a1', done: false, notes: 'Naikkan konsentrat bertahap untuk finishing.' },
    { id: 'sch_5', title: 'Timbang Rutin 2 Mingguan Sekat A4', category: 'Timbang', date: daysFromNowISO(3), time: '08:00', animal_id: '', pen_id: 'pen_a4', done: false, notes: 'Pantau bobot kambing menjelang jual.' },
    { id: 'sch_6', title: 'Evaluasi Kuku & Masa Henti SP-022', category: 'Kesehatan', date: daysFromNowISO(4), time: '10:00', animal_id: 'SP-022', pen_id: 'pen_a3', done: false, notes: 'Pastikan luka kuku pulih total.' },
  ];

  const transactions: Transaction[] = [
    { id: 'tx_1', date: daysAgoISO(78), type: 'expense', category: 'Pembelian Ternak', amount: 88500000, note: 'Pembelian 5 ekor bakalan sapi Limousin & Simental' },
    { id: 'tx_2', date: daysAgoISO(62), type: 'expense', category: 'Pakan', amount: 18400000, note: 'Belanja konsentrat, dedak & hijauan bulan 1' },
    { id: 'tx_3', date: daysAgoISO(50), type: 'income', category: 'Penjualan', amount: 61500000, note: 'Penjualan 2 ekor sapi siap potong (total 990 kg)' },
    { id: 'tx_4', date: daysAgoISO(35), type: 'expense', category: 'Pakan', amount: 19200000, note: 'Belanja pakan rutin bulan 2' },
    { id: 'tx_5', date: daysAgoISO(31), type: 'expense', category: 'Tenaga Kerja', amount: 3800000, note: 'Gaji pekerja kandang & bantu angkut pakan' },
    { id: 'tx_6', date: daysAgoISO(24), type: 'income', category: 'Penjualan', amount: 34800000, note: 'Penjualan 1 ekor sapi Limousin 545 kg + 2 kambing' },
    { id: 'tx_7', date: daysAgoISO(12), type: 'expense', category: 'Obat & Kesehatan', amount: 1650000, note: 'Vaksin PMK, obat cacing & vitamin' },
    { id: 'tx_8', date: daysAgoISO(6), type: 'expense', category: 'Pakan', amount: 14600000, note: 'Stok konsentrat 2 ton & dedak 1 ton' },
    { id: 'tx_9', date: daysAgoISO(3), type: 'income', category: 'Penjualan', amount: 31200000, note: 'Penjualan 1 ekor Simental 510 kg ke pembeli Semarang' },
    { id: 'tx_10', date: daysAgoISO(2), type: 'expense', category: 'Listrik & Air', amount: 720000, note: 'Pompa air kandang & chopper rumput' },
  ];

  const tasks: TaskItem[] = [
    { id: 'tsk_1', date: today, pen_id: 'pen_a1', item: 'Pakan pagi Sekat A1', done: true, done_by: 'Naufal', done_at: '06:35' },
    { id: 'tsk_2', date: today, pen_id: 'pen_a1', item: 'Bersihkan kandang Sekat A1', done: true, done_by: 'Naufal', done_at: '07:10' },
    { id: 'tsk_3', date: today, pen_id: 'pen_a2', item: 'Pakan pagi Sekat A2', done: true, done_by: 'Naufal', done_at: '06:50' },
    { id: 'tsk_4', date: today, pen_id: 'pen_a2', item: 'Cek air minum Sekat A2', done: true, done_by: 'Naufal', done_at: '07:25' },
    { id: 'tsk_5', date: today, pen_id: 'pen_a3', item: 'Cek luka kuku SP-022 (Sekat A3)', done: true, done_by: 'Pak Sigit', done_at: '08:05' },
    { id: 'tsk_6', date: today, pen_id: 'pen_a3', item: 'Bersihkan kandang Sekat A3', done: false, done_by: '', done_at: '' },
    { id: 'tsk_7', date: today, pen_id: 'pen_a4', item: 'Pakan pagi Sekat A4', done: true, done_by: 'Naufal', done_at: '07:40' },
    { id: 'tsk_8', date: today, pen_id: 'pen_a1', item: 'Pakan sore Sekat A1', done: false, done_by: '', done_at: '' },
    { id: 'tsk_9', date: today, pen_id: 'pen_a2', item: 'Pakan sore Sekat A2', done: false, done_by: '', done_at: '' },
    { id: 'tsk_10', date: today, pen_id: 'pen_a4', item: 'Cek air minum & pakan sore Sekat A4', done: false, done_by: '', done_at: '' },
  ];

  const listings: FarmListing[] = [
    { id: 'lst_1', farm_id: farmId, animal_id: 'SP-001', price: 32500000, location: 'Semarang Utara, Jawa Tengah', description: 'Limousin Cross bobot 514 kg, bebas masa henti obat, vaksin lengkap (data contoh).', created_at: daysAgoISO(4), is_demo: true },
    { id: 'lst_2', farm_id: farmId, animal_id: 'SP-002', price: 31200000, location: 'Semarang Utara, Jawa Tengah', description: 'Simental jantan 498 kg, postur panjang & padat, cocok untuk potong atau kurban (data contoh).', created_at: daysAgoISO(3), is_demo: true },
    { id: 'lst_3', farm_id: farmId, animal_id: 'SP-003', price: 30400000, location: 'Semarang Utara, Jawa Tengah', description: 'Limousin Cross 486 kg, pertumbuhan stabil 0,96 kg/hari (data contoh).', created_at: daysAgoISO(2), is_demo: true },
    { id: 'lst_4', farm_id: farmId, animal_id: 'SP-005', price: 29500000, location: 'Semarang Utara, Jawa Tengah', description: 'Simental jantan 474 kg, sehat dan nafsu makan sangat baik (data contoh).', created_at: daysAgoISO(1), is_demo: true },
    { id: 'lst_5', farm_id: farmId, animal_id: 'KB-001', price: 3650000, location: 'Semarang Utara, Jawa Tengah', description: 'Kambing Jawa Randu jantan 41 kg, terawat di kandang panggung bersih (data contoh).', created_at: daysAgoISO(1), is_demo: true },
  ];

  return {
    users,
    farm: {
      id: farmId,
      name: 'Kandang Sumber Rejeki',
      location: 'Semarang Utara, Jawa Tengah',
      phone: '081234567890',
      commodities: ['Sapi Potong', 'Kambing/Domba'],
      daily_feed_budget: 900000,
      onboarding_done: true,
    },
    pens,
    animals,
    weights,
    feeds,
    rations,
    feed_logs,
    health_events,
    reproduction_events,
    schedules,
    transactions,
    tasks,
    listings,
    subscription: createDefaultSubscription('free'),
  };
}

export function getPartnerDemoListings(): MarketplaceCatalogItem[] {
  const raw = [
    {
      id: 'mp_boyolali_1',
      sellerId: 'seller_merapi',
      animal_id: 'BYL-104',
      name: 'Mahesa',
      species: 'Sapi' as const,
      breed: 'Limousin Cross',
      sex: 'Jantan' as const,
      weight: 538,
      pbbh: 1.05,
      ageLabel: '2 th 1 bln',
      price: 33900000,
      farmName: 'Kandang Merapi Jaya',
      city: 'Boyolali',
      location: 'Ampel, Boyolali, Jawa Tengah',
      phone: '081229001122',
      vaccineCount: 3,
      withdrawalFree: true,
      verifiedRecords: 10,
      created_at: daysAgoISO(1),
      description: 'Sapi Limousin Cross perawatan intensif rumput odot & konsentrat 16%. Bobot terukur rutin tiap 2 minggu (data contoh).',
    },
    {
      id: 'mp_kendal_1',
      sellerId: 'seller_kaliwungu',
      animal_id: 'KDL-028',
      name: 'Prasetyo',
      species: 'Sapi' as const,
      breed: 'Simental',
      sex: 'Jantan' as const,
      weight: 492,
      pbbh: 0.94,
      ageLabel: '1 th 10 bln',
      price: 30200000,
      farmName: 'Berkah Ternak Kaliwungu',
      city: 'Kendal',
      location: 'Kaliwungu, Kendal, Jawa Tengah',
      phone: '081325440099',
      vaccineCount: 2,
      withdrawalFree: true,
      verifiedRecords: 8,
      created_at: daysAgoISO(2),
      description: 'Simental postur panjang, kuku kuat, sudah vaksin PMK booster dan obat cacing rutin (data contoh).',
    },
    {
      id: 'mp_demak_1',
      sellerId: 'seller_tani_demak',
      animal_id: 'DMK-055',
      name: 'Surya PO',
      species: 'Sapi' as const,
      breed: 'PO (Peranakan Ongole)',
      sex: 'Jantan' as const,
      weight: 446,
      pbbh: 0.86,
      ageLabel: '2 th',
      price: 26800000,
      farmName: 'Tani Makmur Demak',
      city: 'Demak',
      location: 'Mranggen, Demak, Jawa Tengah',
      phone: '085640112233',
      vaccineCount: 2,
      withdrawalFree: true,
      verifiedRecords: 7,
      created_at: daysAgoISO(3),
      description: 'Sapi PO murni tangguh, adaptif pakan hijauan lokal, cocok untuk potong maupun kurban (data contoh).',
    },
    {
      id: 'mp_boyolali_2',
      sellerId: 'seller_merbabu',
      animal_id: 'BYL-209',
      name: 'Sakti Etawa',
      species: 'Kambing' as const,
      breed: 'Etawa Cross',
      sex: 'Jantan' as const,
      weight: 46,
      pbbh: 0.13,
      ageLabel: '1 th 3 bln',
      price: 4150000,
      farmName: 'Kandang Lereng Merbabu',
      city: 'Boyolali',
      location: 'Selo, Boyolali, Jawa Tengah',
      phone: '081229004455',
      vaccineCount: 2,
      withdrawalFree: true,
      verifiedRecords: 6,
      created_at: daysAgoISO(2),
      description: 'Kambing Etawa Cross jantan sehat, kandang panggung bersih, pertumbuhan terpantau stabil (data contoh).',
    },
    {
      id: 'mp_kendal_2',
      sellerId: 'seller_boja',
      animal_id: 'KDL-071',
      name: 'Bintang Texel',
      species: 'Domba' as const,
      breed: 'Texel',
      sex: 'Jantan' as const,
      weight: 42,
      pbbh: 0.12,
      ageLabel: '1 th 1 bln',
      price: 3850000,
      farmName: 'Domba Unggul Boja',
      city: 'Kendal',
      location: 'Boja, Kendal, Jawa Tengah',
      phone: '081390887766',
      vaccineCount: 2,
      withdrawalFree: true,
      verifiedRecords: 6,
      created_at: daysAgoISO(1),
      description: 'Domba Texel berdaging padat, pakan silase & konsentrat terukur, siap antar area Jateng (data contoh).',
    },
    {
      id: 'mp_demak_2',
      sellerId: 'seller_barokah_demak',
      animal_id: 'DMK-088',
      name: 'Raja Garut',
      species: 'Domba' as const,
      breed: 'Garut',
      sex: 'Jantan' as const,
      weight: 39,
      pbbh: 0.11,
      ageLabel: '1 th 2 bln',
      price: 3600000,
      farmName: 'Sumber Barokah Demak',
      city: 'Demak',
      location: 'Karangawen, Demak, Jawa Tengah',
      phone: '085727665544',
      vaccineCount: 1,
      withdrawalFree: true,
      verifiedRecords: 5,
      created_at: daysAgoISO(4),
      description: 'Domba Garut sehat lincah, bebas parasit, cocok untuk aqiqah atau pembibitan (data contoh).',
    },
  ];

  return raw.map((p) => ({
    ...p,
    photo: '',
    pricePerKg: p.weight > 0 ? Math.round(p.price / p.weight) : 0,
    is_own_farm: false,
    is_partner: true,
    is_demo: true,
  }));
}
