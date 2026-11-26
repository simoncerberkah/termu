import { useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, Plus, Sparkles, Store } from 'lucide-react';
import type { AppScreen, UserRole } from '../types/termu';
import { BrandLogo } from '../components/BrandLogo';

interface LoginPageProps {
  initialTab?: 'login' | 'register';
  onNavigateScreen: (screen: AppScreen) => void;
  onLogin: (contact: string, password: string, remember: boolean) => Promise<{ ok: boolean; error?: string }>;
  onRegister: (payload: {
    name: string;
    contact: string;
    password: string;
    role: UserRole;
  }) => Promise<{ ok: boolean; error?: string }>;
  onDemoLogin: () => Promise<void>;
  onToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function LoginPage({
  initialTab = 'login',
  onNavigateScreen,
  onLogin,
  onRegister,
  onDemoLogin,
  onToast,
}: LoginPageProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('pemilik');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!contact.trim() || password.length < 6) {
      setError('Isi email/WA dan kata sandi minimal 6 karakter.');
      return;
    }
    const res = await onLogin(contact, password, remember);
    if (!res.ok) setError(res.error || 'Gagal masuk.');
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError('Nama lengkap minimal 2 karakter.');
      return;
    }
    if (!contact.trim()) {
      setError('Isi email atau nomor WhatsApp Anda.');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    const res = await onRegister({ name, contact, password, role });
    if (!res.ok) setError(res.error || 'Gagal mendaftar.');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 py-5 sm:py-8 gap-3.5">
      <div className="w-full max-w-[980px] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onNavigateScreen('landing')}
          className="h-10 px-4 rounded-full glass-pill hover:bg-white text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Beranda Super App
        </button>
        <button
          type="button"
          onClick={() => onNavigateScreen('marketplace')}
          className="h-10 px-4 rounded-full glass-pill hover:bg-white text-xs font-semibold text-[#2B2B2B] inline-flex items-center gap-1.5 transition"
        >
          <Store className="w-3.5 h-3.5 text-[#C29200]" /> Jelajah Pasar (Tanpa Login)
        </button>
      </div>

      <div className="w-full max-w-[980px] bento-card rounded-[34px] sm:rounded-[40px] p-3.5 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
        {/* Panel Kiri: Hero Kuning Hangat TERMU */}
        <div className="lg:col-span-6 rounded-[26px] sm:rounded-[30px] bg-gradient-to-br from-[#F5D547]/95 via-[#F8E27D]/90 to-[#FBF3D0]/92 border border-white/80 p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="pointer-events-none absolute -top-16 -right-16 w-60 h-60 rounded-full bg-white/45 blur-2xl" />
          <div className="relative z-10">
            <p className="text-xs font-semibold text-[#2B2B2B]/80 mb-3">Asisten Usaha Peternakan Indonesia</p>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-[40px] font-semibold text-[#2B2B2B] leading-[1.14] tracking-tight">
              Permudah
              <br />
              kelola usaha
              <br />
              <span className="relative inline-block">
                kandang Anda.
                <svg viewBox="0 0 240 16" fill="none" className="w-full h-3.5 -mt-1" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M3 11.5C68 3.5 162 2.5 237 11" stroke="#2B2B2B" strokeWidth="3.2" strokeLinecap="round" opacity="0.85" />
                </svg>
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[#2B2B2B]/80 mt-3.5 max-w-sm leading-relaxed">
              Catat bobot, pakan, kesehatan, dan hitung untung ternak sapi maupun kambing dengan dashboard yang ramah di HP kandang.
            </p>
          </div>

          <div className="relative z-10 mt-6 lg:mt-8 hidden sm:block">
            <svg viewBox="0 0 420 220" className="w-full h-auto max-h-[215px]" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustrasi pemilik dan pekerja peternakan TERMU">
              <ellipse cx="210" cy="206" rx="165" ry="12" fill="#2B2B2B" fillOpacity="0.10" />
              <rect x="24" y="20" width="112" height="54" rx="18" fill="#FFFFFF" fillOpacity="0.85" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx="44" cy="47" r="10" fill="#2B2B2B" />
              <path d="M40 47l3 3 5-6" stroke="#F5D547" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <rect x="62" y="36" width="56" height="7" rx="3.5" fill="#2B2B2B" fillOpacity="0.85" />
              <rect x="62" y="49" width="40" height="6" rx="3" fill="#6E7178" fillOpacity="0.6" />
              <rect x="286" y="14" width="112" height="58" rx="18" fill="#2B2B2B" fillOpacity="0.92" />
              <rect x="302" y="45" width="10" height="16" rx="5" fill="#FFFFFF" fillOpacity="0.35" />
              <rect x="318" y="36" width="10" height="25" rx="5" fill="#FFFFFF" fillOpacity="0.55" />
              <rect x="334" y="40" width="10" height="21" rx="5" fill="#FFFFFF" fillOpacity="0.45" />
              <rect x="350" y="26" width="10" height="35" rx="5" fill="#F5D547" />
              <rect x="366" y="32" width="10" height="29" rx="5" fill="#FFFFFF" fillOpacity="0.4" />
              <g transform="translate(88, 56)">
                <path d="M30 88 C30 68 48 58 70 58 C92 58 110 68 110 88 L116 148 L24 148 Z" fill="#FFFFFF" stroke="#2B2B2B" strokeWidth="2.2" strokeLinejoin="round" />
                <circle cx="70" cy="32" r="21" fill="#F2C8A2" stroke="#2B2B2B" strokeWidth="2" />
                <path d="M49 30 C49 14 60 8 73 9 C86 10 92 18 91 30 C85 21 62 20 49 30 Z" fill="#2B2B2B" />
                <rect x="52" y="96" width="36" height="44" rx="8" fill="#2B2B2B" />
                <rect x="58" y="104" width="24" height="22" rx="4" fill="#F5D547" />
              </g>
              <g transform="translate(218, 60)">
                <path d="M28 84 C28 66 44 56 66 56 C88 56 104 66 104 84 L110 144 L22 144 Z" fill="#2B2B2B" />
                <circle cx="66" cy="30" r="20" fill="#EBBF98" stroke="#2B2B2B" strokeWidth="2" />
                <path d="M46 24 C48 11 58 6 70 7 C82 8 88 15 88 24 Z" fill="#2B2B2B" />
                <path d="M42 24 L94 24" stroke="#2B2B2B" strokeWidth="4" strokeLinecap="round" />
                <rect x="34" y="98" width="38" height="44" rx="8" fill="#FFFFFF" stroke="#2B2B2B" strokeWidth="2" />
                <rect x="44" y="94" width="18" height="7" rx="3.5" fill="#F5D547" stroke="#2B2B2B" strokeWidth="1.5" />
              </g>
            </svg>
          </div>
        </div>

        {/* Panel Kanan: Form Masuk / Daftar */}
        <div className="lg:col-span-6 flex flex-col justify-center px-3 py-4 sm:px-8 sm:py-6 lg:px-10">
          <div className="flex items-center justify-center mb-5">
            <BrandLogo height={40} color="#2B2B2B" />
          </div>

          <div className="text-center mb-5">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2B2B2B] tracking-tight">
              {tab === 'login' ? 'Selamat Datang' : 'Buat Akun Baru'}
            </h1>
            <p className="text-xs sm:text-sm text-[#6E7178] mt-1">
              {tab === 'login' ? 'Silakan masuk ke akun kandang Anda' : 'Catat kandang, hitung untung, ambil keputusan.'}
            </p>
          </div>

          <div className="grid grid-cols-2 p-1 rounded-full glass-tile mb-5">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError('');
              }}
              className={`h-9 rounded-full text-xs font-semibold transition ${
                tab === 'login' ? 'bg-[#2B2B2B] text-white shadow-sm' : 'text-[#6E7178] hover:text-[#2B2B2B]'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError('');
              }}
              className={`h-9 rounded-full text-xs font-semibold transition ${
                tab === 'register' ? 'bg-[#2B2B2B] text-white shadow-sm' : 'text-[#6E7178] hover:text-[#2B2B2B]'
              }`}
            >
              Daftar
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-[#FDECEC]/95 border border-[#F5B7B5] text-xs text-[#9E2420] font-medium">
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <>
              <form onSubmit={handleLoginSubmit} className="space-y-3.5" noValidate>
                <input
                  type="text"
                  aria-label="Email atau nomor WhatsApp"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Email atau nomor WhatsApp"
                  className="w-full h-12 px-4 rounded-2xl bg-white/80 border border-white/90 focus:bg-white text-sm text-[#2B2B2B]"
                  required
                />
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    aria-label="Kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kata sandi"
                    className="w-full h-12 pl-4 pr-12 rounded-2xl bg-white/80 border border-white/90 focus:bg-white text-sm text-[#2B2B2B]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center text-[#6E7178]"
                    aria-label={showPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPass ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs px-1">
                  <label className="flex items-center gap-2 text-[#5A5D64] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="rounded accent-[#2B2B2B]"
                    />
                    Ingat saya
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setContact('demo@termu.id');
                      setPassword('demo123');
                      onToast('Kredensial Pemilik Demo diisi. Tekan Masuk.', 'info');
                    }}
                    className="text-[#5A5D64] hover:text-[#2B2B2B] font-semibold"
                  >
                    Isi akun demo
                  </button>
                </div>
                <button type="submit" className="btn-touch w-full h-12 rounded-2xl glass-accent hover:brightness-95 text-[#2B2B2B] text-sm font-bold">
                  Masuk
                </button>
              </form>

              <div className="mt-4 p-3 rounded-2xl glass-tile text-[11px] text-[#5A5D64] flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-[#2B2B2B]">Akun Demo:</span>{' '}
                  <code className="text-[#2B2B2B]">demo@termu.id</code> / <code className="text-[#2B2B2B]">pekerja@termu.id</code>
                </div>
                <span className="font-semibold text-[#2B2B2B]">sandi: demo123</span>
              </div>
            </>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3" noValidate>
              <input
                type="text"
                aria-label="Nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap (mis. Pak Budi)"
                className="w-full h-12 px-4 rounded-2xl bg-white/80 border border-white/90 focus:bg-white text-sm text-[#2B2B2B]"
                required
              />
              <input
                type="text"
                aria-label="Email atau nomor WhatsApp"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Email atau nomor WhatsApp"
                className="w-full h-12 px-4 rounded-2xl bg-white/80 border border-white/90 focus:bg-white text-sm text-[#2B2B2B]"
                required
              />
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  aria-label="Kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kata sandi (minimal 6 karakter)"
                  className="w-full h-12 pl-4 pr-12 rounded-2xl bg-white/80 border border-white/90 focus:bg-white text-sm text-[#2B2B2B]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center text-[#6E7178]"
                  aria-label={showPass ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPass ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                {(['pemilik', 'pekerja'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`p-3 rounded-2xl border text-left transition ${
                      role === r ? 'bg-[#FBF6E3] border-[#2B2B2B]' : 'glass-tile border-black/10'
                    }`}
                  >
                    <strong className="block text-xs text-[#2B2B2B] capitalize">{r}</strong>
                    <span className="text-[10px] text-[#6E7178]">
                      {r === 'pemilik' ? 'Akses penuh + kas' : 'Input harian kandang'}
                    </span>
                  </button>
                ))}
              </div>
              <button type="submit" className="btn-touch w-full h-12 rounded-2xl glass-accent hover:brightness-95 text-[#2B2B2B] text-sm font-bold">
                Daftar &amp; Mulai dari Nol
              </button>
            </form>
          )}

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-black/10" />
            <span className="text-[11px] font-medium text-[#6E7178]">Atau mulai cepat</span>
            <div className="h-px flex-1 bg-black/10" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onDemoLogin}
              className="btn-touch h-12 px-4 rounded-2xl glass-tile hover:bg-white text-[#2B2B2B] text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#C29200]" />
              Coba Mode Demo
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError('');
              }}
              className="btn-touch h-12 px-4 rounded-2xl glass-tile hover:bg-white text-[#2B2B2B] text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Mulai dari Nol
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
