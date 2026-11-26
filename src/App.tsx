import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AIChatMessage,
  AIIntelligenceLevel,
  Animal,
  AppMode,
  AppScreen,
  AuthSession,
  FarmDatabase,
  FarmProfile,
  FeedItem,
  FeedLog,
  HealthEvent,
  KandangPage,
  MarketplaceCatalogItem,
  MarketplaceOrder,
  Pen,
  RationFormula,
  ReproductionEvent,
  ScheduleItem,
  SellerReview,
  SubscriptionTier,
  Transaction,
  UserAccount,
  UserRole,
} from './types/termu';
import {
  buildMarketplaceCatalog,
  clearAuthSession,
  ensureDBInitialized,
  loadAuthSession,
  loadFavorites,
  loadFollowedSellers,
  loadOrders,
  loadSellerReviews,
  resetDemoDB,
  saveAuthSession,
  saveDB,
  saveFavorites,
  saveFollowedSellers,
  saveOrders,
  saveSellerReviews,
} from './utils/storage';
import { nowTimeStr, sha256, todayISO, uid } from './utils/format';
import { getDefaultAIIntelligence, getPlanConfig, normalizeSubscription } from './utils/subscription';
import { computeSellerReputation, resolveSellerProfile } from './utils/sellers';
import { ToastStack, type ToastItem } from './components/Modal';
import { CheckoutModal } from './components/CheckoutModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { SellerProfileModal, type SellerModalTab } from './components/SellerProfileModal';
import {
  PassportModal,
  PublicPassportView,
  resolvePassportTarget,
  type PassportTarget,
} from './components/PassportModal';
import { LandingPage } from './pages/LandingPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { TernakPage } from './pages/TernakPage';
import { KandangPage as KandangPenPage } from './pages/KandangPage';
import { PakanPage } from './pages/PakanPage';
import { KesehatanPage } from './pages/KesehatanPage';
import { KeuanganPage } from './pages/KeuanganPage';
import { JualPage, PengaturanPage } from './pages/JualPengaturanPages';
import { AIChatPage, FloatingAIChat } from './components/AIChatComponents';
import {
  KandangShell,
  QuickAddPenModal,
  RecordWeightModal,
  WhatsAppReportModal,
} from './components/KandangShell';

const OWNER_ONLY_PAGES: KandangPage[] = ['keuangan', 'jual', 'pengaturan'];

function parseHashPassport(): { animalId: string; mode: AppMode } | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash || '';
  if (!hash.startsWith('#paspor=')) return null;
  const params = new URLSearchParams(hash.slice(1));
  const animalId = params.get('paspor');
  const modeParam = params.get('mode') === 'live' ? 'live' : 'demo';
  return animalId ? { animalId, mode: modeParam } : null;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [kandangPage, setKandangPage] = useState<KandangPage>('beranda');
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [loginInitialTab, setLoginInitialTab] = useState<'login' | 'register'>('login');

  const [mode, setMode] = useState<AppMode>('demo');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [demoDB, setDemoDB] = useState<FarmDatabase | null>(null);
  const [liveDB, setLiveDB] = useState<FarmDatabase | null>(null);

  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites());
  const [orders, setOrders] = useState<MarketplaceOrder[]>(() => loadOrders());
  const [sellerReviews, setSellerReviews] = useState<SellerReview[]>(() => loadSellerReviews());
  const [followedSellers, setFollowedSellers] = useState<string[]>(() => loadFollowedSellers());
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Modals
  const [checkoutItem, setCheckoutItem] = useState<MarketplaceCatalogItem | null>(null);
  const [sellerModalState, setSellerModalState] = useState<{
    sellerId: string;
    tab: SellerModalTab;
    openReviewForm?: boolean;
    defaultAnimal?: string;
  } | null>(null);
  const [passportTarget, setPassportTarget] = useState<PassportTarget | null>(null);
  const [publicPassportRef, setPublicPassportRef] = useState<{ animalId: string; mode: AppMode } | null>(() =>
    parseHashPassport()
  );
  const [waReportOpen, setWaReportOpen] = useState(false);
  const [weightModalState, setWeightModalState] = useState<{ open: boolean; animalId: string | null }>({
    open: false,
    animalId: null,
  });
  const [quickPenOpen, setQuickPenOpen] = useState(false);
  const [openAddAnimalSignal, setOpenAddAnimalSignal] = useState(0);
  const [subscriptionModal, setSubscriptionModal] = useState<{ open: boolean; reason: string | null }>({
    open: false,
    reason: null,
  });

  // AI Chat session history & intelligence mode
  const [aiIntelligence, setAiIntelligence] = useState<AIIntelligenceLevel>('cepat');
  const [includeOwnerData, setIncludeOwnerData] = useState<boolean>(true);
  const [aiMessages, setAiMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome_ai',
      role: 'ai',
      text: 'Halo! Saya Chatbot AI TERMU. Anda bebas bertanya apa saja (topik umum, bisnis, promosi, hingga hitungan) sekaligus saya bisa langsung membaca data ternak, pakan, keuangan, dan pesanan milik Anda. Pilih tingkat kecerdasan AI (Cepat, Cerdas, atau Pakar) sesuai paket Anda di atas.',
      source: 'Chatbot AI TERMU',
      time: nowTimeStr(),
    },
  ]);

  const notify = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = uid('toast');
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  // Initialize DBs, Session & URL params
  useEffect(() => {
    let active = true;
    (async () => {
      const [dDb, lDb] = await Promise.all([ensureDBInitialized('demo'), ensureDBInitialized('live')]);
      if (!active) return;
      setDemoDB(dDb);
      setLiveDB(lDb);

      const savedSession = loadAuthSession();
      const params = new URLSearchParams(window.location.search);
      const autostart = params.get('autostart');

      if (autostart === '1' || autostart === 'demo') {
        const demoOwner = dDb.users.find((u) => u.role === 'pemilik') || dDb.users[0];
        const sess: AuthSession = {
          userId: demoOwner.id,
          name: demoOwner.name,
          contact: demoOwner.contact,
          role: demoOwner.role,
          mode: 'demo',
        };
        saveAuthSession(sess, true);
        setSession(sess);
        setMode('demo');
        setScreen('kandang');
        setKandangPage('beranda');
      } else if (autostart === 'market') {
        setScreen('marketplace');
      } else if (savedSession) {
        setSession(savedSession);
        setMode(savedSession.mode);
      }

      setReady(true);
    })();

    const onHashChange = () => setPublicPassportRef(parseHashPassport());
    window.addEventListener('hashchange', onHashChange);
    return () => {
      active = false;
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  const currentDB = mode === 'live' ? liveDB : demoDB;

  const updateCurrentDB = useCallback(
    (updater: (prev: FarmDatabase) => FarmDatabase) => {
      if (mode === 'live') {
        setLiveDB((prev) => {
          if (!prev) return prev;
          const next = updater(prev);
          saveDB('live', next);
          return next;
        });
      } else {
        setDemoDB((prev) => {
          if (!prev) return prev;
          const next = updater(prev);
          saveDB('demo', next);
          return next;
        });
      }
    },
    [mode]
  );

  const catalog = useMemo(
    () => buildMarketplaceCatalog(currentDB, mode, Boolean(session)),
    [currentDB, mode, session]
  );

  const currentSubscription = useMemo(
    () => normalizeSubscription(currentDB?.subscription),
    [currentDB?.subscription]
  );

  const openUpgradeModal = useCallback((reason?: string) => {
    setSubscriptionModal({ open: true, reason: reason || null });
  }, []);

  const handleActivateTier = useCallback(
    (tier: SubscriptionTier) => {
      const plan = getPlanConfig(tier);
      updateCurrentDB((prev) => {
        const norm = normalizeSubscription(prev.subscription);
        return {
          ...prev,
          subscription: {
            ...norm,
            tier,
            activatedAt: todayISO(),
          },
        };
      });
      setAiIntelligence(getDefaultAIIntelligence(tier));
      notify(
        tier === 'free'
          ? 'Paket dikembalikan ke Gratis.'
          : `Paket TERMU ${plan.name} aktif! Bebas iklan, ${plan.aiIntelligenceSummary} & kuota baru langsung berlaku.`,
        'success'
      );
    },
    [notify, updateCurrentDB]
  );

  const handleConsumeAIQuota = useCallback(() => {
    updateCurrentDB((prev) => {
      const norm = normalizeSubscription(prev.subscription);
      return {
        ...prev,
        subscription: {
          ...norm,
          aiUsed: norm.aiUsed + 1,
        },
      };
    });
  }, [updateCurrentDB]);

  const handleConsumeQRPrint = useCallback(() => {
    updateCurrentDB((prev) => {
      const norm = normalizeSubscription(prev.subscription);
      return {
        ...prev,
        subscription: {
          ...norm,
          qrPrintUsed: norm.qrPrintUsed + 1,
        },
      };
    });
  }, [updateCurrentDB]);

  // Navigation helpers
  const navigateKandangPage = useCallback(
    (page: KandangPage, animalId?: string) => {
      if (session?.role === 'pekerja' && OWNER_ONLY_PAGES.includes(page)) {
        notify('Menu ini khusus untuk Pemilik Peternakan.', 'warning');
        return;
      }
      setKandangPage(page);
      setSelectedAnimalId(page === 'ternak' ? animalId || null : null);
      setScreen('kandang');
    },
    [notify, session?.role]
  );

  const handleStartDemo = useCallback(async () => {
    const dbRef = demoDB || (await ensureDBInitialized('demo'));
    const demoOwner = dbRef.users.find((u) => u.role === 'pemilik') || dbRef.users[0];
    const sess: AuthSession = {
      userId: demoOwner.id,
      name: demoOwner.name,
      contact: demoOwner.contact,
      role: demoOwner.role,
      mode: 'demo',
    };
    saveAuthSession(sess, true);
    setSession(sess);
    setMode('demo');
    setScreen('kandang');
    setKandangPage('beranda');
    notify('Masuk ke Mode Demo — Kandang Sumber Rejeki (32 ekor contoh).', 'success');
  }, [demoDB, notify]);

  const handleSelectLandingPlan = useCallback(
    async (tier: SubscriptionTier) => {
      const plan = getPlanConfig(tier);
      if (!session) {
        await handleStartDemo();
      } else {
        setScreen('kandang');
      }
      setSubscriptionModal({
        open: true,
        reason: `Anda memilih TERMU ${plan.name}. Klik tombol paket ${plan.name} di bawah untuk mengaktifkannya langsung pada akun kandang ini.`,
      });
    },
    [handleStartDemo, session]
  );

  const handleLogin = useCallback(
    async (contact: string, password: string, remember: boolean): Promise<{ ok: boolean; error?: string }> => {
      const normalized = contact.trim().toLowerCase();
      const passHash = await sha256(password);
      const dDb = demoDB || (await ensureDBInitialized('demo'));
      const lDb = liveDB || (await ensureDBInitialized('live'));

      const liveMatch = lDb.users.find(
        (u) => u.contact.toLowerCase() === normalized && u.passwordHash === passHash
      );
      if (liveMatch) {
        const sess: AuthSession = {
          userId: liveMatch.id,
          name: liveMatch.name,
          contact: liveMatch.contact,
          role: liveMatch.role,
          mode: 'live',
        };
        saveAuthSession(sess, remember);
        setSession(sess);
        setMode('live');
        setScreen('kandang');
        setKandangPage('beranda');
        notify(`Selamat datang kembali, ${liveMatch.name}!`, 'success');
        return { ok: true };
      }

      const demoMatch = dDb.users.find(
        (u) => u.contact.toLowerCase() === normalized && u.passwordHash === passHash
      );
      if (demoMatch) {
        const sess: AuthSession = {
          userId: demoMatch.id,
          name: demoMatch.name,
          contact: demoMatch.contact,
          role: demoMatch.role,
          mode: 'demo',
        };
        saveAuthSession(sess, remember);
        setSession(sess);
        setMode('demo');
        setScreen('kandang');
        setKandangPage('beranda');
        notify(`Masuk ke Mode Demo sebagai ${demoMatch.name}.`, 'success');
        return { ok: true };
      }

      return { ok: false, error: 'Email/WA atau kata sandi tidak cocok. Coba akun demo atau daftar baru.' };
    },
    [demoDB, liveDB, notify]
  );

  const handleRegister = useCallback(
    async (payload: {
      name: string;
      contact: string;
      password: string;
      role: UserRole;
    }): Promise<{ ok: boolean; error?: string }> => {
      const lDb = liveDB || (await ensureDBInitialized('live'));
      const normalized = payload.contact.trim().toLowerCase();
      if (lDb.users.some((u) => u.contact.toLowerCase() === normalized)) {
        return { ok: false, error: 'Email atau nomor WA ini sudah terdaftar. Silakan masuk.' };
      }
      const passHash = await sha256(payload.password);
      const newUser: UserAccount = {
        id: uid('usr'),
        name: payload.name.trim(),
        contact: normalized,
        passwordHash: passHash,
        role: payload.role,
        createdAt: todayISO(),
      };
      const updatedLive: FarmDatabase = {
        ...lDb,
        users: [...lDb.users, newUser],
        farm: {
          ...lDb.farm,
          phone: lDb.farm.phone || (normalized.includes('@') ? '' : normalized),
        },
      };
      setLiveDB(updatedLive);
      saveDB('live', updatedLive);

      const sess: AuthSession = {
        userId: newUser.id,
        name: newUser.name,
        contact: newUser.contact,
        role: newUser.role,
        mode: 'live',
      };
      saveAuthSession(sess, true);
      setSession(sess);
      setMode('live');
      setScreen('kandang');
      setKandangPage('beranda');
      notify('Akun peternakan berhasil dibuat! Lanjutkan penyiapan kandang.', 'success');
      return { ok: true };
    },
    [liveDB, notify]
  );

  const handleLogout = useCallback(() => {
    clearAuthSession();
    setSession(null);
    setScreen('landing');
    notify('Anda telah keluar dari akun kandang.', 'info');
  }, [notify]);

  const handleSwitchMode = useCallback(
    (targetMode: AppMode) => {
      if (targetMode === 'demo') {
        void handleStartDemo();
        return;
      }
      if (liveDB && liveDB.users.length > 0) {
        const owner = liveDB.users.find((u) => u.role === 'pemilik') || liveDB.users[0];
        const sess: AuthSession = {
          userId: owner.id,
          name: owner.name,
          contact: owner.contact,
          role: owner.role,
          mode: 'live',
        };
        saveAuthSession(sess, true);
        setSession(sess);
        setMode('live');
        setScreen('kandang');
        setKandangPage('beranda');
        notify('Beralih ke Mode Peternakan Saya.', 'info');
      } else {
        setLoginInitialTab('register');
        setScreen('login');
        notify('Daftar akun baru terlebih dahulu untuk memulai kandang Anda dari nol.', 'info');
      }
    },
    [handleStartDemo, liveDB, notify]
  );

  const handleResetDemo = useCallback(async () => {
    const fresh = await resetDemoDB();
    setDemoDB(fresh);
    notify('Data Mode Demo berhasil direset ke kondisi awal.', 'success');
  }, [notify]);

  const handleToggleFavorite = useCallback((listingId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(listingId) ? prev.filter((id) => id !== listingId) : [...prev, listingId];
      saveFavorites(next);
      return next;
    });
  }, []);

  const handleOrderCreated = useCallback(
    (order: MarketplaceOrder) => {
      setOrders((prev) => {
        const next = [order, ...prev];
        saveOrders(next);
        return next;
      });
      notify(`Pesanan ${order.orderCode} tersimpan di Pesanan Saya.`, 'success');
    },
    [notify]
  );

  const handleOpenSeller = useCallback(
    (
      sellerId: string,
      opts?: { tab?: SellerModalTab; openReviewForm?: boolean; defaultAnimal?: string }
    ) => {
      setSellerModalState({
        sellerId,
        tab: opts?.tab || 'etalase',
        openReviewForm: Boolean(opts?.openReviewForm),
        defaultAnimal: opts?.defaultAnimal || '',
      });
    },
    []
  );

  const handleToggleFollowSeller = useCallback(
    (sellerId: string) => {
      setFollowedSellers((prev) => {
        const exists = prev.includes(sellerId);
        const next = exists ? prev.filter((id) => id !== sellerId) : [...prev, sellerId];
        saveFollowedSellers(next);
        notify(exists ? 'Berhenti mengikuti kandang ini.' : 'Sekarang mengikuti kandang ini.', 'info');
        return next;
      });
    },
    [notify]
  );

  const handleAddSellerReview = useCallback(
    (review: SellerReview) => {
      setSellerReviews((prev) => {
        const next = [review, ...prev];
        saveSellerReviews(next);
        return next;
      });
      notify('Ulasan Anda tersimpan & rating toko langsung diperbarui!', 'success');
    },
    [notify]
  );

  const handleOpenPassport = useCallback(
    (animalId: string) => {
      const target = resolvePassportTarget(animalId, currentDB, mode, catalog);
      if (!target) {
        notify('Data Paspor QR ternak tidak ditemukan.', 'warning');
        return;
      }
      setPassportTarget(target);
    },
    [catalog, currentDB, mode, notify]
  );

  const handleOpenPublicPassport = useCallback((animalId: string, targetMode: AppMode) => {
    window.location.hash = `#paspor=${encodeURIComponent(animalId)}&mode=${targetMode}`;
    setPublicPassportRef({ animalId, mode: targetMode });
  }, []);

  // Data mutation handlers for Kandang modules
  const handleToggleTask = useCallback(
    (taskId: string) => {
      updateCurrentDB((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                done: !t.done,
                done_by: !t.done ? session?.name || 'Petugas' : '',
                done_at: !t.done ? nowTimeStr() : '',
              }
            : t
        ),
      }));
    },
    [session?.name, updateCurrentDB]
  );

  const handleSaveWeight = useCallback(
    (animalId: string, kg: number, date: string, method: string) => {
      updateCurrentDB((prev) => ({
        ...prev,
        weights: [...prev.weights, { id: uid('wt'), animal_id: animalId, date, kg, method }],
      }));
      notify(`Bobot ${kg} kg berhasil dicatat.`, 'success');
    },
    [notify, updateCurrentDB]
  );

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bento-card px-8 py-6 text-center">
          <div className="font-display text-lg font-semibold text-[#2B2B2B]">Memuat TERMU...</div>
          <p className="text-xs text-[#6E7178] mt-1">Menyiapkan data kandang & Pasar TERMU</p>
        </div>
      </div>
    );
  }

  // Public QR Passport Screen (#paspor=...)
  if (publicPassportRef) {
    const sourceDb = publicPassportRef.mode === 'live' ? liveDB : demoDB;
    const publicTarget = resolvePassportTarget(
      publicPassportRef.animalId,
      sourceDb,
      publicPassportRef.mode,
      catalog
    );
    return (
      <>
        <PublicPassportView
          target={publicTarget}
          onClose={() => {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            setPublicPassportRef(null);
          }}
        />
        <ToastStack toasts={toasts} />
      </>
    );
  }

  // Onboarding wizard for Live mode if not yet finished
  const needsOnboarding = screen === 'kandang' && session && mode === 'live' && liveDB && !liveDB.farm.onboarding_done;

  return (
    <>
      {screen === 'landing' && (
        <LandingPage
          db={currentDB}
          session={session}
          currentTier={currentSubscription.tier}
          catalog={catalog}
          sellerReviews={sellerReviews}
          favoriteCount={favorites.length}
          onNavigateScreen={(s) => {
            if (s === 'kandang' && !session) {
              setLoginInitialTab('login');
              setScreen('login');
            } else {
              setScreen(s);
            }
          }}
          onStartDemo={() => void handleStartDemo()}
          onOpenPassport={handleOpenPassport}
          onOpenCheckout={(item) => setCheckoutItem(item)}
          onOpenSeller={handleOpenSeller}
          onSelectLandingPlan={(tier) => void handleSelectLandingPlan(tier)}
        />
      )}

      {screen === 'marketplace' && (
        <MarketplacePage
          db={currentDB}
          session={session}
          catalog={catalog}
          favorites={favorites}
          orders={orders}
          sellerReviews={sellerReviews}
          onToggleFavorite={handleToggleFavorite}
          onOpenCheckout={(item) => setCheckoutItem(item)}
          onOpenPassport={handleOpenPassport}
          onOpenSeller={handleOpenSeller}
          onNavigateScreen={(s) => {
            if (s === 'kandang' && !session) {
              setLoginInitialTab('login');
              setScreen('login');
            } else {
              setScreen(s);
            }
          }}
          onGoKandangPage={(page) => {
            if (!session) {
              setLoginInitialTab('login');
              setScreen('login');
              return;
            }
            navigateKandangPage(page);
          }}
          onToast={notify}
        />
      )}

      {screen === 'login' && (
        <LoginPage
          initialTab={loginInitialTab}
          onNavigateScreen={(s) => setScreen(s)}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onDemoLogin={handleStartDemo}
          onToast={notify}
        />
      )}

      {needsOnboarding && liveDB && (
        <OnboardingPage db={liveDB} onUpdateDB={updateCurrentDB} onToast={notify} />
      )}

      {screen === 'kandang' && session && currentDB && !needsOnboarding && (
        <KandangShell
          db={currentDB}
          session={session}
          mode={mode}
          subscription={currentSubscription}
          activePage={kandangPage}
          onSelectPage={(p) => navigateKandangPage(p)}
          onOpenMarketplace={() => setScreen('marketplace')}
          onGoLanding={() => setScreen('landing')}
          onResetDemo={() => void handleResetDemo()}
          onSwitchMode={handleSwitchMode}
          onLogout={handleLogout}
          onOpenQuickAddAnimal={() => {
            setKandangPage('ternak');
            setSelectedAnimalId(null);
            setOpenAddAnimalSignal((n) => n + 1);
          }}
          onOpenRecordWeight={() => setWeightModalState({ open: true, animalId: null })}
          onOpenWAReport={() => setWaReportOpen(true)}
          onOpenUpgrade={openUpgradeModal}
        >
          {kandangPage === 'beranda' && (
            <DashboardPage
              db={currentDB}
              session={session}
              mode={mode}
              subscription={currentSubscription}
              onNavigate={navigateKandangPage}
              onToggleTask={handleToggleTask}
              onOpenQuickAddAnimal={() => {
                setKandangPage('ternak');
                setSelectedAnimalId(null);
                setOpenAddAnimalSignal((n) => n + 1);
              }}
              onOpenRecordWeight={(id) => setWeightModalState({ open: true, animalId: id || null })}
              onOpenPassport={handleOpenPassport}
              onOpenWAReport={() => setWaReportOpen(true)}
              onOpenQuickPen={() => setQuickPenOpen(true)}
              onOpenUpgrade={openUpgradeModal}
            />
          )}

          {kandangPage === 'ternak' && (
            <TernakPage
              db={currentDB}
              role={session.role}
              subscription={currentSubscription}
              selectedAnimalId={selectedAnimalId}
              onSelectAnimal={setSelectedAnimalId}
              openAddModalSignal={openAddAnimalSignal}
              onAddAnimal={(animal: Animal, initialWeight: number) => {
                updateCurrentDB((prev) => ({
                  ...prev,
                  animals: [animal, ...prev.animals],
                  weights: [
                    ...prev.weights,
                    { id: uid('wt'), animal_id: animal.id, date: todayISO(), kg: initialWeight, method: 'Bobot Masuk' },
                  ],
                }));
                notify(`${animal.name} (${animal.id}) berhasil ditambahkan.`, 'success');
              }}
              onAddBulkAnimals={(animals, initialWeights) => {
                updateCurrentDB((prev) => ({
                  ...prev,
                  animals: [...animals, ...prev.animals],
                  weights: [
                    ...prev.weights,
                    ...initialWeights.map((w) => ({
                      id: uid('wt'),
                      animal_id: w.animalId,
                      date: todayISO(),
                      kg: w.kg,
                      method: 'Input Kelompok',
                    })),
                  ],
                }));
                notify(`${animals.length} ekor ternak berhasil ditambahkan sekaligus.`, 'success');
              }}
              onDeleteAnimal={(animalId) => {
                updateCurrentDB((prev) => ({
                  ...prev,
                  animals: prev.animals.filter((a) => a.id !== animalId),
                  weights: prev.weights.filter((w) => w.animal_id !== animalId),
                  listings: prev.listings.filter((l) => l.animal_id !== animalId),
                  health_events: prev.health_events.filter((h) => h.animal_id !== animalId),
                  reproduction_events: prev.reproduction_events.filter((r) => r.animal_id !== animalId),
                }));
                notify('Data ternak berhasil dihapus.', 'info');
              }}
              onUpdateAnimal={(animalId, patch) => {
                updateCurrentDB((prev) => ({
                  ...prev,
                  animals: prev.animals.map((a) => (a.id === animalId ? { ...a, ...patch } : a)),
                }));
                notify('Status & sekat ternak berhasil diperbarui.', 'success');
              }}
              onMarkReadyForSale={(animalId, price, description) => {
                updateCurrentDB((prev) => {
                  const existing = prev.listings.find((l) => l.animal_id === animalId);
                  const nextListings = existing
                    ? prev.listings.map((l) =>
                        l.animal_id === animalId ? { ...l, price, description } : l
                      )
                    : [
                        {
                          id: uid('lst'),
                          farm_id: prev.farm.id,
                          animal_id: animalId,
                          price,
                          location: prev.farm.location || 'Indonesia',
                          description,
                          created_at: todayISO(),
                          is_demo: mode === 'demo',
                        },
                        ...prev.listings,
                      ];
                  return {
                    ...prev,
                    animals: prev.animals.map((a) =>
                      a.id === animalId ? { ...a, ready_for_sale: true } : a
                    ),
                    listings: nextListings,
                  };
                });
                notify('Ternak ditayangkan di Lapak Jual & Pasar TERMU.', 'success');
              }}
              onOpenRecordWeight={(id) => setWeightModalState({ open: true, animalId: id })}
              onOpenPassport={handleOpenPassport}
              onOpenUpgrade={openUpgradeModal}
              onNotify={notify}
            />
          )}

          {kandangPage === 'kandang' && (
            <KandangPenPage
              db={currentDB}
              subscription={currentSubscription}
              onAddPen={(penData: Omit<Pen, 'id' | 'farm_id'>) => {
                updateCurrentDB((prev) => ({
                  ...prev,
                  pens: [...prev.pens, { ...penData, id: uid('pen'), farm_id: prev.farm.id }],
                }));
                notify(`Sekat ${penData.code} berhasil ditambahkan.`, 'success');
              }}
              onUpdatePen={(penId, patch) => {
                updateCurrentDB((prev) => ({
                  ...prev,
                  pens: prev.pens.map((p) => (p.id === penId ? { ...p, ...patch } : p)),
                }));
              }}
              onToggleTask={handleToggleTask}
              onAddTask={(penId, item) => {
                updateCurrentDB((prev) => ({
                  ...prev,
                  tasks: [
                    {
                      id: uid('tsk'),
                      date: todayISO(),
                      pen_id: penId,
                      item,
                      done: false,
                      done_by: '',
                      done_at: '',
                    },
                    ...prev.tasks,
                  ],
                }));
                notify('Tugas harian ditambahkan.', 'success');
              }}
              onSeedDailyTasks={() => {
                updateCurrentDB((prev) => {
                  const templates = [
                    'Pemberian pakan pagi & cek sisa palungan',
                    'Bersihkan kotoran dan cek saluran air minum',
                    'Observasi nafsu makan & pergerakan ternak sore',
                  ];
                  const firstPen = prev.pens[0]?.id || '';
                  const created = templates.map((item) => ({
                    id: uid('tsk'),
                    date: todayISO(),
                    pen_id: firstPen,
                    item,
                    done: false,
                    done_by: '',
                    done_at: '',
                  }));
                  return { ...prev, tasks: [...created, ...prev.tasks] };
                });
                notify('Daftar tugas rutin hari ini dibuat.', 'success');
              }}
              onOpenUpgrade={openUpgradeModal}
            />
          )}

          {kandangPage === 'pakan' && (
            <PakanPage
              db={currentDB}
              userName={session.name}
              onAddFeed={(item: FeedItem) => {
                updateCurrentDB((prev) => ({ ...prev, feeds: [...prev.feeds, item] }));
                notify(`Bahan pakan ${item.name} ditambahkan.`, 'success');
              }}
              onUpdateFeed={(feedId, patch) => {
                updateCurrentDB((prev) => ({
                  ...prev,
                  feeds: prev.feeds.map((f) => (f.id === feedId ? { ...f, ...patch } : f)),
                }));
              }}
              onSaveRation={(formula: RationFormula) => {
                updateCurrentDB((prev) => {
                  const exists = prev.rations.some((r) => r.id === formula.id);
                  return {
                    ...prev,
                    rations: exists
                      ? prev.rations.map((r) => (r.id === formula.id ? formula : r))
                      : [...prev.rations, formula],
                  };
                });
                notify(`${formula.name} berhasil disimpan.`, 'success');
              }}
              onAddFeedLog={(log: FeedLog) => {
                updateCurrentDB((prev) => ({ ...prev, feed_logs: [...prev.feed_logs, log] }));
                notify('Catatan pemberian pakan harian tersimpan.', 'success');
              }}
              onSaveEstimatedWeight={(animalId, kg) => {
                handleSaveWeight(animalId, kg, todayISO(), 'Estimasi Schoorl');
              }}
            />
          )}

          {kandangPage === 'kesehatan' && (
            <KesehatanPage
              db={currentDB}
              subscription={currentSubscription}
              onToggleSchedule={(id) => {
                updateCurrentDB((prev) => ({
                  ...prev,
                  schedules: prev.schedules.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
                }));
              }}
              onAddSchedule={(item: ScheduleItem) => {
                updateCurrentDB((prev) => ({ ...prev, schedules: [...prev.schedules, item] }));
                notify('Jadwal kesehatan berhasil ditambahkan.', 'success');
              }}
              onAddHealthEvent={(item: HealthEvent) => {
                updateCurrentDB((prev) => ({
                  ...prev,
                  health_events: [...prev.health_events, item],
                }));
                notify('Catatan pengobatan / vaksin tersimpan.', 'success');
              }}
              onAddReproEvent={(item: ReproductionEvent) => {
                updateCurrentDB((prev) => ({
                  ...prev,
                  reproduction_events: [...prev.reproduction_events, item],
                }));
                notify('Catatan reproduksi & HPL tersimpan.', 'success');
              }}
              onConsumeAIQuota={handleConsumeAIQuota}
              onOpenUpgrade={openUpgradeModal}
              onNotify={notify}
            />
          )}

          {kandangPage === 'keuangan' && session.role === 'pemilik' && (
            <KeuanganPage
              db={currentDB}
              onAddTransaction={(tx: Transaction) => {
                updateCurrentDB((prev) => ({ ...prev, transactions: [...prev.transactions, tx] }));
                notify('Transaksi kas berhasil dicatat.', 'success');
              }}
            />
          )}

          {kandangPage === 'jual' && session.role === 'pemilik' && (
            <JualPage
              db={currentDB}
              onUpdateListingPrice={(listingId, price, description) => {
                updateCurrentDB((prev) => ({
                  ...prev,
                  listings: prev.listings.map((l) =>
                    l.id === listingId ? { ...l, price, description } : l
                  ),
                }));
                notify('Harga & keterangan lapak diperbarui.', 'success');
              }}
              onOpenPassport={handleOpenPassport}
              onOpenMarketplace={() => setScreen('marketplace')}
            />
          )}

          {kandangPage === 'pengaturan' && session.role === 'pemilik' && (
            <PengaturanPage
              db={currentDB}
              subscription={currentSubscription}
              onUpdateFarm={(patch: Partial<FarmProfile>) => {
                updateCurrentDB((prev) => ({ ...prev, farm: { ...prev.farm, ...patch } }));
              }}
              onAddWorker={(worker: UserAccount) => {
                updateCurrentDB((prev) => ({ ...prev, users: [...prev.users, worker] }));
                notify(`Akun pekerja ${worker.name} berhasil dibuat.`, 'success');
              }}
              onImportDB={(imported) => {
                updateCurrentDB(() => imported);
              }}
              onGoLanding={() => setScreen('landing')}
              onOpenUpgrade={openUpgradeModal}
              onNotify={notify}
            />
          )}

          {kandangPage === 'ai' && (
            <AIChatPage
              db={currentDB}
              ownerName={session.name}
              role={session.role}
              mode={mode}
              subscription={currentSubscription}
              orders={orders}
              reviews={sellerReviews}
              messages={aiMessages}
              intelligenceLevel={aiIntelligence}
              includeOwnerData={includeOwnerData}
              onChangeIntelligenceLevel={setAiIntelligence}
              onToggleOwnerData={setIncludeOwnerData}
              onAppendMessages={(msgs) => setAiMessages((prev) => [...prev, ...msgs])}
              onResetMessages={() =>
                setAiMessages([
                  {
                    id: uid('msg'),
                    role: 'ai',
                    text: 'Obrolan dimulai ulang. Silakan tanyakan topik apa saja atau minta analisis data kandang & pemilik Anda.',
                    source: 'Chatbot AI TERMU',
                    time: nowTimeStr(),
                  },
                ])
              }
              onConsumeAIQuota={handleConsumeAIQuota}
              onOpenUpgrade={openUpgradeModal}
            />
          )}

          {kandangPage !== 'ai' && (
            <FloatingAIChat
              db={currentDB}
              ownerName={session.name}
              role={session.role}
              mode={mode}
              subscription={currentSubscription}
              orders={orders}
              reviews={sellerReviews}
              messages={aiMessages}
              intelligenceLevel={aiIntelligence}
              includeOwnerData={includeOwnerData}
              onChangeIntelligenceLevel={setAiIntelligence}
              onToggleOwnerData={setIncludeOwnerData}
              onAppendMessages={(msgs) => setAiMessages((prev) => [...prev, ...msgs])}
              onResetMessages={() => setAiMessages([])}
              onConsumeAIQuota={handleConsumeAIQuota}
              onOpenUpgrade={openUpgradeModal}
            />
          )}

          <WhatsAppReportModal
            open={waReportOpen}
            db={currentDB}
            onClose={() => setWaReportOpen(false)}
            onNotify={notify}
          />
          <RecordWeightModal
            key={`${weightModalState.open}-${weightModalState.animalId || 'default'}`}
            open={weightModalState.open}
            db={currentDB}
            defaultAnimalId={weightModalState.animalId}
            onClose={() => setWeightModalState({ open: false, animalId: null })}
            onSaveWeight={handleSaveWeight}
          />
          <QuickAddPenModal
            open={quickPenOpen}
            currentPenCount={currentDB.pens.length}
            tier={currentSubscription.tier}
            onClose={() => setQuickPenOpen(false)}
            onOpenUpgrade={openUpgradeModal}
            onAddPen={(code, name, capacity) => {
              updateCurrentDB((prev) => ({
                ...prev,
                pens: [
                  ...prev.pens,
                  {
                    id: uid('pen'),
                    farm_id: prev.farm.id,
                    code,
                    name,
                    capacity,
                    cleanliness: 'Bersih',
                    water_status: 'Cukup',
                    notes: '',
                  },
                ],
              }));
              notify(`Sekat ${code} berhasil dibuat.`, 'success');
            }}
          />
        </KandangShell>
      )}

      {/* Global Marketplace Checkout Modal */}
      <CheckoutModal
        key={checkoutItem?.id || 'closed'}
        item={checkoutItem}
        sellerReputation={
          checkoutItem
            ? computeSellerReputation(
                resolveSellerProfile(checkoutItem.sellerId, currentDB, catalog),
                sellerReviews,
                catalog.filter((c) => c.sellerId === checkoutItem.sellerId)
              )
            : null
        }
        onClose={() => setCheckoutItem(null)}
        onOrderCreated={handleOrderCreated}
        onOpenSeller={(sellerId) => handleOpenSeller(sellerId)}
        onToast={notify}
      />

      {/* Global Shopee-Style Seller Profile, Rating & Trust Modal */}
      {sellerModalState && (
        <SellerProfileModal
          key={`${sellerModalState.sellerId}-${sellerModalState.tab}-${sellerModalState.openReviewForm ? '1' : '0'}`}
          open={Boolean(sellerModalState)}
          seller={resolveSellerProfile(sellerModalState.sellerId, currentDB, catalog)}
          initialTab={sellerModalState.tab}
          defaultReviewAnimal={sellerModalState.defaultAnimal}
          openReviewFormInitially={sellerModalState.openReviewForm}
          allReviews={sellerReviews}
          sellerListings={catalog.filter((c) => c.sellerId === sellerModalState.sellerId)}
          isFollowed={followedSellers.includes(sellerModalState.sellerId)}
          defaultBuyerName={session?.name || ''}
          onClose={() => setSellerModalState(null)}
          onToggleFollow={handleToggleFollowSeller}
          onAddReview={handleAddSellerReview}
          onOpenPassport={handleOpenPassport}
          onOpenCheckout={(item) => setCheckoutItem(item)}
        />
      )}

      {/* Global QR Passport Modal */}
      <PassportModal
        target={passportTarget}
        subscription={session ? currentSubscription : null}
        onClose={() => setPassportTarget(null)}
        onOpenPublic={handleOpenPublicPassport}
        onConsumeQRPrint={session ? handleConsumeQRPrint : undefined}
        onOpenUpgrade={session ? openUpgradeModal : undefined}
      />

      {/* Global Subscription & Upgrade Modal */}
      {currentDB && (
        <SubscriptionModal
          open={subscriptionModal.open}
          db={currentDB}
          subscription={currentSubscription}
          highlightReason={subscriptionModal.reason}
          onClose={() => setSubscriptionModal({ open: false, reason: null })}
          onActivateTier={handleActivateTier}
        />
      )}

      <ToastStack toasts={toasts} />
    </>
  );
}
