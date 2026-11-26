import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUBSCRIPTION_PLANS,
  canAddWorker,
  canCreatePen,
  canPrintPassportQR,
  canRegisterAnimals,
  canUseAI,
  canUseAIIntelligence,
  createDefaultSubscription,
  getAllowedAIIntelligenceLevels,
  getDefaultAIIntelligence,
  normalizeSubscription,
  shouldShowAds,
  validatePenCapacity,
} from './subscription';
import { createEmptyLiveDB } from '../data/seed';
import type { Animal, Pen } from '../types/termu';

test('Subscription tiers match requested names, discounted prices, and original prices', () => {
  assert.equal(SUBSCRIPTION_PLANS.free.priceMonthly, 0);
  assert.equal(SUBSCRIPTION_PLANS.plus.name, 'Plus');
  assert.equal(SUBSCRIPTION_PLANS.plus.priceMonthly, 49999);
  assert.ok(SUBSCRIPTION_PLANS.plus.originalPriceMonthly > SUBSCRIPTION_PLANS.plus.priceMonthly);

  assert.equal(SUBSCRIPTION_PLANS.pro.name, 'Pro');
  assert.equal(SUBSCRIPTION_PLANS.pro.priceMonthly, 99999);
  assert.ok(SUBSCRIPTION_PLANS.pro.originalPriceMonthly > SUBSCRIPTION_PLANS.pro.priceMonthly);

  assert.equal(SUBSCRIPTION_PLANS.enterprise.name, 'Enterprise');
  assert.equal(SUBSCRIPTION_PLANS.enterprise.priceMonthly, 149999);
  assert.ok(SUBSCRIPTION_PLANS.enterprise.originalPriceMonthly > SUBSCRIPTION_PLANS.enterprise.priceMonthly);
});

test('Only Free tier displays ads; Plus, Pro, and Enterprise are ad-free', () => {
  assert.equal(shouldShowAds('free'), true);
  assert.equal(shouldShowAds('plus'), false);
  assert.equal(shouldShowAds('pro'), false);
  assert.equal(shouldShowAds('enterprise'), false);
});

test('AI access is blocked on Free tier and scales across Plus (30), Pro (150), Enterprise (500)', () => {
  const freeCheck = canUseAI(createDefaultSubscription('free', '2026-11-25'), '2026-11-25');
  assert.equal(freeCheck.allowed, false);
  assert.equal(freeCheck.limit, 0);

  const plusSub = { ...createDefaultSubscription('plus', '2026-11-25'), aiUsed: 29 };
  assert.equal(canUseAI(plusSub, '2026-11-25').allowed, true);
  assert.equal(canUseAI({ ...plusSub, aiUsed: 30 }, '2026-11-25').allowed, false);

  const proSub = { ...createDefaultSubscription('pro', '2026-11-25'), aiUsed: 149 };
  assert.equal(canUseAI(proSub, '2026-11-25').allowed, true);
  assert.equal(canUseAI({ ...proSub, aiUsed: 150 }, '2026-11-25').allowed, false);

  const entSub = { ...createDefaultSubscription('enterprise', '2026-11-25'), aiUsed: 499 };
  assert.equal(canUseAI(entSub, '2026-11-25').allowed, true);
  assert.equal(canUseAI({ ...entSub, aiUsed: 500 }, '2026-11-25').allowed, false);
});

test('Pro tier grants much higher QR passport print quota than Free & Plus, Enterprise is unlimited', () => {
  assert.equal(SUBSCRIPTION_PLANS.free.qrPrintMonthlyQuota, 3);
  assert.equal(SUBSCRIPTION_PLANS.plus.qrPrintMonthlyQuota, 15);
  assert.equal(SUBSCRIPTION_PLANS.pro.qrPrintMonthlyQuota, 75);
  assert.equal(SUBSCRIPTION_PLANS.enterprise.qrPrintMonthlyQuota, null);

  const freeAtLimit = { ...createDefaultSubscription('free', '2026-11-25'), qrPrintUsed: 3 };
  assert.equal(canPrintPassportQR(freeAtLimit, '2026-11-25').allowed, false);

  const proMid = { ...createDefaultSubscription('pro', '2026-11-25'), qrPrintUsed: 50 };
  const proRes = canPrintPassportQR(proMid, '2026-11-25');
  assert.equal(proRes.allowed, true);
  assert.equal(proRes.remaining, 25);

  const entHigh = { ...createDefaultSubscription('enterprise', '2026-11-25'), qrPrintUsed: 999 };
  assert.equal(canPrintPassportQR(entHigh, '2026-11-25').allowed, true);
});

test('Pen count limit and per-pen capacity limit enforce tier boundaries accurately', () => {
  assert.equal(canCreatePen({ currentPenCount: 1, requestedCapacity: 5, tier: 'free' }).allowed, true);
  assert.equal(canCreatePen({ currentPenCount: 2, requestedCapacity: 5, tier: 'free' }).allowed, false);
  assert.equal(validatePenCapacity(6, 'free').allowed, false);
  assert.equal(validatePenCapacity(15, 'plus').allowed, true);
  assert.equal(validatePenCapacity(16, 'plus').allowed, false);
  assert.equal(validatePenCapacity(30, 'pro').allowed, true);
  assert.equal(validatePenCapacity(200, 'enterprise').allowed, true);
});

test('Animal registration enforces both total animal limit and single-pen limit', () => {
  const db = createEmptyLiveDB();
  const pen1: Pen = {
    id: 'p1',
    farm_id: db.farm.id,
    code: 'A1',
    name: 'Sekat A1',
    capacity: 10,
    cleanliness: 'Bersih',
    water_status: 'Cukup',
    notes: '',
  };
  const pen2: Pen = { ...pen1, id: 'p2', code: 'A2', name: 'Sekat A2' };
  db.pens = [pen1, pen2];

  const makeAnimal = (i: number, pen_id: string): Animal => ({
    id: `SP-${i}`,
    farm_id: db.farm.id,
    name: `Sapi ${i}`,
    species: 'Sapi',
    breed: 'PO',
    sex: 'Jantan',
    birth: '',
    origin: '',
    entry_weight: 300,
    entry_date: '2026-11-01',
    pen_id,
    status: 'sehat',
    buy_price: 15000000,
    ready_for_sale: false,
    photo: '',
    notes: '',
  });

  // Put 5 animals in p1 (max per pen for Free is 5)
  db.animals = [1, 2, 3, 4, 5].map((i) => makeAnimal(i, 'p1'));
  // Adding 6th to p1 should fail on Free due to per-pen cap
  const resPerPen = canRegisterAnimals({ db, tier: 'free', addCount: 1, targetPenId: 'p1' });
  assert.equal(resPerPen.allowed, false);
  // Adding to p2 should succeed on Free (total 6 <= 10, p2 has 1 <= 5)
  const resOtherPen = canRegisterAnimals({ db, tier: 'free', addCount: 1, targetPenId: 'p2' });
  assert.equal(resOtherPen.allowed, true);

  // Fill p2 with 5 more (total 10), 11th fails on Free, succeeds on Plus (with higher capacity)
  db.animals = [...db.animals, ...[6, 7, 8, 9, 10].map((i) => makeAnimal(i, 'p2'))];
  assert.equal(canRegisterAnimals({ db, tier: 'free', addCount: 1, targetPenId: 'p2' }).allowed, false);
  assert.equal(canRegisterAnimals({ db, tier: 'plus', addCount: 1, targetPenId: 'p2' }).allowed, true);
});

test('Monthly AI and QR usage resets automatically when entering a new month', () => {
  const prevMonth = {
    tier: 'plus' as const,
    activatedAt: '2026-10-01',
    usageMonth: '2026-10',
    aiUsed: 30,
    qrPrintUsed: 15,
  };
  const next = normalizeSubscription(prevMonth, '2026-11-01');
  assert.equal(next.usageMonth, '2026-11');
  assert.equal(next.aiUsed, 0);
  assert.equal(next.qrPrintUsed, 0);
  assert.equal(canAddWorker(1, 'free').allowed, false);
  assert.equal(canAddWorker(1, 'plus').allowed, true);
});

test('AI intelligence levels scale accurately across Free, Plus, Pro, and Enterprise tiers', () => {
  assert.deepEqual(getAllowedAIIntelligenceLevels('free'), []);
  assert.deepEqual(getAllowedAIIntelligenceLevels('plus'), ['cepat']);
  assert.deepEqual(getAllowedAIIntelligenceLevels('pro'), ['cepat', 'cerdas']);
  assert.deepEqual(getAllowedAIIntelligenceLevels('enterprise'), ['cepat', 'cerdas', 'pakar']);

  assert.equal(getDefaultAIIntelligence('plus'), 'cepat');
  assert.equal(getDefaultAIIntelligence('pro'), 'cerdas');
  assert.equal(getDefaultAIIntelligence('enterprise'), 'pakar');

  assert.equal(canUseAIIntelligence('free', 'cepat').allowed, false);
  assert.equal(canUseAIIntelligence('plus', 'cepat').allowed, true);
  assert.equal(canUseAIIntelligence('plus', 'cerdas').allowed, false);
  assert.equal(canUseAIIntelligence('plus', 'cerdas').recommendedTier, 'pro');
  assert.equal(canUseAIIntelligence('pro', 'cerdas').allowed, true);
  assert.equal(canUseAIIntelligence('pro', 'pakar').allowed, false);
  assert.equal(canUseAIIntelligence('pro', 'pakar').recommendedTier, 'enterprise');
  assert.equal(canUseAIIntelligence('enterprise', 'pakar').allowed, true);
});
