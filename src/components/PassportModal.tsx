import { Crown, Download, MessageCircle, Printer } from 'lucide-react';
import type {
  AppMode,
  FarmDatabase,
  MarketplaceCatalogItem,
  SubscriptionState,
} from '../types/termu';
import { getActiveWithdrawal, getLatestWeight } from '../utils/calculations';
import {
  buildWhatsAppUrl,
  calcAgeLabel,
  downloadTextFile,
  formatRp,
  generateQRSVG,
  todayISO,
} from '../utils/format';
import {
  canPrintPassportQR,
  getPlanConfig,
  normalizeSubscription,
} from '../utils/subscription';
import { AnimalIllustration, BrandLogo } from './BrandLogo';
import { Modal } from './Modal';

export interface PassportTarget {
  id: string;
  name: string;
  species: 'Sapi' | 'Kambing' | 'Domba';
  breed: string;
  sex: 'Jantan' | 'Betina';
  photo: string;
  weight: number;
  ageLabel: string;
  farmName: string;
  location: string;
  phone: string;
  withdrawalFree: boolean;
  healthCount: number;
  price: number;
  isDemo: boolean;
  mode: AppMode;
}

export function resolvePassportTarget(
  animalId: string,
  db: FarmDatabase | null,
  mode: AppMode,
  catalog: MarketplaceCatalogItem[]
): PassportTarget | null {
  const today = todayISO();
  const an = (db?.animals || []).find((a) => a.id === animalId);
  if (an && db) {
    return {
      id: an.id,
      name: an.name,
      species: an.species,
      breed: an.breed,
      sex: an.sex,
      photo: an.photo || '',
      weight: getLatestWeight(db, an),
      ageLabel: calcAgeLabel(an.birth),
      farmName: db.farm.name,
      location: db.farm.location || 'Indonesia',
      phone: db.farm.phone || '',
      withdrawalFree: !getActiveWithdrawal(db, an.id, today),
      healthCount: (db.health_events || []).filter((e) => e.animal_id === an.id).length,
      price: (db.listings || []).find((l) => l.animal_id === an.id)?.price || 0,
      isDemo: mode === 'demo',
      mode,
    };
  }
  const cat = catalog.find((c) => c.animal_id === animalId || c.id === animalId);
  if (cat) {
    return {
      id: cat.animal_id,
      name: cat.name,
      species: cat.species,
      breed: cat.breed,
      sex: cat.sex,
      photo: cat.photo,
      weight: cat.weight,
      ageLabel: cat.ageLabel,
      farmName: cat.farmName,
      location: cat.location,
      phone: cat.phone,
      withdrawalFree: cat.withdrawalFree,
      healthCount: cat.vaccineCount,
      price: cat.price,
      isDemo: cat.is_demo,
      mode: 'demo',
    };
  }
  return null;
}

interface PassportModalProps {
  target: PassportTarget | null;
  subscription?: SubscriptionState | null;
  onClose: () => void;
  onOpenPublic: (animalId: string, mode: AppMode) => void;
  onConsumeQRPrint?: () => void;
  onOpenUpgrade?: (reason?: string) => void;
}

export function PassportModal({
  target,
  subscription,
  onClose,
  onOpenPublic,
  onConsumeQRPrint,
  onOpenUpgrade,
}: PassportModalProps) {
  if (!target) return null;
  const origin = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://termu.app/';
  const url = `${origin}#paspor=${encodeURIComponent(target.id)}&mode=${target.mode}`;
  const qrSvg = generateQRSVG(url, 185);
  const normSub = subscription ? normalizeSubscription(subscription) : null;
  const plan = normSub ? getPlanConfig(normSub.tier) : null;
  const qrCheck = normSub ? canPrintPassportQR(normSub) : null;

  function handleDownloadSVG() {
    if (qrCheck && !qrCheck.allowed) {
      onClose();
      onOpenUpgrade?.(qrCheck.reason);
      return;
    }
    downloadTextFile(qrSvg, `Paspor-QR-${target!.id}.svg`, 'image/svg+xml;charset=utf-8');
    onConsumeQRPrint?.();
  }

  function handlePrintQR() {
    if (qrCheck && !qrCheck.allowed) {
      onClose();
      onOpenUpgrade?.(qrCheck.reason);
      return;
    }
    onConsumeQRPrint?.();
    window.print();
  }

  return (
    <Modal
      open={Boolean(target)}
      title={`Paspor QR · ${target.name} (${target.id})`}
      subtitle="Dapat dipindai pembeli untuk melihat riwayat bobot & kesehatan transparan"
      maxWidth="max-w-sm"
      onClose={onClose}
    >
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center pt-1">
          <BrandLogo height={24} color="#2B2B2B" />
        </div>
        <div
          className="inline-block p-3 rounded-3xl bg-white border border-black/10 shadow-sm"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        <div className="text-xs text-[#5A5D64]">
          <strong className="text-[#2B2B2B] block">{target.farmName}</strong>
          <span>
            {target.species} {target.breed} · {target.weight} kg
          </span>
        </div>

        {qrCheck && plan && (
          <div className="glass-tile rounded-2xl px-3.5 py-2.5 text-left text-[11px] flex items-center justify-between gap-2">
            <div>
              <div className="text-[#6E7178]">Kuota Cetak QR · Paket {plan.name}</div>
              <strong className={`tabular-nums ${qrCheck.allowed ? 'text-[#2B2B2B]' : 'text-[#9E2420]'}`}>
                {qrCheck.limit === null
                  ? `Terpakai ${qrCheck.used} · Tanpa Batas`
                  : `${qrCheck.used} / ${qrCheck.limit} cetak bulan ini`}
              </strong>
            </div>
            {(plan.id === 'free' || plan.id === 'plus') && onOpenUpgrade && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUpgrade('Upgrade ke paket Pro (75 cetak/bln) atau Enterprise (Tanpa Batas) untuk mencetak Paspor QR lebih banyak.');
                }}
                className="px-2.5 py-1 rounded-full bg-[#2B2B2B] text-[#F5D547] text-[10px] font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <Crown className="w-3 h-3" /> Pro 75/bln
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleDownloadSVG}
            className="btn-touch rounded-full bg-white border border-black/15 text-xs font-semibold text-[#2B2B2B] inline-flex items-center justify-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Unduh SVG
          </button>
          <button
            type="button"
            onClick={handlePrintQR}
            className="btn-touch rounded-full bg-white border border-black/15 text-xs font-semibold text-[#2B2B2B] inline-flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenPublic(target.id, target.mode);
          }}
          className="btn-touch w-full rounded-full bg-[#2B2B2B] hover:bg-black text-white text-xs font-semibold"
        >
          Buka Halaman Publik Pembeli →
        </button>
      </div>
    </Modal>
  );
}

interface PublicPassportViewProps {
  target: PassportTarget | null;
  onClose: () => void;
}

export function PublicPassportView({ target, onClose }: PublicPassportViewProps) {
  if (!target) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bento-card p-8 max-w-sm text-center">
          <h1 className="font-display text-xl font-semibold text-[#2B2B2B]">Paspor Ternak Tidak Ditemukan</h1>
          <p className="text-xs text-[#6E7178] mt-2 mb-5">ID ternak tidak tersedia di penyimpanan perangkat ini.</p>
          <button
            type="button"
            onClick={onClose}
            className="btn-touch px-6 rounded-full bg-[#2B2B2B] text-white text-xs font-semibold"
          >
            Kembali ke TERMU
          </button>
        </div>
      </div>
    );
  }

  const waMsg = `Halo ${target.farmName}, saya melihat Paspor QR ${target.name} (${target.id}, ${target.weight} kg) di TERMU dan ingin menanyakan detailnya.`;

  return (
    <div className="min-h-screen py-6 px-4 flex items-center justify-center">
      <div className="w-full max-w-md bento-card overflow-hidden print-card">
        <div className="px-5 py-3.5 bg-white/85 border-b border-black/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BrandLogo height={24} color="#2B2B2B" />
            <span className="text-[11px] font-semibold text-[#5A5D64]">
              Paspor Ternak{target.isDemo ? ' · data contoh' : ''}
            </span>
          </div>
          <button type="button" onClick={onClose} className="no-print text-xs font-semibold text-[#5A5D64] hover:text-[#2B2B2B] underline">
            Tutup
          </button>
        </div>

        <div className="h-48 relative bg-[#EAE5DC]">
          {target.photo ? (
            <img src={target.photo} alt={target.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            <AnimalIllustration species={target.species} breed={target.breed} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <div className="font-display text-2xl font-medium">
                {target.name} ({target.id})
              </div>
              <div className="text-xs text-white/85">
                {target.species} {target.breed} · {target.sex}
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#F5D547] text-[#2B2B2B] text-xs font-bold tabular-nums">
              {target.weight} kg
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-bold text-[#2B2B2B] text-sm">{target.farmName}</div>
              <div className="text-[#6E7178]">{target.location}</div>
            </div>
            <span
              className={`px-3 py-1 rounded-full font-bold shrink-0 ${
                target.withdrawalFree ? 'bg-[#E7F6EC] text-[#1D6E42]' : 'bg-[#FDECEC] text-[#9E2420]'
              }`}
            >
              {target.withdrawalFree ? 'Bebas Residu Obat' : 'Masa Henti Obat'}
            </span>
          </div>

          {target.price > 0 && (
            <div className="p-3.5 rounded-2xl bg-[#FBF6E3] flex items-center justify-between tabular-nums">
              <div>
                <span className="text-[#5A5D64] block">Harga Penawaran</span>
                <span className="text-[11px] text-[#6E7178]">
                  {formatRp(Math.round(target.price / Math.max(1, target.weight)))} / kg bobot hidup
                </span>
              </div>
              <strong className="font-display text-lg text-[#2B2B2B]">{formatRp(target.price)}</strong>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-white border border-black/5">
              <span className="text-[#6E7178] block">Umur Perkiraan</span>
              <strong className="text-[#2B2B2B]">{target.ageLabel}</strong>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-black/5">
              <span className="text-[#6E7178] block">Riwayat Vaksin/Obat</span>
              <strong className="text-[#2B2B2B]">{target.healthCount} catatan</strong>
            </div>
          </div>

          <a
            href={buildWhatsAppUrl(target.phone, waMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="no-print btn-touch w-full rounded-full bg-[#1D6E42] hover:bg-[#165934] text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" /> Hubungi Peternak via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
