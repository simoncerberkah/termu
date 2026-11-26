import type {
  AppMode,
  AuthSession,
  FarmDatabase,
  MarketplaceCatalogItem,
  MarketplaceOrder,
  SellerReview,
} from '../types/termu';
import { createDemoDB, createEmptyLiveDB, getPartnerDemoListings } from '../data/seed';
import { calcAgeLabel, todayISO } from './format';
import { getActiveWithdrawal, getAnimalWeights, getLatestWeight, getPBBH } from './calculations';
import { DEFAULT_SELLER_REVIEWS } from './sellers';

const SESSION_KEY = 'termu_session_v1';
const FAV_KEY = 'termu_market_favorites_v1';
const ORDERS_KEY = 'termu_market_orders_v1';
const REVIEWS_KEY = 'termu_seller_reviews_v1';
const FOLLOWED_SELLERS_KEY = 'termu_followed_sellers_v1';

export function dbStorageKey(mode: AppMode): string {
  return mode === 'live' ? 'termu_live_db_v1' : 'termu_demo_db_v1';
}

export async function ensureDBInitialized(mode: AppMode): Promise<FarmDatabase> {
  const key = dbStorageKey(mode);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      return JSON.parse(raw) as FarmDatabase;
    } catch {
      // recreate below
    }
  }
  const initial = mode === 'demo' ? await createDemoDB() : createEmptyLiveDB();
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
}

export function saveDB(mode: AppMode, data: FarmDatabase): boolean {
  try {
    localStorage.setItem(dbStorageKey(mode), JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export async function resetDemoDB(): Promise<FarmDatabase> {
  const fresh = await createDemoDB();
  localStorage.setItem(dbStorageKey('demo'), JSON.stringify(fresh));
  return fresh;
}

export function loadAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(sess: AuthSession, remember = true): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  const str = JSON.stringify(sess);
  if (remember) localStorage.setItem(SESSION_KEY, str);
  else sessionStorage.setItem(SESSION_KEY, str);
}

export function clearAuthSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFavorites(ids: string[]): void {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function loadOrders(): MarketplaceOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as MarketplaceOrder[]) : [];
  } catch {
    return [];
  }
}

export function saveOrders(orders: MarketplaceOrder[]): void {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

export function loadSellerReviews(): SellerReview[] {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (!raw) return DEFAULT_SELLER_REVIEWS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? (parsed as SellerReview[])
      : DEFAULT_SELLER_REVIEWS;
  } catch {
    return DEFAULT_SELLER_REVIEWS;
  }
}

export function saveSellerReviews(reviews: SellerReview[]): void {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  } catch {
    // ignore
  }
}

export function loadFollowedSellers(): string[] {
  try {
    const raw = localStorage.getItem(FOLLOWED_SELLERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFollowedSellers(sellerIds: string[]): void {
  try {
    localStorage.setItem(FOLLOWED_SELLERS_KEY, JSON.stringify(sellerIds));
  } catch {
    // ignore
  }
}

export function extractCity(loc: string): string {
  const s = (loc || '').toLowerCase();
  if (s.includes('semarang')) return 'Semarang';
  if (s.includes('boyolali')) return 'Boyolali';
  if (s.includes('kendal')) return 'Kendal';
  if (s.includes('demak')) return 'Demak';
  if (s.includes('salatiga')) return 'Salatiga';
  if (s.includes('solo') || s.includes('surakarta')) return 'Surakarta';
  return (loc || 'Lainnya').split(',')[0].trim() || 'Lainnya';
}

export function buildMarketplaceCatalog(
  db: FarmDatabase | null,
  mode: AppMode,
  isLoggedIn: boolean
): MarketplaceCatalogItem[] {
  const items: MarketplaceCatalogItem[] = [];
  const today = todayISO();

  if (db && Array.isArray(db.listings)) {
    for (const lst of db.listings) {
      const an = (db.animals || []).find((a) => a.id === lst.animal_id);
      if (!an || an.status === 'terjual' || an.status === 'mati') continue;
      const weight = getLatestWeight(db, an);
      const pbbh = getPBBH(db, an.id);
      const wd = getActiveWithdrawal(db, an.id, today);
      const healthCount = (db.health_events || []).filter((e) => e.animal_id === an.id).length;
      const weightCount = getAnimalWeights(db, an.id).length;
      const loc = lst.location || db.farm.location || 'Semarang Utara, Jawa Tengah';
      items.push({
        id: lst.id,
        sellerId: 'seller_own',
        animal_id: an.id,
        name: an.name,
        species: an.species,
        breed: an.breed,
        sex: an.sex,
        weight,
        pbbh: pbbh !== null ? pbbh : an.species === 'Sapi' ? 0.85 : 0.11,
        ageLabel: calcAgeLabel(an.birth),
        price: Number(lst.price) || 0,
        pricePerKg: weight > 0 ? Math.round((Number(lst.price) || 0) / weight) : 0,
        farmName: db.farm.name || 'Kandang Peternak',
        city: extractCity(loc),
        location: loc,
        phone: db.farm.phone || '',
        photo: an.photo || '',
        vaccineCount: healthCount,
        withdrawalFree: !wd,
        verifiedRecords: weightCount,
        created_at: lst.created_at || today,
        description: lst.description || an.notes || '',
        is_own_farm: true,
        is_partner: false,
        is_demo: Boolean(lst.is_demo || mode === 'demo'),
      });
    }
  }

  if (!isLoggedIn || mode === 'demo') {
    items.push(...getPartnerDemoListings());
  }

  return items;
}
