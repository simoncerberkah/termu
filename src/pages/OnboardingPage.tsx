import { useState } from 'react';
import type { FarmDatabase, Species } from '../types/termu';
import { todayISO, uid } from '../utils/format';
import { BrandLogo } from '../components/BrandLogo';

interface OnboardingPageProps {
  db: FarmDatabase;
  onUpdateDB: (updater: (prev: FarmDatabase) => FarmDatabase) => void;
  onToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function OnboardingPage({ db, onUpdateDB, onToast }: OnboardingPageProps) {
  const [step, setStep] = useState(1);
  const [farmName, setFarmName] = useState(db.farm.name === 'Peternakan Saya' ? '' : db.farm.name);
  const [location, setLocation] = useState(db.farm.location);
  const [phone, setPhone] = useState(db.farm.phone);
  const [commodities, setCommodities] = useState<string[]>(db.farm.commodities.length ? db.farm.commodities : ['Sapi Potong']);
  const [penCode, setPenCode] = useState('A1');
  const [penName, setPenName] = useState('Sekat A1 • Penggemukan');
  const [penCap, setPenCap] = useState(10);
  const [anId, setAnId] = useState('SP-001');
  const [anName, setAnName] = useState('');
  const [anSpecies, setAnSpecies] = useState<Species>('Sapi');
  const [anWeight, setAnWeight] = useState('');

  const pct = step * 25;

  const finish = () => {
    onUpdateDB((prev) => ({
      ...prev,
      farm: { ...prev.farm, onboarding_done: true },
    }));
  };

  const toggleCommodity = (com: string) => {
    setCommodities((prev) => {
      if (prev.includes(com)) return prev.length > 1 ? prev.filter((c) => c !== com) : prev;
      return [...prev, com];
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!farmName.trim()) {
        onToast('Isi nama peternakan Anda terlebih dahulu.', 'warning');
        return;
      }
      onUpdateDB((prev) => ({
        ...prev,
        farm: { ...prev.farm, name: farmName.trim(), location: location.trim(), phone: phone.trim() },
      }));
      setStep(2);
    } else if (step === 2) {
      onUpdateDB((prev) => ({
        ...prev,
        farm: { ...prev.farm, commodities },
      }));
      setStep(3);
    } else if (step === 3) {
      onUpdateDB((prev) => {
        if (prev.pens.length > 0) return prev;
        return {
          ...prev,
          pens: [
            {
              id: uid('pen'),
              farm_id: prev.farm.id,
              code: penCode.trim().toUpperCase() || 'A1',
              name: penName.trim() || `Sekat ${penCode}`,
              capacity: Math.max(1, penCap || 10),
              cleanliness: 'Bersih',
              water_status: 'Cukup',
              notes: '',
            },
          ],
        };
      });
      setStep(4);
    } else {
      const wt = Number(anWeight);
      if (anName.trim() && wt > 0) {
        const today = todayISO();
        const id = anId.trim().toUpperCase() || 'SP-001';
        onUpdateDB((prev) => ({
          ...prev,
          farm: { ...prev.farm, onboarding_done: true },
          animals: [
            {
              id,
              farm_id: prev.farm.id,
              name: anName.trim(),
              species: anSpecies,
              breed: anSpecies === 'Sapi' ? 'Lokal / Cross' : 'Lokal',
              sex: 'Jantan',
              birth: '',
              origin: 'Input awal',
              entry_weight: wt,
              entry_date: today,
              pen_id: prev.pens[0]?.id || '',
              status: 'sehat',
              buy_price: 0,
              ready_for_sale: false,
              photo: '',
              notes: '',
            },
            ...prev.animals,
          ],
          weights: [...prev.weights, { id: uid('wt'), animal_id: id, date: today, kg: wt, method: 'Bobot Awal' }],
        }));
      } else {
        finish();
      }
      onToast('Peternakan Anda siap digunakan!', 'success');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg bento-card p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <BrandLogo height={26} color="#2B2B2B" />
          <button type="button" onClick={finish} className="text-xs text-[#6E7178] hover:text-[#2B2B2B] underline">
            Lewati dulu
          </button>
        </div>

        <div className="flex items-center justify-between text-xs mb-2">
          <strong className="text-[#2B2B2B]">Langkah {step} dari 4</strong>
          <span className="text-[#6E7178] tabular-nums">{pct}% selesai</span>
        </div>
        <div className="h-2 rounded-full bg-black/5 overflow-hidden mb-6">
          <div className="h-full bg-[#F5D547] rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>

        {step === 1 && (
          <div className="space-y-3.5">
            <h1 className="font-display text-2xl font-medium text-[#2B2B2B]">Profil Peternakan Anda</h1>
            <p className="text-xs text-[#6E7178]">Data ini tampil di laporan WhatsApp dan Paspor QR ternak Anda.</p>
            <div>
              <label htmlFor="ob-name" className="block text-xs font-medium text-[#5A5D64] mb-1">
                Nama Kandang / Peternakan *
              </label>
              <input
                id="ob-name"
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="Contoh: Kandang Berkah Jaya"
                className="w-full h-11 px-4 rounded-2xl bg-white border border-black/15 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ob-loc" className="block text-xs font-medium text-[#5A5D64] mb-1">
                Lokasi (Kecamatan / Kota)
              </label>
              <input
                id="ob-loc"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Boyolali, Jawa Tengah"
                className="w-full h-11 px-4 rounded-2xl bg-white border border-black/15 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ob-phone" className="block text-xs font-medium text-[#5A5D64] mb-1">
                Nomor WhatsApp Pemilik
              </label>
              <input
                id="ob-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="w-full h-11 px-4 rounded-2xl bg-white border border-black/15 text-sm"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h1 className="font-display text-2xl font-medium text-[#2B2B2B]">Komoditas Ternak Utama</h1>
            <p className="text-xs text-[#6E7178]">Pilih satu atau keduanya agar satuan dan kalkulator disesuaikan.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Sapi Potong', 'Kambing/Domba'].map((com) => {
                const checked = commodities.includes(com);
                return (
                  <button
                    key={com}
                    type="button"
                    onClick={() => toggleCommodity(com)}
                    className={`btn-touch p-4 rounded-3xl border text-left transition ${
                      checked ? 'bg-[#2B2B2B] text-white border-[#2B2B2B]' : 'bg-white text-[#2B2B2B] border-black/15'
                    }`}
                  >
                    <div className="font-semibold text-sm">{com}</div>
                    <div className={`text-[11px] mt-0.5 ${checked ? 'text-[#F5D547]' : 'text-[#6E7178]'}`}>
                      {checked ? 'Dipilih' : 'Ketuk untuk pilih'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3.5">
            <h1 className="font-display text-2xl font-medium text-[#2B2B2B]">Buat Sekat Pertama</h1>
            <p className="text-xs text-[#6E7178]">Sekat memudahkan pencatatan pakan dan checklist harian pekerja.</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="ob-pcode" className="block text-xs font-medium text-[#5A5D64] mb-1">
                  Kode
                </label>
                <input
                  id="ob-pcode"
                  type="text"
                  value={penCode}
                  onChange={(e) => setPenCode(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-2xl bg-white border border-black/15 text-sm font-semibold"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="ob-pname" className="block text-xs font-medium text-[#5A5D64] mb-1">
                  Nama Sekat
                </label>
                <input
                  id="ob-pname"
                  type="text"
                  value={penName}
                  onChange={(e) => setPenName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-2xl bg-white border border-black/15 text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="ob-pcap" className="block text-xs font-medium text-[#5A5D64] mb-1">
                Kapasitas (ekor)
              </label>
              <input
                id="ob-pcap"
                type="number"
                value={penCap}
                min={1}
                onChange={(e) => setPenCap(Number(e.target.value))}
                className="w-full h-11 px-4 rounded-2xl bg-white border border-black/15 text-sm"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h1 className="font-display text-2xl font-medium text-[#2B2B2B]">Tambah Ternak Pertama (Opsional)</h1>
            <p className="text-xs text-[#6E7178]">Isi 1 ekor sekarang atau langsung lanjut ke Dashboard.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ob-anid" className="block text-xs font-medium text-[#5A5D64] mb-1">
                  ID Ternak
                </label>
                <input
                  id="ob-anid"
                  type="text"
                  value={anId}
                  onChange={(e) => setAnId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-2xl bg-white border border-black/15 text-sm"
                />
              </div>
              <div>
                <label htmlFor="ob-anname" className="block text-xs font-medium text-[#5A5D64] mb-1">
                  Nama Panggilan
                </label>
                <input
                  id="ob-anname"
                  type="text"
                  value={anName}
                  onChange={(e) => setAnName(e.target.value)}
                  placeholder="Contoh: Bintang"
                  className="w-full h-11 px-3.5 rounded-2xl bg-white border border-black/15 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ob-ansp" className="block text-xs font-medium text-[#5A5D64] mb-1">
                  Jenis
                </label>
                <select
                  id="ob-ansp"
                  value={anSpecies}
                  onChange={(e) => setAnSpecies(e.target.value as Species)}
                  className="w-full h-11 px-3 rounded-2xl bg-white border border-black/15 text-sm"
                >
                  <option value="Sapi">Sapi</option>
                  <option value="Kambing">Kambing</option>
                  <option value="Domba">Domba</option>
                </select>
              </div>
              <div>
                <label htmlFor="ob-anwt" className="block text-xs font-medium text-[#5A5D64] mb-1">
                  Bobot Masuk (kg)
                </label>
                <input
                  id="ob-anwt"
                  type="number"
                  value={anWeight}
                  onChange={(e) => setAnWeight(e.target.value)}
                  placeholder="320"
                  className="w-full h-11 px-3.5 rounded-2xl bg-white border border-black/15 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-7">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="btn-touch px-5 rounded-full bg-white border border-black/15 text-xs font-semibold text-[#2B2B2B]"
            >
              Kembali
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={handleNext}
            className="btn-touch px-6 rounded-full bg-[#2B2B2B] hover:bg-black text-white text-xs font-semibold"
          >
            {step < 4 ? 'Lanjut' : 'Selesai & Buka Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
