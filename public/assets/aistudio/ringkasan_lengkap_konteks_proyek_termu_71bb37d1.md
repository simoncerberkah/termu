# Konteks Lengkap Proyek Super App "TERMU"

Dokumen ini merangkum seluruh spesifikasi, keputusan desain, riwayat pengembangan, file aktif, serta daftar pekerjaan tersisa dari pembicaraan kita untuk pengembangan prototype web app **TERMU (Ternak Terintegrasi & Modern)**.

---

## 1. Gambaran Produk & Tujuan
- **Nama Produk:** **TERMU** (*Ternak Terintegrasi & Modern*).
- **Fungsi Utama:** Super App ekosistem peternakan sapi potong (penggemukan) dan kambing/domba di Indonesia yang menggabungkan **Manajemen Kandang** dan **Marketplace (Pasar TERMU)**.
- **Target Penggunaan:** Demo ke juri/investor dan uji coba langsung ke peternak di HP kandang (layar mulai `360px`).
- **Prinsip Kualitas:**
  - Terasa seperti produk nyata, cepat, bersih, dan **jujur** (tanpa lorem ipsum, tanpa statistik/testimoni palsu, tanpa klaim akurasi AI, dan tanpa dosis obat otomatis).
  - Seluruh teks antarmuka dalam **Bahasa Indonesia** sederhana.
  - Tombol besar ramah sentuhan (`min-height: 44px`), kontras tinggi, ringan di HP Android *entry-level* (tanpa Three.js/3D/animasi berat).

---

## 2. Tech Stack & Arsitektur Kode
- **Stack:** HTML5 + CSS3 + Vanilla JavaScript, Tailwind CSS (CDN), Lucide Icons, `qrcode-generator` (QR sisi klien), SVG murni untuk grafik & ilustrasi ternak.
- **Format Prototype Saat Ini:** Dikonsolidasikan dalam **1 file `index.html`** dengan struktur modul internal rapi (`PWA`, `Utils`, `Seed`, `Store`, `Marketplace`, `Auth`, `DecisionEngine`, `AIHealthScreener`, `AIChatAssistant`, `UI`, `App`) agar bisa langsung dibuka di preview/offline, dengan rencana dipecah ke multi-file (`/css`, `/js`) dan disambungkan ke **Supabase** di tahap produksi.
- **PWA & Offline:** Menggunakan *manifest* dinamis, favicon SVG, dan deteksi status *online/offline* (data tersimpan di `localStorage`).
- **Isolasi 2 Mode Penyimpanan (Wajib Terpisah Total):**
  1. **Mode Demo (`termu_demo_db_v1`):** Data contoh realistis *"Kandang Sumber Rejeki"* (Semarang Utara), Pemilik **Pak Sigit** (`demo@termu.id` / `demo123`), Pekerja **Naufal** (`pekerja@termu.id` / `demo123`), 4 sekat (`A1–A4`), 32 ternak (24 sapi + 8 kambing/domba), riwayat bobot, 3 ternak perlu perhatian, 5 bahan pakan + 2 formula ransum, buku kas 3 bulan, tugas harian, jadwal, dan listing siap jual. Memiliki *badge* permanen `MODE DEMO • data contoh` dan tombol **Reset data demo**.
  2. **Mode Mulai dari Nol / Live (`termu_live_db_v1`):** Kosong total, ada *onboarding* 4 langkah, *empty state* di tiap halaman, dan checklist *"Mulai dari sini"* di Dashboard.
- **Autentikasi & Peran:**
  - Hash kata sandi dengan **SHA-256** (`crypto.subtle`) + *route guard*.
  - **Pemilik:** Akses penuh (termasuk Keuangan, Jual, Pengaturan, tambah pekerja).
  - **Pekerja:** Akses input harian (Beranda, Ternak, Kandang, Pakan, Kesehatan, Asisten AI), **tanpa Keuangan & Pengaturan**, tetapi **diizinkan menghapus data ternak** (sesuai keputusan pengguna).

---

## 3. Identitas Visual, UI & Branding
- **Gaya Utama:** *Clean Soft Warm Bento-Grid* dipadukan dengan elemen **Apple Liquid Glass** (permukaan kaca translusen berefraksi, *specular highlight* halus, kapsul *pill navigation* satu baris tanpa *wrap*, dan *floating dock* di HP).
- **Palet Warna:**
  - Latar gradien hangat: `#E5E7EB → #F3F0E6 → #FBEFC2`
  - Arang gelap: `#2B2B2B`
  - Kuning aksen: `#F5D547`
  - Krem lembut: `#FBF6E3`
  - Status: Hijau lembut (sehat), Oranye (perhatian), Merah lembut (sakit/masa henti obat).
- **Tipografi:** `Outfit` (bobot tipis/light untuk angka metrik besar) & `Plus Jakarta Sans` (teks UI).
- **Logo Resmi TERMU:**
  - Diubah mengikuti gambar unggahan terakhir dari pengguna: *wordmark* `TERMU` ultra-bold membulat berwarna hitam arang `#2B2B2B` tanpa latar belakang, dengan potongan *negative-space* **kepala sapi** di antara huruf **R** dan **M**, serta **motif daun melengkung bertulang daun** di dalam lengkungan bawah kanan huruf **M**.
  - Diimplementasikan sebagai komponen reusable `UI.brandLogo()` dan juga dipakai pada favicon/ikon PWA.
- **Halaman Login:** Tata letak *split 2 kolom* mengikuti referensi gambar (panel ilustrasi gradien kuning hangat di kiri + formulir Masuk/Daftar bersih di kanan, dilengkapi tombol *Coba Mode Demo* dan *Mulai dari Nol*).

---

## 4. Arsitektur Super App & Daftar Fitur yang Sudah Dibangun

### A. Pintu Masuk Super App
1. **Landing Page Super App (`viewLanding`):**
   - Halaman pertama saat web dibuka, menampilkan 2 portal besar:
     - **Pintu 1 — Kelola Kandang:** Mengarah ke halaman Login/Daftar (atau langsung ke Dashboard jika sudah login).
     - **Pintu 2 — Pasar TERMU:** Langsung membuka katalog marketplace **tanpa perlu login**.
   - Dilengkapi etalase 4 ternak pilihan dan 3 pilar transparansi (Dicatat di Kandang → Paspor QR → Transaksi Langsung).
   - Ada saklar lintas modul **`[ Kandang ⇄ Pasar ]`** di header.

2. **Pasar TERMU / Marketplace (`viewMarketplace`):**
   - Menggabungkan ternak siap jual dari kandang aktif secara *real-time* + 6 listing contoh dari kandang mitra sekitar (**Boyolali, Kendal, Demak** — berlabel jelas `data contoh`).
   - Fitur pembeli: pencarian, filter jenis/kota/rentang bobot, pengurutan (terbaru, harga/kg termurah, harga total, bobot terbesar), kalkulasi otomatis **Harga/kg bobot hidup**, **Simpan Favorit (♥)** di `localStorage`, **Bandingkan 2 Ternak** berdampingan, **Paspor QR**, dan tombol WhatsApp penjual.

### B. Modul Manajemen Kandang (Di Balik Login)
1. **Beranda (Dashboard Bento):** Sapaan, 3 metrik besar, 4 *progress pill*, kartu sorotan ternak, grafik batang bobot mingguan bertitik, cincin progres biaya pakan harian, kartu gelap *Tugas Hari Ini* (interaktif), *Jadwal Minggu Ini*, *Saran Hari Ini* (Asisten Keputusan berbasis aturan), dan tombol laporan WhatsApp.
2. **Ternak:** Daftar & filter, tambah satuan (dengan kompresi foto kamera/galeri), tambah massal *mode kelompok*, **hapus ternak** (bisa dilakukan Pemilik & Pekerja dengan konfirmasi + hapus data terkait), profil ternak lengkap (grafik bobot SVG, kesehatan, pakan, reproduksi), mutasi (pindah sekat/status/jual/mati), tandai *Siap Jual*, serta **Paspor QR** (unduh SVG, cetak, buka halaman publik pembeli via `#paspor=...`).
3. **Kandang:** Denah kartu per sekat (kapasitas, kebersihan, air minum, catatan), edit sekat, dan checklist harian pekerja yang mencatat nama & jam selesai.
4. **Pakan & Biaya:** Tab *Bahan & Stok* (edit harga & stok *inline*, peringatan habis `±N hari`), *Mixer Ransum* perbandingan Formula A vs B (PK%, TDN%, biaya/kg, biaya/ekor/hari), *Catat Harian*, dan *Kalkulator Bobot (Rumus Schoorl) & HPP* (hasil ukur bisa langsung disimpan ke riwayat bobot ternak).
5. **Kesehatan:** Jadwal & pengingat, log sakit/pengobatan dengan pelacak **masa henti obat** (menahan penjualan otomatis), pencatatan reproduksi (estimasi lahir otomatis), dan **Skrining Foto AI** (disclaimer wajib, tanpa dosis obat, tombol kirim ke dokter hewan via WA).
6. **Keuangan (Khusus Pemilik):** Buku kas pemasukan/pengeluaran, simulasi **Waktu Jual Terbaik**, ekspor **CSV** dan **Cetak/PDF**.
7. **Asisten AI Chat & Prediksi:** Tersedia sebagai halaman menu (`Asisten AI`) sekaligus **tombol chat mengambang Liquid Glass (`Tanya AI`)** di seluruh halaman. Membaca data kandang secara langsung untuk memprediksi bobot +30/+60 hari, kandidat jual terdekat, hari habisnya stok pakan, dan pantauan kesehatan (terhubung Gemini API + *fallback* analisis lokal saat *offline*).
8. **Jual & Pengaturan (Khusus Pemilik):** Kelola lapak kandang, profil peternakan, tambah akun pekerja, input Gemini API Key opsional, ekspor/impor backup JSON, serta ganti/reset mode.

---

## 5. Daftar File (Artifacts) yang Sudah Dibuat
1. **`index.html`** — Aplikasi prototype Super App TERMU lengkap (single-file modular).
2. **`termu_superapp_blueprint.md`** — Dokumen hasil brainstorming arsitektur Super App & perbandingan single-file vs multi-file.
3. **`panduan_ai_github.md`** — Panduan penyebab AI tidak jalan saat di-upload ke GitHub Pages + tutorial lengkap aktivasi via **BYOK (Pengaturan)** atau **Cloudflare Workers Proxy Gratis**.

---

## 6. Kendala Terakhir & Pekerjaan yang Belum Selesai (Next Steps)

Berikut **3 hal penting** yang sedang dalam antrean untuk langsung dikerjakan berikutnya:

1. **Fitur Checkout / Pemesanan di Pasar TERMU (Permintaan Terakhir Pengguna — Belum Dibangun):**
   - Tambahkan tombol **Pesan / Checkout** pada kartu ternak di Pasar TERMU.
   - Opsi metode pengambilan/pengiriman:
     - **Pengiriman Hewan:** Menampilkan pilihan **layanan/armada pengiriman hewan** + **biaya pengiriman sesuai daerah tujuan** + **biaya layanan Rp 10.000**.
     - **Ambil Sendiri (ke Kandang):** Biaya pengiriman **Rp 0** dan **tanpa biaya layanan (Rp 0)**.
   - Tampilkan rincian total tagihan jujur, formulir data pemesan, ringkasan pesanan/struk lokal, serta opsi lanjut konfirmasi via WhatsApp.
2. **Perbaikan AI di GitHub Pages & Deteksi Penyakit Foto Nyata:**
   - Menambahkan dukungan **URL Proxy Cloudflare Workers** (selain input API Key di Pengaturan) agar AI bisa aktif untuk publik di GitHub Pages tanpa membocorkan API Key.
   - Memperbarui pemanggilan model Gemini agar memakai model aktif terbaru dengan *fallback* otomatis serta memperbaiki tab **Skrining Foto AI** agar tidak selalu jatuh ke mode simulasi dan menampilkan status/eror koneksi secara transparan.
3. **Pembersihan File `index.html`:**
   - Menghapus penanda markdown (```` ```html ```` di baris pertama dan ```` ``` ```` di baris terakhir) yang masih terselip di dalam `index.html` agar bersih 100% saat diunduh dan di-upload ke GitHub Pages.