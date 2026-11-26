import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SHIPPING_SERVICE_FEE,
  calculateBestSellSchedule,
  calculateCheckoutTotals,
  calculateHPP,
  calculateRationStats,
  calculateSchoorl,
  getDecisionSuggestions,
  validateCheckoutForm,
} from './calculations';
import type { FarmDatabase, FeedItem } from '../types/termu';

test('Checkout self-pickup has Rp 0 shipping and Rp 0 service fee', () => {
  const res = calculateCheckoutTotals({
    itemPrice: 32500000,
    species: 'Sapi',
    deliveryMethod: 'pickup',
    fleetId: 'pickup_ternak',
    regionId: 'semarang_kota',
  });
  assert.equal(res.shippingFee, 0);
  assert.equal(res.serviceFee, 0);
  assert.equal(res.totalAmount, 32500000);
});

test('Checkout animal delivery adds regional fleet tariff plus Rp 10.000 service fee', () => {
  const res = calculateCheckoutTotals({
    itemPrice: 32500000,
    species: 'Sapi',
    deliveryMethod: 'delivery',
    fleetId: 'truk_sapi',
    regionId: 'salatiga_boyolali',
  });
  // baseCowFee 450,000 * 1.35 = 607,500 -> rounded to nearest 5,000 = 610,000
  assert.equal(res.shippingFee, 610000);
  assert.equal(res.serviceFee, SHIPPING_SERVICE_FEE);
  assert.equal(res.serviceFee, 10000);
  assert.equal(res.totalAmount, 32500000 + 610000 + 10000);
});

test('Checkout delivery for Kambing uses small livestock base tariff', () => {
  const res = calculateCheckoutTotals({
    itemPrice: 3650000,
    species: 'Kambing',
    deliveryMethod: 'delivery',
    fleetId: 'pickup_ternak',
    regionId: 'semarang_kota',
  });
  assert.equal(res.shippingFee, 100000);
  assert.equal(res.serviceFee, 10000);
  assert.equal(res.totalAmount, 3760000);
});

test('Checkout form validation enforces required fields honestly', () => {
  const pickupErrors = validateCheckoutForm({
    buyerName: '',
    buyerPhone: '0812',
    deliveryMethod: 'pickup',
    fleetId: '',
    regionId: '',
    address: '',
    preferredDate: '2026-11-26',
    notes: '',
  });
  assert.ok(pickupErrors.buyerName);
  assert.ok(pickupErrors.buyerPhone);
  assert.equal(pickupErrors.address, undefined);

  const deliveryErrors = validateCheckoutForm({
    buyerName: 'Pak Hendra',
    buyerPhone: '081234567890',
    deliveryMethod: 'delivery',
    fleetId: 'pickup_ternak',
    regionId: 'semarang_kota',
    address: 'Jl. A',
    preferredDate: '2026-11-26',
    notes: '',
  });
  assert.equal(deliveryErrors.buyerName, undefined);
  assert.equal(deliveryErrors.buyerPhone, undefined);
  assert.ok(deliveryErrors.address);
});

test('Schoorl weight and HPP calculations match Indonesian livestock formulas', () => {
  const cow = calculateSchoorl('Sapi', 178, 50);
  assert.equal(cow.estWeight, 400);
  assert.equal(cow.estCarcass, 200);

  const goat = calculateSchoorl('Kambing', 72, 48);
  assert.equal(goat.estWeight, 81);

  const hpp = calculateHPP({
    estWeight: 400,
    buyPrice: 18000000,
    feedCost: 4000000,
    medCost: 300000,
    laborCost: 700000,
    marketPricePerKg: 62000,
  });
  assert.equal(hpp.totalHPP, 23000000);
  assert.equal(hpp.hppPerKg, 57500);
  assert.equal(hpp.marketVal, 24800000);
  assert.equal(hpp.estProfit, 1800000);
});

test('Ration mixer calculates weighted PK, TDN, and daily cost accurately', () => {
  const feeds: FeedItem[] = [
    { id: 'f1', farm_id: 'fm', name: 'Rumput', price: 500, pk: 10, tdn: 50, stock_kg: 1000, daily_use_kg: 100, unit: 'kg' },
    { id: 'f2', farm_id: 'fm', name: 'Konsentrat', price: 4500, pk: 16, tdn: 70, stock_kg: 200, daily_use_kg: 50, unit: 'kg' },
  ];
  const stats = calculateRationStats(feeds, { f1: 10, f2: 5 });
  assert.equal(stats.totalKg, 15);
  assert.equal(stats.totalCost, 27500);
  assert.equal(stats.pk, 12);
  assert.equal(stats.tdn, 56.7);
});

test('Decision engine flags active withdrawal, low feed stock, and overdue schedules', () => {
  const db: FarmDatabase = {
    users: [],
    farm: { id: 'f1', name: 'Test Farm', location: 'Semarang', phone: '', commodities: ['Sapi Potong'], daily_feed_budget: 500000, onboarding_done: true },
    pens: [],
    animals: [
      {
        id: 'SP-001', farm_id: 'f1', name: 'Bima', species: 'Sapi', breed: 'Limousin', sex: 'Jantan',
        birth: '2024-01-01', origin: 'Test', entry_weight: 400, entry_date: '2026-08-01',
        pen_id: '', status: 'sehat', buy_price: 20000000, ready_for_sale: false, photo: '', notes: '',
      },
    ],
    weights: [{ id: 'w1', animal_id: 'SP-001', date: '2026-11-20', kg: 500, method: 'Timbangan' }],
    feeds: [
      { id: 'fd1', farm_id: 'f1', name: 'Konsentrat', price: 4400, pk: 16, tdn: 72, stock_kg: 150, daily_use_kg: 50, unit: 'kg' },
    ],
    rations: [],
    feed_logs: [],
    health_events: [
      { id: 'he1', animal_id: 'SP-001', type: 'Pengobatan', date: '2026-11-22', treatment: 'Antibiotik', notes: '', withdrawal_until: '2026-11-30' },
    ],
    reproduction_events: [],
    schedules: [
      { id: 'sc1', title: 'Vaksin PMK', category: 'Vaksin', date: '2026-11-20', time: '08:00', animal_id: 'SP-001', pen_id: '', done: false, notes: '' },
    ],
    transactions: [],
    tasks: [],
    listings: [],
  };

  const suggestions = getDecisionSuggestions(db, '2026-11-24');
  assert.ok(suggestions.some((s) => s.id === 'wd_SP-001' && s.level === 'danger'));
  assert.ok(suggestions.some((s) => s.id === 'sch_sc1' && s.level === 'warning'));
  assert.ok(suggestions.some((s) => s.id === 'fd_fd1' && s.level === 'warning'));
  // Optimal sale should NOT trigger while withdrawal is active
  assert.ok(!suggestions.some((s) => s.id === 'opt_SP-001'));
});

test('Best sell schedule computes 4 horizon milestones', () => {
  const rows = calculateBestSellSchedule({
    species: 'Sapi',
    baseWeight: 480,
    pbbh: 0.9,
    buyPrice: 22000000,
    marketPricePerKg: 62000,
    dailyFeedCost: 26000,
  });
  assert.equal(rows.length, 4);
  assert.equal(rows[0].days, 0);
  assert.equal(rows[3].days, 90);
  assert.ok(rows[1].estW > rows[0].estW);
});
