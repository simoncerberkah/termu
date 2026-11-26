import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_SELLER_PROFILES,
  DEFAULT_SELLER_REVIEWS,
  computeSellerReputation,
  validateSellerReview,
} from './sellers.ts';
import type { MarketplaceCatalogItem, SellerReview } from '../types/termu.ts';

const sampleListing = (sellerId: string, verifiedRecords = 9, withdrawalFree = true): MarketplaceCatalogItem => ({
  id: `lst_${sellerId}`,
  sellerId,
  animal_id: 'SP-999',
  name: 'Contoh Sapi',
  species: 'Sapi',
  breed: 'Limousin Cross',
  sex: 'Jantan',
  weight: 500,
  pbbh: 0.95,
  ageLabel: '2 th',
  price: 31000000,
  pricePerKg: 62000,
  farmName: 'Kandang Test',
  city: 'Boyolali',
  location: 'Boyolali, Jawa Tengah',
  phone: '081200000000',
  photo: '',
  vaccineCount: 2,
  withdrawalFree,
  verifiedRecords,
  created_at: '2026-10-01',
  description: 'Contoh',
  is_own_farm: false,
  is_partner: true,
  is_demo: true,
});

test('computeSellerReputation classifies Kandang Merapi Jaya as Toko Terpercaya with high trustScore', () => {
  const seller = DEFAULT_SELLER_PROFILES.seller_merapi;
  const rep = computeSellerReputation(seller, DEFAULT_SELLER_REVIEWS, [sampleListing('seller_merapi', 10, true)]);

  assert.equal(rep.trustLevel, 'terpercaya');
  assert.equal(rep.trustLabel, 'Toko Terpercaya');
  assert.equal(rep.averageRating, 5.0);
  assert.equal(rep.reviewCount, 3);
  assert.ok(rep.trustScore >= 90);
  assert.equal(rep.starBreakdown[5], 3);
});

test('computeSellerReputation classifies Tani Makmur Demak as Toko Terverifikasi', () => {
  const seller = DEFAULT_SELLER_PROFILES.seller_tani_demak;
  const rep = computeSellerReputation(seller, DEFAULT_SELLER_REVIEWS, [sampleListing('seller_tani_demak', 7, true)]);

  assert.equal(rep.trustLevel, 'terverifikasi');
  assert.equal(rep.trustLabel, 'Toko Terverifikasi');
  assert.equal(rep.averageRating, 4.5);
  assert.equal(rep.reviewCount, 2);
});

test('computeSellerReputation classifies Sumber Barokah Demak as Perlu Cek Langsung', () => {
  const seller = DEFAULT_SELLER_PROFILES.seller_barokah_demak;
  const rep = computeSellerReputation(seller, DEFAULT_SELLER_REVIEWS, [sampleListing('seller_barokah_demak', 5, true)]);

  assert.equal(rep.trustLevel, 'perlu_cek');
  assert.equal(rep.trustLabel, 'Perlu Cek Langsung');
  assert.equal(rep.averageRating, 3.5);
  assert.ok(rep.trustScore < 65);
  const identityReason = rep.trustReasons.find((r) => r.id === 'identity');
  assert.equal(identityReason?.passed, false);
});

test('computeSellerReputation dynamically recalculates averageRating and breakdown when new review is added', () => {
  const seller = DEFAULT_SELLER_PROFILES.seller_kaliwungu;
  const before = computeSellerReputation(seller, DEFAULT_SELLER_REVIEWS, [sampleListing('seller_kaliwungu', 8, true)]);
  assert.equal(before.averageRating, 5.0);
  assert.equal(before.reviewCount, 2);

  const extraReview: SellerReview = {
    id: 'rev_new',
    sellerId: 'seller_kaliwungu',
    buyerName: 'Budi',
    rating: 2,
    comment: 'Pengiriman agak terlambat dari estimasi.',
    animalPurchased: 'Prasetyo',
    date: '2026-11-25',
    verifiedPurchase: true,
  };

  const after = computeSellerReputation(
    seller,
    [extraReview, ...DEFAULT_SELLER_REVIEWS],
    [sampleListing('seller_kaliwungu', 8, true)]
  );

  assert.equal(after.reviewCount, 3);
  assert.equal(after.averageRating, 4.0);
  assert.equal(after.starBreakdown[2], 1);
  assert.equal(after.starBreakdown[5], 2);
  // Drops from terpercaya to terverifikasi when averageRating drops below 4.6
  assert.equal(after.trustLevel, 'terverifikasi');
});

test('validateSellerReview enforces name, 1-5 rating, and minimum comment length', () => {
  assert.equal(validateSellerReview({ buyerName: 'A', rating: 5, comment: 'Sangat bagus sekali' }).ok, false);
  assert.equal(validateSellerReview({ buyerName: 'Budi', rating: 6, comment: 'Sangat bagus sekali' }).ok, false);
  assert.equal(validateSellerReview({ buyerName: 'Budi', rating: 5, comment: 'Oke' }).ok, false);
  assert.equal(validateSellerReview({ buyerName: 'Budi', rating: 5, comment: 'Sapi sehat dan bobot akurat.' }).ok, true);
});
