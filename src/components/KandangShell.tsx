import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  Activity,
  Bot,
  Check,
  Copy,
  Crown,
  HeartPulse,
  Home,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Plus,
  RotateCcw,
  Scale,
  Settings,
  Sparkles,
  Store,
  Tag,
  Wallet,
  Warehouse,
  Wheat,
} from 'lucide-react';
import type {
  AppMode,
  AuthSession,
  FarmDatabase,
  KandangPage,
  SubscriptionState,
  SubscriptionTier,
} from '../types/termu';
import { getActiveAnimals, getLatestWeight } from '../utils/calculations';
import { buildWhatsAppUrl, formatDateID, formatRp, todayISO } from '../utils/format';
import {
  canCreatePen,
  formatLimitLabel,
  getPlanConfig,
  normalizeSubscription,
  shouldShowAds,
} from '../utils/subscription';
import { BrandLogo } from './BrandLogo';
import { Modal } from './Modal';
import { FreeTierAdBanner } from './SubscriptionModal';

interface KandangShellProps {
  db: FarmDatabase;
  session: AuthSession;
  mode: AppMode;
  subscription: SubscriptionState;
  activePage: KandangPage;
  onSelectPage: (page: KandangPage) => void;
  onOpenMarketplace: () => void;
  onGoLanding: () => void;
  onResetDemo: () => void;
  onSwitchMode: (targetMode: AppMode) => void;
  onLogout: () => void;
  onOpenQuickAddAnimal: () => void;
  onOpenRecordWeight: () => void;
  onOpenWAReport: () => void;
  onOpenUpgrade: (reason?: string) => void;
  children: ReactNode;
}

export function KandangShell({
  db,
  session,
  mode,
  subscription,
  activePage,
  onSelectPage,
  onOpenMarketplace,
  onGoLanding,
  onResetDemo,
  onSwitchMode,
  onLogout,
  onOpenQuickAddAnimal,
  onOpenRecordWeight,
  onOpenWAReport,
  onOpenUpgrade,
  children,
}: KandangShellProps) {
  const isOwner = session.role === 'pemilik';
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickSheetOpen, setQuickSheetOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const normSub = normalizeSubscription(subscription);
  const plan = getPlanConfig(normSub.tier);
  const showAds = shouldShowAds(normSub.tier);

  const allNavItems: { id: KandangPage; label: string; ownerOnly?: boolean }[] = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'ternak', label: 'Ternak' },
    { id: 'kandang', label: 'Kandang' },
    { id: 'pakan', label: 'Pakan' },
    { id: 'kesehatan', label: 'Kesehatan' },
    { id: 'keuangan', label: 'Keuangan', ownerOnly: true },
    { id: 'jual', label: 'Jual', ownerOnly: true },
    { id: 'ai', label: 'Asisten AI' },
  ];
  const navItems = allNavItems.filter((item) => !item.ownerOnly || isOwner);

  const mobileSubNavItems: { id: KandangPage; label: string; ownerOnly?: boolean }[] = [
    { id: 'ai', label: 'Asisten AI' },
    { id: 'kesehatan', label: 'Kesehatan' },
    { id: 'keuangan', label: 'Keuangan', ownerOnly: true },
    { id: 'jual', label: 'Jual', ownerOnly: true },
    { id: 'pengaturan', label: 'Pengaturan', ownerOnly: true },
  ];
  const visibleMobileSubNav = mobileSubNavItems.filter((item) => !item.ownerOnly || isOwner);

  return (
    <div className="min-h-screen pb-28 lg:pb-12">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 px-3 sm:px-6 pt-2.5 sm:pt-3 pb-2 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand Pill */}
          <button
            type="button"
            onClick={onGoLanding}
            className="h-10 sm:h-11 px-3 sm:px-4 rounded-full glass-pill hover:bg-white flex items-center gap-2 shrink-0 transition"
            aria-label="Kembali ke Halaman Depan TERMU"
          >
            <BrandLogo height={18} color="#2B2B2B" />
          </button>

          {/* Desktop Center Navigation Pill */}
          <nav
            className="hidden lg:flex items-center gap-0.5 p-1 rounded-full glass-pill overflow-x-auto no-scrollbar min-w-0"
            aria-label="Menu Kelola Kandang"
          >
            {navItems.map((item) => {
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectPage(item.id)}
                  className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                    active
                      ? 'bg-[#2B2B2B] text-white shadow-sm'
                      : 'text-[#5A5D64] hover:text-[#2B2B2B] hover:bg-white/70'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls — Clean & Non-Clipped on 360px Mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenUpgrade()}
              className={`h-10 sm:h-11 px-2.5 sm:px-3.5 rounded-full text-[11px] sm:text-xs font-bold inline-flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 transition ${
                normSub.tier === 'free'
                  ? 'bg-[#2B2B2B] hover:bg-black text-[#F5D547]'
                  : 'glass-pill hover:bg-white text-[#2B2B2B]'
              }`}
              title="Kelola paket & kuota TERMU"
            >
              <Crown className={`w-3.5 h-3.5 shrink-0 ${normSub.tier === 'free' ? 'text-[#F5D547]' : 'text-[#B58100]'}`} />
              <span>{normSub.tier === 'free' ? 'Upgrade' : plan.name}</span>
            </button>

            <button
              type="button"
              onClick={onOpenMarketplace}
              className="h-10 sm:h-11 px-2.5 sm:px-3.5 rounded-full glass-accent text-[#2B2B2B] text-[11px] sm:text-xs font-bold inline-flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0"
            >
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Pasar TERMU</span>
              <span className="sm:hidden">Pasar</span>
            </button>

            {isOwner && (
              <button
                type="button"
                onClick={() => onSelectPage('pengaturan')}
                className={`hidden sm:inline-flex w-10 h-10 sm:w-11 sm:h-11 rounded-full items-center justify-center shrink-0 transition ${
                  activePage === 'pengaturan'
                    ? 'bg-[#2B2B2B] text-white'
                    : 'glass-pill text-[#2B2B2B] hover:bg-white'
                }`}
                aria-label="Pengaturan Kandang"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="h-10 sm:h-11 pl-1.5 pr-1.5 sm:px-3 rounded-full glass-pill hover:bg-white flex items-center gap-2 shrink-0 transition"
              aria-label="Profil dan Akun"
            >
              <span className="w-7 h-7 rounded-full bg-[#2B2B2B] text-[#F5D547] text-xs font-bold flex items-center justify-center shrink-0">
                {session.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden xl:inline text-xs font-semibold text-[#2B2B2B] max-w-[90px] truncate">
                {session.name}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Compact Sub-Nav (Secondary Modules — Primary Tabs Sit in Bottom Dock) */}
        <div className="lg:hidden max-w-7xl mx-auto mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {visibleMobileSubNav.map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectPage(item.id)}
                className={`h-8 px-3 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition ${
                  active ? 'bg-[#2B2B2B] text-white shadow-sm' : 'glass-pill text-[#5A5D64]'
                }`}
              >
                {item.id === 'ai' && (
                  <Sparkles className={`w-3 h-3 ${active ? 'text-[#F5D547]' : 'text-[#C29200]'}`} />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-2.5 sm:pt-3">
        {showAds && <FreeTierAdBanner onOpenUpgrade={onOpenUpgrade} />}
        {children}
      </main>

      {/* Mobile Floating Liquid Glass Bottom Dock — Centered max-w-md Capsule (5 items with center +) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1 pointer-events-none no-print"
        aria-label="Navigasi cepat bawah"
      >
        <div className="pointer-events-auto max-w-md mx-auto h-16 px-2 rounded-full glass-dock grid grid-cols-5 items-center">
          <button
            type="button"
            onClick={() => onSelectPage('beranda')}
            className={`h-12 rounded-full flex flex-col items-center justify-center gap-0.5 transition ${
              activePage === 'beranda'
                ? 'bg-[#2B2B2B]/[0.09] text-[#2B2B2B] font-bold'
                : 'text-[#6E7178] font-medium'
            }`}
          >
            <LayoutDashboard className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-none">Beranda</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectPage('ternak')}
            className={`h-12 rounded-full flex flex-col items-center justify-center gap-0.5 transition ${
              activePage === 'ternak'
                ? 'bg-[#2B2B2B]/[0.09] text-[#2B2B2B] font-bold'
                : 'text-[#6E7178] font-medium'
            }`}
          >
            <Activity className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-none">Ternak</span>
          </button>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setQuickSheetOpen(true)}
              className="w-[52px] h-[52px] -mt-6 rounded-full bg-[#2B2B2B] text-[#F5D547] shadow-[0_10px_24px_rgba(43,43,43,0.32)] flex items-center justify-center border-[3px] border-white/95 active:scale-95 transition"
              aria-label="Aksi Cepat Kandang"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onSelectPage('kandang')}
            className={`h-12 rounded-full flex flex-col items-center justify-center gap-0.5 transition ${
              activePage === 'kandang'
                ? 'bg-[#2B2B2B]/[0.09] text-[#2B2B2B] font-bold'
                : 'text-[#6E7178] font-medium'
            }`}
          >
            <Warehouse className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-none">Kandang</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectPage('pakan')}
            className={`h-12 rounded-full flex flex-col items-center justify-center gap-0.5 transition ${
              activePage === 'pakan'
                ? 'bg-[#2B2B2B]/[0.09] text-[#2B2B2B] font-bold'
                : 'text-[#6E7178] font-medium'
            }`}
          >
            <Wheat className="w-[18px] h-[18px]" />
            <span className="text-[10px] leading-none">Pakan</span>
          </button>
        </div>
      </nav>

      {/* Profile & Account Modal */}
      <Modal
        open={profileOpen}
        title="Profil & Mode Kandang"
        subtitle={`${session.name} (${session.contact})`}
        onClose={() => setProfileOpen(false)}
      >
        <div className="space-y-3 text-xs">
          <div className="glass-tile rounded-2xl p-3.5 space-y-1">
            <div className="flex justify-between">
              <span className="text-[#6E7178]">Kandang Aktif</span>
              <strong className="text-[#2B2B2B]">{db.farm.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E7178]">Peran Akses</span>
              <strong className="capitalize text-[#2B2B2B]">{session.role}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E7178]">Mode Data</span>
              <strong className="text-[#2B2B2B]">
                {mode === 'demo' ? 'Mode Demo (Data Contoh)' : 'Mode Peternakan Saya'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E7178]">Paket Langganan</span>
              <strong className="text-[#2B2B2B]">
                {plan.name} ({plan.priceMonthly === 0 ? 'Gratis' : `${formatRp(plan.priceMonthly)}/bln`})
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setProfileOpen(false);
              onOpenUpgrade();
            }}
            className="btn-touch w-full rounded-xl bg-[#2B2B2B] hover:bg-black text-[#F5D547] font-bold inline-flex items-center justify-center gap-1.5"
          >
            <Crown className="w-4 h-4" /> Kelola Paket &amp; Kuota TERMU
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                onSelectPage('pengaturan');
              }}
              className="btn-touch w-full rounded-xl glass-tile hover:bg-white font-semibold text-[#2B2B2B] inline-flex items-center justify-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" /> Pengaturan Kandang
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                onSwitchMode(mode === 'demo' ? 'live' : 'demo');
              }}
              className="btn-touch rounded-xl glass-tile hover:bg-white font-semibold text-[#2B2B2B]"
            >
              {mode === 'demo' ? 'Pindah ke Mode Asli' : 'Buka Mode Demo'}
            </button>
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                onGoLanding();
              }}
              className="btn-touch rounded-xl glass-tile hover:bg-white font-semibold text-[#2B2B2B] inline-flex items-center justify-center gap-1"
            >
              <Home className="w-3.5 h-3.5" /> Halaman Depan
            </button>
          </div>

          {mode === 'demo' && (
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                setResetConfirmOpen(true);
              }}
              className="btn-touch w-full rounded-xl glass-tile hover:bg-white font-semibold text-[#2B2B2B] inline-flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Data Demo ke Awal
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setProfileOpen(false);
              onLogout();
            }}
            className="btn-touch w-full rounded-full bg-[#FCE8E8] hover:bg-[#FAD4D4] text-[#9E2420] font-bold inline-flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Keluar dari Akun
          </button>
        </div>
      </Modal>

      {/* Mobile Quick Action Sheet */}
      <Modal
        open={quickSheetOpen}
        title="Aksi Cepat Kandang"
        subtitle="Pilih catatan yang ingin dibuat sekarang."
        onClose={() => setQuickSheetOpen(false)}
      >
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setQuickSheetOpen(false);
              onOpenQuickAddAnimal();
            }}
            className="p-4 rounded-2xl glass-tile hover:bg-white text-left space-y-1.5"
          >
            <Plus className="w-5 h-5 text-[#2B2B2B]" />
            <div className="font-bold text-[#2B2B2B]">Tambah Ternak</div>
            <div className="text-[11px] text-[#6E7178]">1 ekor / kelompok</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setQuickSheetOpen(false);
              onOpenRecordWeight();
            }}
            className="p-4 rounded-2xl glass-tile hover:bg-white text-left space-y-1.5"
          >
            <Scale className="w-5 h-5 text-[#2B2B2B]" />
            <div className="font-bold text-[#2B2B2B]">Catat Bobot</div>
            <div className="text-[11px] text-[#6E7178]">Timbang / Schoorl</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setQuickSheetOpen(false);
              onSelectPage('kesehatan');
            }}
            className="p-4 rounded-2xl glass-tile hover:bg-white text-left space-y-1.5"
          >
            <HeartPulse className="w-5 h-5 text-[#2B2B2B]" />
            <div className="font-bold text-[#2B2B2B]">Kesehatan & AI</div>
            <div className="text-[11px] text-[#6E7178]">Skrining foto & vaksin</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setQuickSheetOpen(false);
              onOpenWAReport();
            }}
            className="p-4 rounded-2xl glass-accent text-left space-y-1.5"
          >
            <MessageCircle className="w-5 h-5 text-[#2B2B2B]" />
            <div className="font-bold text-[#2B2B2B]">Laporan WA</div>
            <div className="text-[11px] text-[#2B2B2B]/80">Ringkasan otomatis</div>
          </button>
          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => {
                  setQuickSheetOpen(false);
                  onSelectPage('keuangan');
                }}
                className="p-3.5 rounded-2xl glass-tile hover:bg-white text-left space-y-1"
              >
                <Wallet className="w-5 h-5 text-[#2B2B2B]" />
                <div className="font-bold text-[#2B2B2B]">Keuangan</div>
                <div className="text-[11px] text-[#6E7178]">Buku kas &amp; simulasi</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickSheetOpen(false);
                  onSelectPage('jual');
                }}
                className="p-3.5 rounded-2xl glass-tile hover:bg-white text-left space-y-1"
              >
                <Tag className="w-5 h-5 text-[#2B2B2B]" />
                <div className="font-bold text-[#2B2B2B]">Lapak Jual</div>
                <div className="text-[11px] text-[#6E7178]">Kelola harga tayang</div>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setQuickSheetOpen(false);
              onSelectPage('ai');
            }}
            className="p-3.5 rounded-2xl glass-tile hover:bg-white text-left space-y-1"
          >
            <Bot className="w-5 h-5 text-[#C29200]" />
            <div className="font-bold text-[#2B2B2B]">Asisten AI</div>
            <div className="text-[11px] text-[#6E7178]">Tanya data kandang</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setQuickSheetOpen(false);
              onOpenMarketplace();
            }}
            className="p-3.5 rounded-2xl glass-tile hover:bg-white text-left space-y-1"
          >
            <Store className="w-5 h-5 text-[#2B2B2B]" />
            <div className="font-bold text-[#2B2B2B]">Pasar TERMU</div>
            <div className="text-[11px] text-[#6E7178]">Pindah ke pasar ternak</div>
          </button>
        </div>
      </Modal>

      {/* Reset Demo Confirm Modal */}
      <Modal
        open={resetConfirmOpen}
        title="Reset Data Demo ke Awal?"
        subtitle="Semua perubahan Anda di Mode Demo akan dikembalikan ke data awal Kandang Sumber Rejeki."
        onClose={() => setResetConfirmOpen(false)}
      >
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => setResetConfirmOpen(false)}
            className="flex-1 btn-touch rounded-full glass-tile text-xs font-semibold text-[#2B2B2B]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              setResetConfirmOpen(false);
              onResetDemo();
            }}
            className="flex-1 btn-touch rounded-full bg-[#2B2B2B] text-white text-xs font-bold"
          >
            Ya, Reset Demo
          </button>
        </div>
      </Modal>
    </div>
  );
}

interface WhatsAppReportModalProps {
  open: boolean;
  db: FarmDatabase;
  onClose: () => void;
  onNotify: (msg: string, type?: 'success' | 'info') => void;
}

export function WhatsAppReportModal({ open, db, onClose, onNotify }: WhatsAppReportModalProps) {
  const [scope, setScope] = useState<'harian' | 'mingguan'>('harian');
  const today = todayISO();

  const reportText = useMemo(() => {
    const active = getActiveAnimals(db);
    const healthy = active.filter((a) => a.status === 'sehat').length;
    const attention = active.filter((a) => a.status === 'perhatian').length;
    const tasksToday = (db.tasks || []).filter((t) => t.date === today);
    const tasksDone = tasksToday.filter((t) => t.done).length;
    const feedToday = (db.feed_logs || [])
      .filter((l) => l.date === today)
      .reduce((s, x) => s + (Number(x.cost) || 0), 0);

    return [
      `*LAPORAN ${scope === 'harian' ? 'HARIAN' : 'MINGGUAN'} KANDANG — ${db.farm.name.toUpperCase()}*`,
      `Tanggal: ${formatDateID(today)}`,
      `Lokasi: ${db.farm.location || '-'}`,
      '',
      `• Populasi aktif: ${active.length} ekor (Sehat: ${healthy}, Perhatian: ${attention})`,
      `• Tugas harian selesai: ${tasksDone}/${tasksToday.length}`,
      `• Biaya pakan tercatat hari ini: ${formatRp(feedToday)}`,
      `• Ternak siap jual di Pasar TERMU: ${active.filter((a) => a.ready_for_sale).length} ekor`,
      '',
      'Dicatat rapi melalui TERMU — Ternak Terintegrasi & Modern.',
    ].join('\n');
  }, [db, scope, today]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reportText);
      onNotify('Teks laporan berhasil disalin.', 'success');
    } catch {
      onNotify('Salin manual dari kotak teks di atas.', 'info');
    }
  }

  return (
    <Modal open={open} title="Laporan Otomatis WhatsApp" subtitle="Siap kirim ke pemilik atau grup kandang." onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-black/[0.05]">
          <button
            type="button"
            onClick={() => setScope('harian')}
            className={`py-2 rounded-full text-xs font-semibold ${scope === 'harian' ? 'bg-[#2B2B2B] text-white' : 'text-[#6E7178]'}`}
          >
            Ringkasan Harian
          </button>
          <button
            type="button"
            onClick={() => setScope('mingguan')}
            className={`py-2 rounded-full text-xs font-semibold ${scope === 'mingguan' ? 'bg-[#2B2B2B] text-white' : 'text-[#6E7178]'}`}
          >
            Ringkasan Mingguan
          </button>
        </div>

        <pre className="whitespace-pre-wrap font-sans text-xs glass-tile rounded-2xl p-4 text-[#2B2B2B] leading-relaxed">
          {reportText}
        </pre>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 btn-touch rounded-full glass-tile hover:bg-white text-xs font-semibold text-[#2B2B2B] inline-flex items-center justify-center gap-1.5"
          >
            <Copy className="w-4 h-4" /> Salin Teks
          </button>
          <a
            href={buildWhatsAppUrl(db.farm.phone, reportText)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 btn-touch rounded-full bg-[#1F7A4D] hover:bg-[#17613C] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4" /> Kirim ke WA
          </a>
        </div>
      </div>
    </Modal>
  );
}

interface RecordWeightModalProps {
  open: boolean;
  db: FarmDatabase;
  defaultAnimalId: string | null;
  onClose: () => void;
  onSaveWeight: (animalId: string, kg: number, date: string, method: string) => void;
}

export function RecordWeightModal({
  open,
  db,
  defaultAnimalId,
  onClose,
  onSaveWeight,
}: RecordWeightModalProps) {
  const active = useMemo(() => getActiveAnimals(db), [db]);
  const [animalId, setAnimalId] = useState(defaultAnimalId || active[0]?.id || '');
  const selected = active.find((a) => a.id === animalId) || active[0];
  const [kg, setKg] = useState('');
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState('Timbangan Digital');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const targetId = selected?.id;
    const numKg = Number(kg) || 0;
    if (!targetId || numKg <= 0) return;
    onSaveWeight(targetId, numKg, date, method);
    setKg('');
    onClose();
  }

  return (
    <Modal open={open} title="Catat Bobot Ternak" subtitle="Pembaruan bobot otomatis menghitung PBBH terbaru." onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="rw-an" className="block text-xs font-semibold mb-1">Pilih Ternak</label>
          <select
            id="rw-an"
            value={selected?.id || ''}
            onChange={(e) => setAnimalId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
            required
          >
            {active.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} — {a.name} (terakhir {getLatestWeight(db, a)} kg)
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="rw-kg" className="block text-xs font-semibold mb-1">Bobot Baru (kg)</label>
            <input
              id="rw-kg"
              type="number"
              step="0.5"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              placeholder={selected ? String(getLatestWeight(db, selected) + 5) : '350'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
              required
            />
          </div>
          <div>
            <label htmlFor="rw-date" className="block text-xs font-semibold mb-1">Tanggal</label>
            <input
              id="rw-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="rw-method" className="block text-xs font-semibold mb-1">Metode Pengukuran</label>
          <select
            id="rw-method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
          >
            <option value="Timbangan Digital">Timbangan Digital</option>
            <option value="Pita Ukur / Schoorl">Pita Ukur / Schoorl</option>
          </select>
        </div>
        <button type="submit" className="w-full btn-touch rounded-full bg-[#2B2B2B] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5">
          <Check className="w-4 h-4" /> Simpan Bobot Terbaru
        </button>
      </form>
    </Modal>
  );
}

interface QuickAddPenModalProps {
  open: boolean;
  currentPenCount: number;
  tier: SubscriptionTier;
  onClose: () => void;
  onAddPen: (code: string, name: string, capacity: number) => void;
  onOpenUpgrade: (reason?: string) => void;
}

export function QuickAddPenModal({
  open,
  currentPenCount,
  tier,
  onClose,
  onAddPen,
  onOpenUpgrade,
}: QuickAddPenModalProps) {
  const plan = getPlanConfig(tier);
  const [code, setCode] = useState('A1');
  const [name, setName] = useState('Penggemukan Utama');
  const [cap, setCap] = useState(String(plan.maxAnimalsPerPen ?? 10));

  return (
    <Modal
      open={open}
      title="Tambah Sekat Kandang"
      subtitle={`Paket ${plan.name}: ${currentPenCount}/${plan.maxPens === null ? '∞' : plan.maxPens} sekat · maks. ${formatLimitLabel(plan.maxAnimalsPerPen, 'ekor')}/sekat`}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!code.trim() || !name.trim()) return;
          const requestedCap = Math.max(1, Number(cap) || 5);
          const check = canCreatePen({
            currentPenCount,
            requestedCapacity: requestedCap,
            tier,
          });
          if (!check.allowed) {
            onClose();
            onOpenUpgrade(check.reason);
            return;
          }
          onAddPen(code.trim(), name.trim(), requestedCap);
          onClose();
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="qp-code" className="block text-xs font-semibold mb-1">Kode</label>
            <input
              id="qp-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              required
            />
          </div>
          <div className="col-span-2">
            <label htmlFor="qp-name" className="block text-xs font-semibold mb-1">Nama Sekat</label>
            <input
              id="qp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="qp-cap" className="block text-xs font-semibold mb-1">
            Kapasitas (ekor{plan.maxAnimalsPerPen !== null ? `, maks. ${plan.maxAnimalsPerPen}` : ''})
          </label>
          <input
            id="qp-cap"
            type="number"
            min={1}
            max={plan.maxAnimalsPerPen ?? undefined}
            value={cap}
            onChange={(e) => setCap(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
          />
        </div>
        <button type="submit" className="w-full btn-touch rounded-full bg-[#2B2B2B] text-white text-sm font-semibold">
          Simpan Sekat
        </button>
      </form>
    </Modal>
  );
}
