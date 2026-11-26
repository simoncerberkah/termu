import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowUpRight,
  Download,
  Edit3,
  Home,
  QrCode,
  ShieldCheck,
  Store,
  Upload,
  UserPlus,
} from 'lucide-react';
import type {
  FarmDatabase,
  FarmProfile,
  SubscriptionState,
  UserAccount,
} from '../types/termu';
import { getLatestWeight } from '../utils/calculations';
import { downloadTextFile, formatRp, sha256, todayISO, uid } from '../utils/format';
import { canAddWorker, getPlanConfig, normalizeSubscription } from '../utils/subscription';
import { AnimalIllustration } from '../components/BrandLogo';
import { Modal } from '../components/Modal';
import { PlanQuotaSummaryCard } from '../components/SubscriptionModal';

interface JualPageProps {
  db: FarmDatabase;
  onUpdateListingPrice: (listingId: string, price: number, description: string) => void;
  onOpenPassport: (animalId: string) => void;
  onOpenMarketplace: () => void;
}

export function JualPage({
  db,
  onUpdateListingPrice,
  onOpenPassport,
  onOpenMarketplace,
}: JualPageProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const listings = (db.listings || []).map((lst) => ({
    listing: lst,
    animal: db.animals.find((a) => a.id === lst.animal_id) || null,
  })).filter((x) => x.animal && x.animal.status !== 'terjual' && x.animal.status !== 'mati');

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B2B2B]">
            Lapak Jual Kandang
          </h1>
          <p className="text-xs text-[#6E7178] mt-0.5">
            Daftar ternak kandang Anda yang sedang tayang di Pasar TERMU beserta Paspor QR-nya.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenMarketplace}
          className="btn-touch px-5 py-2.5 rounded-full glass-accent text-xs font-bold text-[#2B2B2B] inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Store className="w-4 h-4" /> Buka Pasar TERMU <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="bento-card p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-[#2B2B2B]">Belum ada ternak di lapak jual.</p>
          <p className="text-xs text-[#6E7178]">
            Buka profil ternak di menu <strong>Ternak</strong> lalu klik <strong>Tandai Siap Jual</strong>.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map(({ listing, animal }) => {
            if (!animal) return null;
            const w = getLatestWeight(db, animal);
            return (
              <div key={listing.id} className="bento-card p-4 flex flex-col justify-between gap-3">
                <div>
                  <div className="h-40 rounded-2xl overflow-hidden bg-[#ECE5DC] mb-3 relative">
                    {animal.photo ? (
                      <img src={animal.photo} alt={animal.name} className="w-full h-full object-cover" />
                    ) : (
                      <AnimalIllustration species={animal.species} breed={animal.breed} />
                    )}
                    <span className="absolute top-2.5 left-2.5 glass-caption text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      {animal.id}
                    </span>
                  </div>
                  <h2 className="font-display font-semibold text-base text-[#2B2B2B]">{animal.name}</h2>
                  <p className="text-xs text-[#6E7178]">
                    {animal.species} {animal.breed} • {w} kg
                  </p>
                  <div className="font-display text-xl font-bold text-[#2B2B2B] mt-2 tabular-nums">
                    {formatRp(listing.price)}
                  </div>
                  {listing.description && (
                    <p className="text-[11px] text-[#6E7178] mt-1 line-clamp-2">{listing.description}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setEditId(listing.id);
                      setEditPrice(String(listing.price));
                      setEditDesc(listing.description);
                    }}
                    className="flex-1 py-2 rounded-xl glass-tile hover:bg-white text-xs font-semibold text-[#2B2B2B] inline-flex items-center justify-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Ubah Harga
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPassport(animal.id)}
                    className="flex-1 py-2 rounded-xl bg-[#2B2B2B] text-white text-xs font-semibold inline-flex items-center justify-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Paspor QR
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={Boolean(editId)} title="Perbarui Harga & Keterangan Lapak" onClose={() => setEditId(null)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!editId) return;
            onUpdateListingPrice(editId, Math.max(100000, Number(editPrice) || 0), editDesc.trim());
            setEditId(null);
          }}
          className="space-y-3"
        >
          <div>
            <label htmlFor="lst-price" className="block text-xs font-semibold mb-1">Harga Baru (Rp)</label>
            <input
              id="lst-price"
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
              required
            />
          </div>
          <div>
            <label htmlFor="lst-desc" className="block text-xs font-semibold mb-1">Keterangan</label>
            <textarea
              id="lst-desc"
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
            />
          </div>
          <button type="submit" className="w-full btn-touch rounded-full bg-[#2B2B2B] text-white text-sm font-semibold">
            Simpan Perubahan
          </button>
        </form>
      </Modal>
    </div>
  );
}

interface PengaturanPageProps {
  db: FarmDatabase;
  subscription: SubscriptionState;
  onUpdateFarm: (patch: Partial<FarmProfile>) => void;
  onAddWorker: (worker: UserAccount) => void;
  onImportDB: (imported: FarmDatabase) => void;
  onGoLanding: () => void;
  onOpenUpgrade: (reason?: string) => void;
  onNotify: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function PengaturanPage({
  db,
  subscription,
  onUpdateFarm,
  onAddWorker,
  onImportDB,
  onGoLanding,
  onOpenUpgrade,
  onNotify,
}: PengaturanPageProps) {
  const [farmName, setFarmName] = useState(db.farm.name);
  const [farmLoc, setFarmLoc] = useState(db.farm.location);
  const [farmPhone, setFarmPhone] = useState(db.farm.phone);
  const [dailyBudget, setDailyBudget] = useState(String(db.farm.daily_feed_budget || 500000));
  const normSub = normalizeSubscription(subscription);
  const plan = getPlanConfig(normSub.tier);
  const workerCount = db.users.filter((u) => u.role === 'pekerja').length;

  const [showAddWorker, setShowAddWorker] = useState(false);
  const [wName, setWName] = useState('');
  const [wContact, setWContact] = useState('');
  const [wPass, setWPass] = useState('');

  function handleRequestAddWorker() {
    const check = canAddWorker(workerCount, normSub.tier);
    if (!check.allowed) {
      onOpenUpgrade(check.reason);
      return;
    }
    setShowAddWorker(true);
  }

  function handleSaveFarm(e: FormEvent) {
    e.preventDefault();
    onUpdateFarm({
      name: farmName.trim() || db.farm.name,
      location: farmLoc.trim(),
      phone: farmPhone.trim(),
      daily_feed_budget: Math.max(50000, Number(dailyBudget) || 500000),
    });
    onNotify('Profil peternakan berhasil diperbarui.', 'success');
  }

  async function handleAddWorkerSubmit(e: FormEvent) {
    e.preventDefault();
    const check = canAddWorker(workerCount, normSub.tier);
    if (!check.allowed) {
      setShowAddWorker(false);
      onOpenUpgrade(check.reason);
      return;
    }
    if (!wName.trim() || !wContact.trim() || wPass.length < 4) {
      onNotify('Lengkapi nama, kontak/email, dan kata sandi min. 4 karakter.', 'warning');
      return;
    }
    const hash = await sha256(wPass);
    onAddWorker({
      id: uid('usr'),
      name: wName.trim(),
      contact: wContact.trim().toLowerCase(),
      passwordHash: hash,
      role: 'pekerja',
      createdAt: todayISO(),
    });
    setWName('');
    setWContact('');
    setWPass('');
    setShowAddWorker(false);
  }

  function handleExportBackup() {
    downloadTextFile(
      JSON.stringify(db, null, 2),
      `termu-backup-${todayISO()}.json`,
      'application/json'
    );
    onNotify('Cadangan data JSON berhasil diunduh.', 'success');
  }

  function handleImportBackup(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '')) as FarmDatabase;
        if (!parsed.farm || !Array.isArray(parsed.animals)) {
          throw new Error('Struktur berkas tidak sesuai.');
        }
        onImportDB(parsed);
        onNotify('Cadangan data berhasil dipulihkan.', 'success');
      } catch {
        onNotify('Berkas JSON cadangan tidak valid.', 'error');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B2B2B]">
            Pengaturan Kandang
          </h1>
          <p className="text-xs text-[#6E7178] mt-0.5">
            Atur profil kandang, akun pekerja, serta cadangan data JSON. Layanan AI TERMU terhubung otomatis dari server.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoLanding}
          className="btn-touch px-4 py-2 rounded-full glass-pill text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5 self-start"
        >
          <Home className="w-4 h-4" /> Halaman Depan
        </button>
      </div>

      <PlanQuotaSummaryCard db={db} subscription={subscription} onOpenUpgrade={onOpenUpgrade} />

      <div className="grid lg:grid-cols-12 gap-5">
        {/* Farm Profile */}
        <form onSubmit={handleSaveFarm} className="lg:col-span-6 bento-card p-5 space-y-3.5">
          <h2 className="font-display text-lg font-semibold text-[#2B2B2B]">Profil Peternakan</h2>
          <div>
            <label htmlFor="set-name" className="block text-xs font-semibold mb-1">Nama Kandang / Peternakan</label>
            <input
              id="set-name"
              type="text"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
            />
          </div>
          <div>
            <label htmlFor="set-loc" className="block text-xs font-semibold mb-1">Lokasi (Kecamatan, Kota/Kab)</label>
            <input
              id="set-loc"
              type="text"
              value={farmLoc}
              onChange={(e) => setFarmLoc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="set-phone" className="block text-xs font-semibold mb-1">No. WhatsApp Kandang</label>
              <input
                id="set-phone"
                type="text"
                value={farmPhone}
                onChange={(e) => setFarmPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              />
            </div>
            <div>
              <label htmlFor="set-budget" className="block text-xs font-semibold mb-1">Anggaran Pakan / Hari (Rp)</label>
              <input
                id="set-budget"
                type="number"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm tabular-nums"
              />
            </div>
          </div>
          <button type="submit" className="btn-touch px-6 py-2.5 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold">
            Simpan Profil Kandang
          </button>
        </form>

        {/* Workers & Backup */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bento-card p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#2B2B2B]">Akun Tim &amp; Pekerja</h2>
                <p className="text-[11px] text-[#6E7178]">
                  Kuota pekerja paket {plan.name}: {workerCount}/{plan.maxWorkers === null ? '∞' : plan.maxWorkers} akun
                </p>
              </div>
              <button
                type="button"
                onClick={handleRequestAddWorker}
                className="px-3.5 py-2 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5" /> Tambah Pekerja
              </button>
            </div>
            <div className="space-y-2">
              {db.users.map((u) => (
                <div key={u.id} className="glass-tile rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#2B2B2B]">{u.name}</div>
                    <div className="text-[11px] text-[#6E7178]">{u.contact}</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FBF6E3] text-[10px] font-bold uppercase text-[#2B2B2B]">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bento-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1F7A4D]" />
              <h2 className="font-display text-base font-semibold text-[#2B2B2B]">Cadangan & Pemulihan Data</h2>
            </div>
            <p className="text-xs text-[#6E7178]">
              Unduh seluruh data kandang ke file JSON untuk cadangan, atau pulihkan dari file cadangan sebelumnya.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleExportBackup}
                className="btn-touch px-4 py-2 rounded-full glass-tile hover:bg-white text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Unduh Cadangan JSON
              </button>
              <label className="btn-touch px-4 py-2 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4" /> Pulihkan dari JSON
                <input type="file" accept="application/json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showAddWorker} title="Tambah Akun Pekerja Kandang" onClose={() => setShowAddWorker(false)}>
        <form onSubmit={handleAddWorkerSubmit} className="space-y-3">
          <div>
            <label htmlFor="w-name" className="block text-xs font-semibold mb-1">Nama Pekerja</label>
            <input
              id="w-name"
              type="text"
              value={wName}
              onChange={(e) => setWName(e.target.value)}
              placeholder="Contoh: Mas Eko"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="w-contact" className="block text-xs font-semibold mb-1">Email / No. HP Login</label>
            <input
              id="w-contact"
              type="text"
              value={wContact}
              onChange={(e) => setWContact(e.target.value)}
              placeholder="eko@kandang.id"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="w-pass" className="block text-xs font-semibold mb-1">Kata Sandi</label>
            <input
              id="w-pass"
              type="password"
              value={wPass}
              onChange={(e) => setWPass(e.target.value)}
              placeholder="Minimal 4 karakter"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-black/10 text-sm"
              required
            />
          </div>
          <p className="text-[11px] text-[#6E7178]">
            Pekerja dapat mencatat ternak, bobot, kandang, pakan, dan kesehatan, tetapi tidak dapat membuka Keuangan, Jual, dan Pengaturan.
          </p>
          <button type="submit" className="w-full btn-touch rounded-full bg-[#2B2B2B] text-white text-sm font-semibold">
            Buat Akun Pekerja
          </button>
        </form>
      </Modal>
    </div>
  );
}
