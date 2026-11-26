import { useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Copy,
  MapPin,
  MessageCircle,
  Printer,
  ShieldCheck,
  Store,
  Truck,
} from 'lucide-react';
import type {
  CheckoutFormValues,
  DeliveryMethod,
  MarketplaceCatalogItem,
  MarketplaceOrder,
  SellerReputationSummary,
} from '../types/termu';
import {
  SHIPPING_FLEETS,
  SHIPPING_REGIONS,
  SHIPPING_SERVICE_FEE,
  calculateCheckoutTotals,
  validateCheckoutForm,
} from '../utils/calculations';
import { buildWhatsAppUrl, daysFromNowISO, formatDateID, formatRp, todayISO } from '../utils/format';
import { AnimalIllustration, BrandLogo } from './BrandLogo';
import { Modal } from './Modal';
import { SellerTrustBadge } from './SellerProfileModal';

interface CheckoutModalProps {
  item: MarketplaceCatalogItem | null;
  sellerReputation?: SellerReputationSummary | null;
  onClose: () => void;
  onOrderCreated: (order: MarketplaceOrder) => void;
  onOpenSeller?: (sellerId: string) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function CheckoutModal({
  item,
  sellerReputation,
  onClose,
  onOrderCreated,
  onOpenSeller,
  onToast,
}: CheckoutModalProps) {
  const [form, setForm] = useState<CheckoutFormValues>({
    buyerName: '',
    buyerPhone: '',
    deliveryMethod: 'delivery',
    fleetId: SHIPPING_FLEETS[0].id,
    regionId: SHIPPING_REGIONS[0].id,
    address: '',
    preferredDate: daysFromNowISO(2),
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmedOrder, setConfirmedOrder] = useState<MarketplaceOrder | null>(null);

  if (!item) return null;

  const breakdown = calculateCheckoutTotals({
    itemPrice: item.price,
    species: item.species,
    deliveryMethod: form.deliveryMethod,
    fleetId: form.fleetId,
    regionId: form.regionId,
  });

  const selectedRegion = SHIPPING_REGIONS.find((r) => r.id === form.regionId) || SHIPPING_REGIONS[0];

  const handleMethodChange = (method: DeliveryMethod) => {
    setForm((prev) => ({ ...prev, deliveryMethod: method }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.address;
      delete next.fleetId;
      delete next.regionId;
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validation = validateCheckoutForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      onToast('Lengkapi data pemesanan yang masih kosong atau belum valid.', 'warning');
      return;
    }

    const orderCode = `TRM-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.floor(10 + Math.random() * 89)}`;
    const newOrder: MarketplaceOrder = {
      orderCode,
      createdAt: todayISO(),
      listingId: item.id,
      sellerId: item.sellerId,
      animalId: item.animal_id,
      animalName: item.name,
      species: item.species,
      breed: item.breed,
      weight: item.weight,
      farmName: item.farmName,
      farmLocation: item.location,
      farmPhone: item.phone,
      buyerName: form.buyerName.trim(),
      buyerPhone: form.buyerPhone.trim(),
      deliveryMethod: form.deliveryMethod,
      fleetId: form.deliveryMethod === 'delivery' ? form.fleetId : 'pickup',
      fleetName: breakdown.fleetName,
      regionId: form.deliveryMethod === 'delivery' ? form.regionId : 'kandang',
      regionName: breakdown.regionName,
      address: form.deliveryMethod === 'delivery' ? form.address.trim() : `Ambil langsung di ${item.farmName} (${item.location})`,
      preferredDate: form.preferredDate || daysFromNowISO(2),
      notes: form.notes.trim(),
      itemPrice: breakdown.itemPrice,
      shippingFee: breakdown.shippingFee,
      serviceFee: breakdown.serviceFee,
      totalAmount: breakdown.totalAmount,
      status: 'Menunggu Konfirmasi Kandang',
      isDemo: item.is_demo,
    };

    onOrderCreated(newOrder);
    setConfirmedOrder(newOrder);
  };

  const buildOrderWAText = (ord: MarketplaceOrder) => {
    return [
      `*KONFIRMASI PESANAN PASAR TERMU*${ord.isDemo ? ' (DATA CONTOH)' : ''}`,
      `Kode Pesanan: ${ord.orderCode}`,
      ``,
      `*Detail Ternak*`,
      `• ${ord.animalName} (${ord.animalId}) — ${ord.species} ${ord.breed}, ${ord.weight} kg`,
      `• Kandang: ${ord.farmName} (${ord.farmLocation})`,
      ``,
      `*Metode Pengambilan / Pengiriman*`,
      ord.deliveryMethod === 'delivery'
        ? `• Pengiriman Hewan: ${ord.fleetName}\n• Daerah Tujuan: ${ord.regionName}\n• Alamat: ${ord.address}`
        : `• Ambil Sendiri langsung ke Kandang (${ord.farmLocation})`,
      `• Rencana Tanggal: ${formatDateID(ord.preferredDate)}`,
      ``,
      `*Rincian Biaya*`,
      `• Harga Ternak: ${formatRp(ord.itemPrice)}`,
      `• Biaya Pengiriman: ${formatRp(ord.shippingFee)}`,
      `• Biaya Layanan: ${formatRp(ord.serviceFee)}`,
      `• *Total Tagihan: ${formatRp(ord.totalAmount)}*`,
      ``,
      `*Data Pemesan*`,
      `• Nama: ${ord.buyerName}`,
      `• WhatsApp: ${ord.buyerPhone}`,
      ord.notes ? `• Catatan: ${ord.notes}` : '',
      ``,
      `Mohon konfirmasi ketersediaan & jadwal serah terima ternak ini. Terima kasih.`,
    ]
      .filter(Boolean)
      .join('\n');
  };

  return (
    <Modal
      open={Boolean(item)}
      title={confirmedOrder ? `Struk Pesanan • ${confirmedOrder.orderCode}` : `Pesan / Checkout • ${item.name}`}
      subtitle={
        confirmedOrder
          ? 'Tersimpan lokal di tab Pesanan Saya • Lanjutkan konfirmasi ke kandang via WhatsApp'
          : `${item.animal_id} • ${item.species} ${item.breed} (${item.weight} kg) • ${item.farmName}`
      }
      maxWidth="max-w-2xl"
      onClose={onClose}
    >
      {confirmedOrder ? (
        <div className="space-y-4 print-card">
          <div className="p-4 rounded-3xl bg-[#E7F6EC] border border-[#1D6E42]/20 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#1D6E42] shrink-0 mt-0.5" />
            <div className="text-xs text-[#1D6E42]">
              <strong className="block text-sm font-bold">Ringkasan Pesanan Siap Dikonfirmasi</strong>
              <span>
                Pesanan Anda telah dicatat dengan kode <strong>{confirmedOrder.orderCode}</strong>. Pembayaran dilakukan
                langsung sesuai kesepakatan dengan peternak ({confirmedOrder.farmName}).
              </span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-black/10 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <BrandLogo height={20} color="#2B2B2B" />
              <div className="text-right">
                <strong className="text-[#2B2B2B] block">{confirmedOrder.orderCode}</strong>
                <span className="text-[11px] text-[#6E7178]">{formatDateID(confirmedOrder.createdAt)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[#6E7178] block">Ternak Dipesan</span>
                <strong className="text-[#2B2B2B] block">
                  {confirmedOrder.animalName} ({confirmedOrder.animalId})
                </strong>
                <span className="text-[#5A5D64]">
                  {confirmedOrder.species} {confirmedOrder.breed} • {confirmedOrder.weight} kg
                </span>
              </div>
              <div>
                <span className="text-[#6E7178] block">Pemesan</span>
                <strong className="text-[#2B2B2B] block">{confirmedOrder.buyerName}</strong>
                <span className="text-[#5A5D64]">{confirmedOrder.buyerPhone}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[#6E7178] block">Metode &amp; Tujuan</span>
                <strong className="text-[#2B2B2B] block">
                  {confirmedOrder.deliveryMethod === 'delivery'
                    ? `Pengiriman Hewan — ${confirmedOrder.fleetName} (${confirmedOrder.regionName})`
                    : 'Ambil Sendiri langsung ke Kandang'}
                </strong>
                <span className="text-[#5A5D64]">{confirmedOrder.address}</span>
                <span className="text-[#6E7178] block mt-0.5">
                  Rencana tanggal: {formatDateID(confirmedOrder.preferredDate)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-black/[0.06] space-y-1.5 tabular-nums">
              <div className="flex justify-between text-[#5A5D64]">
                <span>Harga Ternak</span>
                <strong className="text-[#2B2B2B]">{formatRp(confirmedOrder.itemPrice)}</strong>
              </div>
              <div className="flex justify-between text-[#5A5D64]">
                <span>
                  {confirmedOrder.deliveryMethod === 'delivery'
                    ? `Ongkir (${confirmedOrder.fleetName})`
                    : 'Biaya Pengiriman (Ambil Sendiri)'}
                </span>
                <strong className={confirmedOrder.shippingFee === 0 ? 'text-[#1D6E42]' : 'text-[#2B2B2B]'}>
                  {formatRp(confirmedOrder.shippingFee)}
                </strong>
              </div>
              <div className="flex justify-between text-[#5A5D64]">
                <span>Biaya Layanan Pengiriman</span>
                <strong className={confirmedOrder.serviceFee === 0 ? 'text-[#1D6E42]' : 'text-[#2B2B2B]'}>
                  {formatRp(confirmedOrder.serviceFee)}
                </strong>
              </div>
              <div className="pt-2.5 mt-1 border-t border-black/10 flex justify-between items-baseline">
                <strong className="text-sm text-[#2B2B2B]">Total Tagihan</strong>
                <strong className="font-display text-2xl font-semibold text-[#2B2B2B]">
                  {formatRp(confirmedOrder.totalAmount)}
                </strong>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 no-print">
            <a
              href={buildWhatsAppUrl(confirmedOrder.farmPhone, buildOrderWAText(confirmedOrder))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-touch flex-1 min-w-[200px] px-5 rounded-full bg-[#1D6E42] hover:bg-[#165934] text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" /> Konfirmasi Pesanan via WhatsApp
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(buildOrderWAText(confirmedOrder));
                onToast('Ringkasan pesanan disalin.', 'info');
              }}
              className="btn-touch px-4 rounded-full glass-tile hover:bg-white text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5"
            >
              <Copy className="w-4 h-4" /> Salin
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-touch px-4 rounded-full glass-tile hover:bg-white text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Cetak Struk
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Ringkasan Ternak yang Dipesan + Status Kepercayaan Penjual */}
          <div className="p-3.5 rounded-3xl glass-tile space-y-2.5">
            <div className="flex items-center gap-3.5">
              <div className="w-20 h-16 rounded-2xl overflow-hidden bg-[#EAE5DC] shrink-0">
                {item.photo ? (
                  <img src={item.photo} alt={item.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <AnimalIllustration species={item.species} breed={item.breed} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-base font-semibold text-[#2B2B2B] truncate">
                  {item.name} ({item.animal_id})
                </div>
                <div className="text-[11px] text-[#5A5D64] truncate">
                  {item.species} {item.breed} · {item.weight} kg · {item.farmName}
                </div>
                <div className="text-xs font-bold text-[#2B2B2B] mt-0.5 tabular-nums">
                  {formatRp(item.price)} <span className="font-normal text-[#6E7178]">({formatRp(item.pricePerKg)}/kg)</span>
                </div>
              </div>
            </div>

            {sellerReputation && (
              <div className="pt-2 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex flex-wrap items-center gap-2">
                  <SellerTrustBadge level={sellerReputation.trustLevel} />
                  <span className="text-[#5A5D64] tabular-nums">
                    Rating <strong>{sellerReputation.averageRating.toFixed(1)}</strong> ({sellerReputation.reviewCount} ulasan)
                  </span>
                </div>
                {onOpenSeller && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSeller(item.sellerId);
                    }}
                    className="font-bold text-[#2B2B2B] underline"
                  >
                    Cek Profil Penjual
                  </button>
                )}
              </div>
            )}

            {sellerReputation?.trustLevel === 'perlu_cek' && (
              <p className="text-[11px] text-[#8A4700] bg-[#FFF3DA] rounded-xl px-3 py-2 leading-relaxed">
                Kandang ini berstatus <strong>Perlu Cek Langsung</strong>. Disarankan memilih opsi{' '}
                <strong>Ambil Sendiri ke Kandang</strong> agar dapat memeriksa kondisi hewan secara langsung.
              </p>
            )}
          </div>

          {/* Pilihan Metode: Pengiriman Hewan vs Ambil Sendiri */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-[#2B2B2B]">1. Pilih Metode Pengambilan / Pengiriman</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleMethodChange('delivery')}
                className={`btn-touch p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  form.deliveryMethod === 'delivery'
                    ? 'bg-[#2B2B2B] text-white border-[#2B2B2B] shadow-md'
                    : 'bg-white/80 text-[#2B2B2B] border-black/10 hover:bg-white'
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    form.deliveryMethod === 'delivery' ? 'bg-[#F5D547] text-[#2B2B2B]' : 'bg-[#FBF6E3] text-[#2B2B2B]'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <strong className="block text-xs font-bold">Pengiriman Hewan</strong>
                  <span className={`text-[11px] block mt-0.5 ${form.deliveryMethod === 'delivery' ? 'text-white/75' : 'text-[#6E7178]'}`}>
                    Armada khusus + ongkir daerah + layanan {formatRp(SHIPPING_SERVICE_FEE)}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleMethodChange('pickup')}
                className={`btn-touch p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                  form.deliveryMethod === 'pickup'
                    ? 'bg-[#2B2B2B] text-white border-[#2B2B2B] shadow-md'
                    : 'bg-white/80 text-[#2B2B2B] border-black/10 hover:bg-white'
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    form.deliveryMethod === 'pickup' ? 'bg-[#F5D547] text-[#2B2B2B]' : 'bg-[#E7F6EC] text-[#1D6E42]'
                  }`}
                >
                  <Store className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <strong className="block text-xs font-bold">Ambil Sendiri (ke Kandang)</strong>
                  <span className={`text-[11px] block mt-0.5 ${form.deliveryMethod === 'pickup' ? 'text-[#F5D547]' : 'text-[#1D6E42] font-semibold'}`}>
                    Ongkir Rp 0 · Tanpa biaya layanan (Rp 0)
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Detail Armada & Daerah Tujuan (khusus Pengiriman Hewan) */}
          {form.deliveryMethod === 'delivery' ? (
            <div className="space-y-3.5 p-4 rounded-3xl bg-white/75 border border-black/[0.08]">
              <div>
                <label htmlFor="chk-region" className="block text-xs font-semibold text-[#2B2B2B] mb-1.5">
                  Daerah Tujuan Pengiriman *
                </label>
                <select
                  id="chk-region"
                  value={form.regionId}
                  onChange={(e) => setForm((p) => ({ ...p, regionId: e.target.value }))}
                  className="w-full h-11 px-3.5 rounded-2xl bg-white border border-black/15 text-xs font-medium text-[#2B2B2B]"
                >
                  {SHIPPING_REGIONS.map((reg) => {
                    const base = item.species === 'Sapi' ? reg.baseCowFee : reg.baseSmallFee;
                    return (
                      <option key={reg.id} value={reg.id}>
                        {reg.name} — mulai {formatRp(base)}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-[#6E7178] mt-1">{selectedRegion.distanceNote}</p>
              </div>

              <div>
                <div className="text-xs font-semibold text-[#2B2B2B] mb-1.5">Pilih Layanan / Armada Pengiriman Hewan *</div>
                <div className="space-y-2">
                  {SHIPPING_FLEETS.map((fl) => {
                    const est = calculateCheckoutTotals({
                      itemPrice: item.price,
                      species: item.species,
                      deliveryMethod: 'delivery',
                      fleetId: fl.id,
                      regionId: form.regionId,
                    });
                    const selected = form.fleetId === fl.id;
                    return (
                      <button
                        key={fl.id}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, fleetId: fl.id }))}
                        className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                          selected
                            ? 'bg-[#FBF6E3] border-[#2B2B2B] ring-1 ring-[#2B2B2B]'
                            : 'bg-white border-black/10 hover:border-black/25'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#2B2B2B]">{fl.name}</div>
                          <div className="text-[11px] text-[#5A5D64] mt-0.5">{fl.subtitle}</div>
                          <div className="text-[10px] text-[#6E7178] mt-0.5">{fl.etaLabel}</div>
                        </div>
                        <div className="text-right shrink-0 tabular-nums">
                          <strong className="text-xs font-bold text-[#2B2B2B] block">{formatRp(est.shippingFee)}</strong>
                          <span className="text-[10px] text-[#6E7178]">ongkir armada</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="chk-address" className="block text-xs font-semibold text-[#2B2B2B] mb-1">
                  Alamat Lengkap Tujuan *
                </label>
                <textarea
                  id="chk-address"
                  rows={2}
                  value={form.address}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, address: e.target.value }));
                    if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
                  }}
                  placeholder="Contoh: Jl. Raya Ungaran No. 18, RT 02/RW 04, dekat Pasar Babadan (akses jalan bisa masuk truk)"
                  className="w-full p-3 rounded-2xl bg-white border border-black/15 text-xs text-[#2B2B2B]"
                />
                {errors.address && <p className="text-[11px] text-[#9E2420] font-medium mt-1">{errors.address}</p>}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-3xl bg-[#E7F6EC]/75 border border-[#1D6E42]/20 flex items-start gap-3 text-xs text-[#1D6E42]">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Lokasi Pengambilan di Kandang Penjual</strong>
                <span>
                  {item.farmName} — {item.location}. Bebas ongkir (Rp 0) dan tanpa biaya layanan (Rp 0). Anda dapat
                  mengecek langsung kondisi ternak &amp; Paspor QR di lokasi.
                </span>
              </div>
            </div>
          )}

          {/* Data Pemesan */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#2B2B2B]">2. Data Pemesan</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="chk-name" className="block text-xs font-medium text-[#5A5D64] mb-1">
                  Nama Lengkap Pemesan *
                </label>
                <input
                  id="chk-name"
                  type="text"
                  value={form.buyerName}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, buyerName: e.target.value }));
                    if (errors.buyerName) setErrors((prev) => ({ ...prev, buyerName: '' }));
                  }}
                  placeholder="Contoh: Pak Hendra Wijaya"
                  className="w-full h-11 px-3.5 rounded-2xl bg-white border border-black/15 text-xs text-[#2B2B2B]"
                />
                {errors.buyerName && <p className="text-[11px] text-[#9E2420] font-medium mt-1">{errors.buyerName}</p>}
              </div>
              <div>
                <label htmlFor="chk-phone" className="block text-xs font-medium text-[#5A5D64] mb-1">
                  Nomor WhatsApp Aktif *
                </label>
                <input
                  id="chk-phone"
                  type="tel"
                  value={form.buyerPhone}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, buyerPhone: e.target.value }));
                    if (errors.buyerPhone) setErrors((prev) => ({ ...prev, buyerPhone: '' }));
                  }}
                  placeholder="0812xxxxxxxx"
                  className="w-full h-11 px-3.5 rounded-2xl bg-white border border-black/15 text-xs text-[#2B2B2B]"
                />
                {errors.buyerPhone && <p className="text-[11px] text-[#9E2420] font-medium mt-1">{errors.buyerPhone}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="chk-date" className="block text-xs font-medium text-[#5A5D64] mb-1">
                  Rencana Tanggal {form.deliveryMethod === 'delivery' ? 'Pengiriman' : 'Pengambilan'}
                </label>
                <input
                  id="chk-date"
                  type="date"
                  value={form.preferredDate}
                  min={todayISO()}
                  onChange={(e) => setForm((p) => ({ ...p, preferredDate: e.target.value }))}
                  className="w-full h-11 px-3.5 rounded-2xl bg-white border border-black/15 text-xs text-[#2B2B2B]"
                />
              </div>
              <div>
                <label htmlFor="chk-notes" className="block text-xs font-medium text-[#5A5D64] mb-1">
                  Catatan Tambahan (opsional)
                </label>
                <input
                  id="chk-notes"
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Mis. kirim pagi hari / minta timbang ulang"
                  className="w-full h-11 px-3.5 rounded-2xl bg-white border border-black/15 text-xs text-[#2B2B2B]"
                />
              </div>
            </div>
          </div>

          {/* Rincian Total Tagihan Jujur */}
          <div className="p-4 rounded-3xl bg-[#2B2B2B] text-white space-y-2 text-xs tabular-nums">
            <div className="flex items-center justify-between text-white/75">
              <span>Harga Ternak ({item.name})</span>
              <span className="font-semibold text-white">{formatRp(breakdown.itemPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-white/75">
              <span>
                {form.deliveryMethod === 'delivery'
                  ? `Biaya Pengiriman (${breakdown.fleetName})`
                  : 'Biaya Pengiriman (Ambil Sendiri)'}
              </span>
              <span className={`font-semibold ${breakdown.shippingFee === 0 ? 'text-[#86EFAC]' : 'text-white'}`}>
                {formatRp(breakdown.shippingFee)}
              </span>
            </div>
            <div className="flex items-center justify-between text-white/75">
              <span>Biaya Layanan {form.deliveryMethod === 'pickup' ? '(Gratis untuk Ambil Sendiri)' : '(Pengiriman Hewan)'}</span>
              <span className={`font-semibold ${breakdown.serviceFee === 0 ? 'text-[#86EFAC]' : 'text-[#F5D547]'}`}>
                {formatRp(breakdown.serviceFee)}
              </span>
            </div>
            <div className="pt-2.5 mt-1 border-t border-white/15 flex items-baseline justify-between">
              <div>
                <strong className="text-sm block">Total Tagihan</strong>
                <span className="text-[10px] text-white/60">Transparan tanpa biaya tersembunyi</span>
              </div>
              <strong className="font-display text-2xl font-semibold text-[#F5D547]">
                {formatRp(breakdown.totalAmount)}
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] text-[#5A5D64]">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#1D6E42] shrink-0" />
              Struk pesanan disimpan di perangkat &amp; konfirmasi langsung ke peternak.
            </span>
          </div>

          <button
            type="submit"
            className="btn-touch w-full h-12 rounded-full glass-accent hover:brightness-95 text-[#2B2B2B] text-sm font-bold"
          >
            Buat Pesanan &amp; Lihat Struk ({formatRp(breakdown.totalAmount)})
          </button>
        </form>
      )}
    </Modal>
  );
}
