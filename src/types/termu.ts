export type AppMode = 'demo' | 'live';
export type UserRole = 'pemilik' | 'pekerja';
export type AppScreen = 'landing' | 'marketplace' | 'login' | 'kandang';
export type KandangPage =
  | 'beranda'
  | 'ternak'
  | 'kandang'
  | 'pakan'
  | 'kesehatan'
  | 'keuangan'
  | 'jual'
  | 'pengaturan'
  | 'ai';

export type Species = 'Sapi' | 'Kambing' | 'Domba';
export type AnimalStatus = 'sehat' | 'perhatian' | 'terjual' | 'mati';

export interface UserAccount {
  id: string;
  name: string;
  contact: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  name: string;
  contact: string;
  role: UserRole;
  mode: AppMode;
}

export interface FarmProfile {
  id: string;
  name: string;
  location: string;
  phone: string;
  commodities: string[];
  daily_feed_budget: number;
  onboarding_done: boolean;
}

export interface Pen {
  id: string;
  farm_id: string;
  code: string;
  name: string;
  capacity: number;
  cleanliness: 'Bersih' | 'Perlu Bersih';
  water_status: 'Cukup' | 'Perlu Isi';
  notes: string;
}

export interface Animal {
  id: string;
  farm_id: string;
  name: string;
  species: Species;
  breed: string;
  sex: 'Jantan' | 'Betina';
  birth: string;
  origin: string;
  entry_weight: number;
  entry_date: string;
  pen_id: string;
  status: AnimalStatus;
  buy_price: number;
  ready_for_sale: boolean;
  photo: string;
  notes: string;
}

export interface WeightRecord {
  id: string;
  animal_id: string;
  date: string;
  kg: number;
  method: string;
}

export interface FeedItem {
  id: string;
  farm_id: string;
  name: string;
  price: number;
  pk: number;
  tdn: number;
  stock_kg: number;
  daily_use_kg: number;
  unit: string;
}

export interface RationItem {
  feed_id: string;
  kg: number;
}

export interface RationFormula {
  id: string;
  name: string;
  items: RationItem[];
}

export interface FeedLog {
  id: string;
  date: string;
  pen_id: string;
  ration_name: string;
  total_kg: number;
  cost: number;
  recorded_by: string;
}

export interface HealthEvent {
  id: string;
  animal_id: string;
  type: string;
  date: string;
  treatment: string;
  notes: string;
  withdrawal_until: string;
}

export interface ReproductionEvent {
  id: string;
  animal_id: string;
  type: string;
  date: string;
  status: string;
  due_date: string;
  notes: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  animal_id: string;
  pen_id: string;
  done: boolean;
  notes: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  note: string;
}

export interface TaskItem {
  id: string;
  date: string;
  pen_id: string;
  item: string;
  done: boolean;
  done_by: string;
  done_at: string;
}

export interface FarmListing {
  id: string;
  farm_id: string;
  animal_id: string;
  price: number;
  location: string;
  description: string;
  created_at: string;
  is_demo: boolean;
}

export type SubscriptionTier = 'free' | 'plus' | 'pro' | 'enterprise';
export type AIIntelligenceLevel = 'cepat' | 'cerdas' | 'pakar';

export interface AIIntelligenceConfig {
  id: AIIntelligenceLevel;
  name: string;
  shortLabel: string;
  engineLabel: string;
  description: string;
  minTier: Exclude<SubscriptionTier, 'free'>;
  minTierLabel: string;
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  activatedAt: string;
  usageMonth: string; // YYYY-MM
  aiUsed: number;
  qrPrintUsed: number;
}

export interface PlanConfig {
  id: SubscriptionTier;
  level: number;
  name: string;
  badge?: string;
  tagline: string;
  priceMonthly: number;
  originalPriceMonthly: number;
  discountPercent: number;
  hasAds: boolean;
  maxAnimals: number | null; // null = unlimited
  maxPens: number | null;
  maxAnimalsPerPen: number | null;
  aiMonthlyQuota: number; // 0 = locked
  aiIntelligenceLevels: AIIntelligenceLevel[];
  aiIntelligenceSummary: string;
  qrPrintMonthlyQuota: number | null; // null = unlimited
  maxWorkers: number | null;
  highlights: string[];
}

export interface FarmDatabase {
  users: UserAccount[];
  farm: FarmProfile;
  pens: Pen[];
  animals: Animal[];
  weights: WeightRecord[];
  feeds: FeedItem[];
  rations: RationFormula[];
  feed_logs: FeedLog[];
  health_events: HealthEvent[];
  reproduction_events: ReproductionEvent[];
  schedules: ScheduleItem[];
  transactions: Transaction[];
  tasks: TaskItem[];
  listings: FarmListing[];
  subscription?: SubscriptionState;
}

export interface MarketplaceCatalogItem {
  id: string;
  sellerId: string;
  animal_id: string;
  name: string;
  species: Species;
  breed: string;
  sex: 'Jantan' | 'Betina';
  weight: number;
  pbbh: number;
  ageLabel: string;
  price: number;
  pricePerKg: number;
  farmName: string;
  city: string;
  location: string;
  phone: string;
  photo: string;
  vaccineCount: number;
  withdrawalFree: boolean;
  verifiedRecords: number;
  created_at: string;
  description: string;
  is_own_farm: boolean;
  is_partner: boolean;
  is_demo: boolean;
}

export type SellerTrustLevel = 'terpercaya' | 'terverifikasi' | 'perlu_cek';

export interface SellerProfile {
  id: string;
  farmName: string;
  ownerName: string;
  city: string;
  location: string;
  phone: string;
  joinedSince: string;
  activeStatusLabel: string;
  responseRate: number;
  responseTimeLabel: string;
  completedSales: number;
  onTimeDeliveryRate: number;
  identityVerified: boolean;
  vetPartnerVerified: boolean;
  bio: string;
  specialties: string[];
  baseFollowers: number;
  isOwnFarm?: boolean;
  isDemo?: boolean;
}

export interface SellerReview {
  id: string;
  sellerId: string;
  buyerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  animalPurchased: string;
  date: string;
  verifiedPurchase: boolean;
}

export interface SellerTrustReason {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface SellerReputationSummary {
  averageRating: number;
  reviewCount: number;
  starBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  trustScore: number;
  trustLevel: SellerTrustLevel;
  trustLabel: string;
  trustShortLabel: string;
  trustVerdict: string;
  trustReasons: SellerTrustReason[];
}

export type DeliveryMethod = 'delivery' | 'pickup';

export interface ShippingFleetOption {
  id: string;
  name: string;
  subtitle: string;
  etaLabel: string;
  multiplier: number;
  suitableFor: Species[];
}

export interface ShippingRegionTariff {
  id: string;
  name: string;
  province: string;
  baseCowFee: number;
  baseSmallFee: number;
  distanceNote: string;
}

export interface CheckoutFormValues {
  buyerName: string;
  buyerPhone: string;
  deliveryMethod: DeliveryMethod;
  fleetId: string;
  regionId: string;
  address: string;
  preferredDate: string;
  notes: string;
}

export interface CheckoutBreakdown {
  itemPrice: number;
  shippingFee: number;
  serviceFee: number;
  totalAmount: number;
  fleetName: string;
  regionName: string;
}

export interface MarketplaceOrder {
  orderCode: string;
  createdAt: string;
  listingId: string;
  sellerId?: string;
  animalId: string;
  animalName: string;
  species: Species;
  breed: string;
  weight: number;
  farmName: string;
  farmLocation: string;
  farmPhone: string;
  buyerName: string;
  buyerPhone: string;
  deliveryMethod: DeliveryMethod;
  fleetId: string;
  fleetName: string;
  regionId: string;
  regionName: string;
  address: string;
  preferredDate: string;
  notes: string;
  itemPrice: number;
  shippingFee: number;
  serviceFee: number;
  totalAmount: number;
  status: 'Menunggu Konfirmasi Kandang';
  isDemo: boolean;
}

export interface DecisionSuggestion {
  id: string;
  level: 'danger' | 'warning' | 'success';
  title: string;
  reason: string;
  actionLabel: string;
  actionPage: KandangPage;
  animalId: string | null;
}

export interface AIScreeningResult {
  sourceLabel: string;
  model?: string;
  area: string;
  suspected: string;
  confidence: string;
  urgency: string;
  observation: string;
  safeSteps: string[];
  disclaimer: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  source?: string;
  intelligenceLevel?: AIIntelligenceLevel;
  time: string;
  isError?: boolean;
}
