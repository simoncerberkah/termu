import type {
  FarmDatabase,
  MarketplaceCatalogItem,
  SellerProfile,
  SellerReputationSummary,
  SellerReview,
  SellerTrustLevel,
  SellerTrustReason,
} from '../types/termu';

export const DEFAULT_SELLER_PROFILES: Record<string, SellerProfile> = {
  seller_own: {
    id: 'seller_own',
    farmName: 'Kandang Sumber Rejeki',
    ownerName: 'Pak Sigit',
    city: 'Semarang',
    location: 'Semarang Utara, Jawa Tengah',
    phone: '081234567890',
    joinedSince: '2023',
    activeStatusLabel: 'Aktif 8 menit lalu',
    responseRate: 97,
    responseTimeLabel: '< 15 menit',
    completedSales: 48,
    onTimeDeliveryRate: 98,
    identityVerified: true,
    vetPartnerVerified: true,
    bio: 'Kandang penggemukan sapi Limousin, Simental, dan kambing Jawa Randu berbasis catatan bobot digital & Paspor QR rutin setiap 2 minggu.',
    specialties: ['Sapi Limousin & Simental', 'Kambing Jawa Randu', 'Paspor QR Rutin'],
    baseFollowers: 214,
    isOwnFarm: true,
    isDemo: true,
  },
  seller_merapi: {
    id: 'seller_merapi',
    farmName: 'Kandang Merapi Jaya',
    ownerName: 'H. Bambang Sutrisno',
    city: 'Boyolali',
    location: 'Ampel, Boyolali, Jawa Tengah',
    phone: '081229001122',
    joinedSince: '2022',
    activeStatusLabel: 'Aktif 4 menit lalu',
    responseRate: 99,
    responseTimeLabel: '< 10 menit',
    completedSales: 86,
    onTimeDeliveryRate: 99,
    identityVerified: true,
    vetPartnerVerified: true,
    bio: 'Mitra penggemukan sapi potong lereng Merapi dengan pakan rumput odot + konsentrat 16% terukur dan kontrol mantri hewan mingguan.',
    specialties: ['Sapi Limousin Super', 'Siap Kurban & Potong', 'Kirim Armada Truk'],
    baseFollowers: 389,
    isDemo: true,
  },
  seller_kaliwungu: {
    id: 'seller_kaliwungu',
    farmName: 'Berkah Ternak Kaliwungu',
    ownerName: 'Mas Arifin',
    city: 'Kendal',
    location: 'Kaliwungu, Kendal, Jawa Tengah',
    phone: '081325440099',
    joinedSince: '2023',
    activeStatusLabel: 'Aktif 18 menit lalu',
    responseRate: 95,
    responseTimeLabel: '< 20 menit',
    completedSales: 37,
    onTimeDeliveryRate: 96,
    identityVerified: true,
    vetPartnerVerified: true,
    bio: 'Fokus sapi Simental dan bakalan sehat siap finishing. Pembeli bebas cek langsung di kandang dan timbang ulang sebelum muat.',
    specialties: ['Sapi Simental', 'Timbang Ulang di Tempat', 'Vaksin PMK Lengkap'],
    baseFollowers: 178,
    isDemo: true,
  },
  seller_tani_demak: {
    id: 'seller_tani_demak',
    farmName: 'Tani Makmur Demak',
    ownerName: 'Pak Slamet Riyadi',
    city: 'Demak',
    location: 'Mranggen, Demak, Jawa Tengah',
    phone: '085640112233',
    joinedSince: '2024',
    activeStatusLabel: 'Aktif 1 jam lalu',
    responseRate: 88,
    responseTimeLabel: '± 45 menit',
    completedSales: 14,
    onTimeDeliveryRate: 92,
    identityVerified: true,
    vetPartnerVerified: false,
    bio: 'Kelompok tani ternak sapi PO lokal adaptif hijauan sawah. Melayani ambil sendiri di kandang maupun antar area Demak–Semarang.',
    specialties: ['Sapi PO Murni', 'Hijauan Lokal', 'Ambil Sendiri'],
    baseFollowers: 64,
    isDemo: true,
  },
  seller_merbabu: {
    id: 'seller_merbabu',
    farmName: 'Kandang Lereng Merbabu',
    ownerName: 'Ibu Endang Lestari',
    city: 'Boyolali',
    location: 'Selo, Boyolali, Jawa Tengah',
    phone: '081229004455',
    joinedSince: '2024',
    activeStatusLabel: 'Aktif 32 menit lalu',
    responseRate: 91,
    responseTimeLabel: '± 30 menit',
    completedSales: 19,
    onTimeDeliveryRate: 94,
    identityVerified: true,
    vetPartnerVerified: false,
    bio: 'Peternakan kambing Etawa Cross kandang panggung udara sejuk dataran tinggi. Cocok untuk bibit maupun aqiqah.',
    specialties: ['Etawa Cross', 'Kandang Panggung Bersih', 'Aqiqah & Bibit'],
    baseFollowers: 92,
    isDemo: true,
  },
  seller_boja: {
    id: 'seller_boja',
    farmName: 'Domba Unggul Boja',
    ownerName: 'Kang Dedi Kurniawan',
    city: 'Kendal',
    location: 'Boja, Kendal, Jawa Tengah',
    phone: '081390887766',
    joinedSince: '2023',
    activeStatusLabel: 'Aktif 12 menit lalu',
    responseRate: 96,
    responseTimeLabel: '< 15 menit',
    completedSales: 54,
    onTimeDeliveryRate: 97,
    identityVerified: true,
    vetPartnerVerified: true,
    bio: 'Spesialis domba Texel dan bakalan silase berkualitas dengan berat karkas padat. Garansi kondisi sehat sampai tujuan.',
    specialties: ['Domba Texel', 'Pakan Silase', 'Siap Antar Jateng'],
    baseFollowers: 245,
    isDemo: true,
  },
  seller_barokah_demak: {
    id: 'seller_barokah_demak',
    farmName: 'Sumber Barokah Demak',
    ownerName: 'Pak Rohmad',
    city: 'Demak',
    location: 'Karangawen, Demak, Jawa Tengah',
    phone: '085727665544',
    joinedSince: '2025',
    activeStatusLabel: 'Aktif 6 jam lalu',
    responseRate: 74,
    responseTimeLabel: '2–4 jam',
    completedSales: 4,
    onTimeDeliveryRate: 80,
    identityVerified: false,
    vetPartnerVerified: false,
    bio: 'Kandang baru bergabung di Pasar TERMU untuk domba Garut & lokal. Disarankan cek kondisi fisik langsung ke kandang sebelum pembayaran penuh.',
    specialties: ['Domba Garut', 'Kandang Baru', 'Cek Langsung'],
    baseFollowers: 19,
    isDemo: true,
  },
};

export const DEFAULT_SELLER_REVIEWS: SellerReview[] = [
  {
    id: 'rev_own_1',
    sellerId: 'seller_own',
    buyerName: 'Hendra Wijaya (Semarang)',
    rating: 5,
    comment: 'Bobot pas ditimbang ulang di kandang sesuai banget dengan Paspor QR. Pak Sigit transparan soal riwayat vaksin dan pakan.',
    animalPurchased: 'Bima (SP-001) · Sapi Limousin Cross',
    date: '2026-10-18',
    verifiedPurchase: true,
  },
  {
    id: 'rev_own_2',
    sellerId: 'seller_own',
    buyerName: 'Panitia Kurban Al-Ikhlas',
    rating: 5,
    comment: 'Ambil 2 ekor Simental, pengiriman rapi pakai truk berpagar dan sapi datang dalam kondisi tenang tidak stres.',
    animalPurchased: 'Gagah (SP-002) · Sapi Simental',
    date: '2026-09-29',
    verifiedPurchase: true,
  },
  {
    id: 'rev_own_3',
    sellerId: 'seller_own',
    buyerName: 'Rizky Pratama',
    rating: 4,
    comment: 'Kambing Jawa Randu sehat dan lincah. Respon WA cepat, hanya jadwal jemput kemarin mundur 30 menit karena hujan.',
    animalPurchased: 'Kliwon (KB-001) · Kambing Jawa Randu',
    date: '2026-09-12',
    verifiedPurchase: true,
  },
  {
    id: 'rev_merapi_1',
    sellerId: 'seller_merapi',
    buyerName: 'UD Daging Berkah Solo',
    rating: 5,
    comment: 'Sudah langganan 4 kali ambil sapi di Kandang Merapi Jaya. PBBH terukur, bobot riil akurat, surat sehat & Paspor QR lengkap.',
    animalPurchased: 'Mahesa (BYL-104) · Sapi Limousin Cross',
    date: '2026-10-21',
    verifiedPurchase: true,
  },
  {
    id: 'rev_merapi_2',
    sellerId: 'seller_merapi',
    buyerName: 'Bagus Santoso',
    rating: 5,
    comment: 'Pelayanan seperti toko resmi, respon kurang dari 10 menit dan dikirim video penimbangan live sebelum berangkat.',
    animalPurchased: 'Sapi Limousin 530 kg',
    date: '2026-10-04',
    verifiedPurchase: true,
  },
  {
    id: 'rev_merapi_3',
    sellerId: 'seller_merapi',
    buyerName: 'Koperasi Tani Klaten',
    rating: 5,
    comment: 'Kandang sangat bersih dan terorganisir. Bebas residu obat jadi aman langsung potong.',
    animalPurchased: 'Sapi Simental 510 kg',
    date: '2026-09-19',
    verifiedPurchase: true,
  },
  {
    id: 'rev_kaliwungu_1',
    sellerId: 'seller_kaliwungu',
    buyerName: 'Ahmad Fauzi (Kendal)',
    rating: 5,
    comment: 'Boleh cek langsung dan timbang ulang sebelum DP lunas. Sapi Simental posturnya panjang & kuku sehat.',
    animalPurchased: 'Prasetyo (KDL-028) · Sapi Simental',
    date: '2026-10-14',
    verifiedPurchase: true,
  },
  {
    id: 'rev_kaliwungu_2',
    sellerId: 'seller_kaliwungu',
    buyerName: 'Siti Aminah',
    rating: 5,
    comment: 'Mas Arifin ramah menjelaskan ransum harian agar sapi tidak kaget saat pindah kandang.',
    animalPurchased: 'Sapi Simental 480 kg',
    date: '2026-09-25',
    verifiedPurchase: true,
  },
  {
    id: 'rev_tani_demak_1',
    sellerId: 'seller_tani_demak',
    buyerName: 'Mulyono (Demak)',
    rating: 5,
    comment: 'Sapi PO tangguh, cocok buat penggemukan lanjutan. Harga per kg bersahabat.',
    animalPurchased: 'Surya PO (DMK-055) · Sapi PO',
    date: '2026-10-09',
    verifiedPurchase: true,
  },
  {
    id: 'rev_tani_demak_2',
    sellerId: 'seller_tani_demak',
    buyerName: 'Dwi Hartono',
    rating: 4,
    comment: 'Ternak bagus sesuai foto, cuma balas WA agak sore karena Pak Slamet sedang ngarit di sawah.',
    animalPurchased: 'Sapi PO 435 kg',
    date: '2026-09-21',
    verifiedPurchase: true,
  },
  {
    id: 'rev_merbabu_1',
    sellerId: 'seller_merbabu',
    buyerName: 'Nadia Kusuma',
    rating: 5,
    comment: 'Kambing Etawa Cross bersih tidak bau, bulu halus. Ibu Endang bantu carikan pikap langganan.',
    animalPurchased: 'Sakti Etawa (BYL-209) · Kambing Etawa Cross',
    date: '2026-10-11',
    verifiedPurchase: true,
  },
  {
    id: 'rev_merbabu_2',
    sellerId: 'seller_merbabu',
    buyerName: 'Yusuf Hakim',
    rating: 4,
    comment: 'Kualitas hewan mantap, catatan vaksin rapi. Lokasi agak menanjak kalau ambil sendiri pakai mobil kecil.',
    animalPurchased: 'Etawa Cross 44 kg',
    date: '2026-09-16',
    verifiedPurchase: true,
  },
  {
    id: 'rev_boja_1',
    sellerId: 'seller_boja',
    buyerName: 'Catering Aqiqah Amanah',
    rating: 5,
    comment: 'Domba Texel dagingnya tebal dan tidak bau prengus. Pengiriman tepat waktu pagi hari sesuai janji.',
    animalPurchased: 'Bintang Texel (KDL-071) · Domba Texel',
    date: '2026-10-20',
    verifiedPurchase: true,
  },
  {
    id: 'rev_boja_2',
    sellerId: 'seller_boja',
    buyerName: 'Wahyu Nugroho',
    rating: 5,
    comment: 'Paspor QR lengkap dari bobot masuk sampai sekarang. Penjual jujur dan komunikatif.',
    animalPurchased: 'Domba Texel 40 kg',
    date: '2026-10-02',
    verifiedPurchase: true,
  },
  {
    id: 'rev_barokah_1',
    sellerId: 'seller_barokah_demak',
    buyerName: 'Suyanto',
    rating: 4,
    comment: 'Domba sehat dan harga murah, tapi catatan timbang masih manual sehingga lebih aman timbang langsung di lokasi.',
    animalPurchased: 'Raja Garut (DMK-088) · Domba Garut',
    date: '2026-10-06',
    verifiedPurchase: true,
  },
  {
    id: 'rev_barokah_2',
    sellerId: 'seller_barokah_demak',
    buyerName: 'Fajar Sidik',
    rating: 3,
    comment: 'Hewan sesuai jenis, namun konfirmasi jadwal jemput agak lama dan belum ada surat dokter hewan.',
    animalPurchased: 'Domba Lokal 35 kg',
    date: '2026-09-28',
    verifiedPurchase: false,
  },
];

export function inferSellerIdFromFarmName(farmName: string): string {
  const n = (farmName || '').toLowerCase();
  if (n.includes('merapi')) return 'seller_merapi';
  if (n.includes('kaliwungu')) return 'seller_kaliwungu';
  if (n.includes('tani makmur')) return 'seller_tani_demak';
  if (n.includes('merbabu')) return 'seller_merbabu';
  if (n.includes('boja')) return 'seller_boja';
  if (n.includes('barokah')) return 'seller_barokah_demak';
  return 'seller_own';
}

export function resolveSellerProfile(
  sellerId: string,
  db: FarmDatabase | null,
  catalog: MarketplaceCatalogItem[]
): SellerProfile {
  if (sellerId === 'seller_own') {
    const base = DEFAULT_SELLER_PROFILES.seller_own;
    const farmName = db?.farm?.name?.trim() || base.farmName;
    const location = db?.farm?.location?.trim() || base.location;
    const phone = db?.farm?.phone?.trim() || base.phone;
    const ownerName =
      db?.users?.find((u) => u.role === 'pemilik')?.name || base.ownerName;
    const city =
      catalog.find((c) => c.sellerId === 'seller_own')?.city ||
      location.split(',')[0]?.trim() ||
      base.city;
    return {
      ...base,
      farmName,
      ownerName,
      location,
      city,
      phone,
    };
  }

  if (DEFAULT_SELLER_PROFILES[sellerId]) {
    return DEFAULT_SELLER_PROFILES[sellerId];
  }

  const sampleItem = catalog.find((c) => c.sellerId === sellerId);
  return {
    id: sellerId,
    farmName: sampleItem?.farmName || 'Kandang Mitra TERMU',
    ownerName: 'Pengelola Kandang',
    city: sampleItem?.city || 'Jawa Tengah',
    location: sampleItem?.location || 'Indonesia',
    phone: sampleItem?.phone || '',
    joinedSince: '2025',
    activeStatusLabel: 'Aktif hari ini',
    responseRate: 85,
    responseTimeLabel: '± 1 jam',
    completedSales: 5,
    onTimeDeliveryRate: 88,
    identityVerified: false,
    vetPartnerVerified: false,
    bio: 'Kandang mitra Pasar TERMU.',
    specialties: ['Ternak Siap Jual'],
    baseFollowers: 15,
    isDemo: true,
  };
}

export function computeSellerReputation(
  seller: SellerProfile,
  allReviews: SellerReview[],
  sellerListings: MarketplaceCatalogItem[]
): SellerReputationSummary {
  const reviews = allReviews.filter((r) => r.sellerId === seller.id);
  const starBreakdown: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  let ratingSum = 0;
  for (const r of reviews) {
    const clamped = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    starBreakdown[clamped] += 1;
    ratingSum += clamped;
  }

  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 ? Number((ratingSum / reviewCount).toFixed(1)) : 0;

  const avgVerifiedRecords =
    sellerListings.length > 0
      ? sellerListings.reduce((acc, item) => acc + item.verifiedRecords, 0) / sellerListings.length
      : 0;
  const allWithdrawalFree =
    sellerListings.length === 0 ? true : sellerListings.every((item) => item.withdrawalFree);

  const hasStrongRecords = avgVerifiedRecords >= 6 || seller.vetPartnerVerified;
  const hasGoodRating = reviewCount > 0 && averageRating >= 4.5;
  const hasStrongSales = seller.completedSales >= 10;
  const hasFastResponse = seller.responseRate >= 90;

  const trustReasons: SellerTrustReason[] = [
    {
      id: 'identity',
      label: 'Identitas & Lokasi Kandang Terverifikasi',
      passed: seller.identityVerified,
      detail: seller.identityVerified
        ? `Alamat kandang di ${seller.location} sudah terdata jelas.`
        : 'Kandang baru — verifikasi KTP & titik lokasi masih dalam proses.',
    },
    {
      id: 'records',
      label: 'Rekam Bobot & Paspor QR Konsisten',
      passed: hasStrongRecords,
      detail: hasStrongRecords
        ? `Rata-rata ${Math.max(6, Math.round(avgVerifiedRecords))} catatan timbang aktif & pengawasan kesehatan rutin.`
        : 'Riwayat penimbangan digital masih terbatas; sarankan timbang ulang di tempat.',
    },
    {
      id: 'withdrawal',
      label: 'Status Bebas Masa Henti Obat',
      passed: allWithdrawalFree,
      detail: allWithdrawalFree
        ? 'Seluruh ternak di etalase dinyatakan bebas residu obat.'
        : 'Ada ternak yang sedang dalam masa henti obat — cek Paspor QR sebelum beli.',
    },
    {
      id: 'rating',
      label: 'Rating Pembeli ≥ 4,5 / 5,0',
      passed: hasGoodRating,
      detail:
        reviewCount > 0
          ? `Rating saat ini ${averageRating.toFixed(1)} dari ${reviewCount} ulasan pembeli.`
          : 'Belum ada ulasan pembeli yang tercatat.',
    },
    {
      id: 'sales',
      label: 'Pengalaman Transaksi ≥ 10 Ekor',
      passed: hasStrongSales,
      detail: `${seller.completedSales} ekor ternak tercatat terjual dengan ketepatan kirim ${seller.onTimeDeliveryRate}%.`,
    },
    {
      id: 'response',
      label: 'Kecepatan & Performa Respon ≥ 90%',
      passed: hasFastResponse,
      detail: `Tingkat respon ${seller.responseRate}% (rata-rata balas ${seller.responseTimeLabel}).`,
    },
  ];

  // Transparent 0-100 score calculation
  let score = 0;
  if (seller.identityVerified) score += 22;
  if (seller.vetPartnerVerified) score += 14;
  if (hasStrongRecords) score += 14;
  if (allWithdrawalFree) score += 10;
  if (reviewCount > 0) {
    score += Math.round((averageRating / 5) * 20);
  } else {
    score += 8;
  }
  if (seller.completedSales >= 25) score += 10;
  else if (seller.completedSales >= 10) score += 6;
  else score += 2;
  if (seller.responseRate >= 95) score += 10;
  else if (seller.responseRate >= 85) score += 6;
  else score += 2;

  const trustScore = Math.min(100, Math.max(0, score));

  let trustLevel: SellerTrustLevel = 'perlu_cek';
  if (
    seller.identityVerified &&
    trustScore >= 85 &&
    (reviewCount === 0 || averageRating >= 4.6) &&
    seller.completedSales >= 20
  ) {
    trustLevel = 'terpercaya';
  } else if (seller.identityVerified && trustScore >= 65 && (reviewCount === 0 || averageRating >= 4.0)) {
    trustLevel = 'terverifikasi';
  } else {
    trustLevel = 'perlu_cek';
  }

  const labelMap: Record<
    SellerTrustLevel,
    { label: string; short: string; verdict: string }
  > = {
    terpercaya: {
      label: 'Toko Terpercaya',
      short: 'Terpercaya',
      verdict:
        'Toko ini sangat direkomendasikan. Identitas kandang terverifikasi, rekam Paspor QR konsisten, respon cepat, dan rating pembeli tinggi.',
    },
    terverifikasi: {
      label: 'Toko Terverifikasi',
      short: 'Terverifikasi',
      verdict:
        'Identitas kandang sudah terverifikasi dengan catatan transaksi baik. Tetap cek Paspor QR dan sepakati jadwal timbang sebelum transaksi.',
    },
    perlu_cek: {
      label: 'Perlu Cek Langsung',
      short: 'Perlu Cek',
      verdict:
        'Kandang masih baru atau belum melengkapi verifikasi penuh. Disarankan pilih opsi Ambil Sendiri / cek langsung ke kandang sebelum pelunasan.',
    },
  };

  return {
    averageRating,
    reviewCount,
    starBreakdown,
    trustScore,
    trustLevel,
    trustLabel: labelMap[trustLevel].label,
    trustShortLabel: labelMap[trustLevel].short,
    trustVerdict: labelMap[trustLevel].verdict,
    trustReasons,
  };
}

export function validateSellerReview(input: {
  buyerName: string;
  rating: number;
  comment: string;
}): { ok: boolean; error?: string } {
  if (!input.buyerName.trim() || input.buyerName.trim().length < 2) {
    return { ok: false, error: 'Masukkan nama pembeli minimal 2 karakter.' };
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, error: 'Pilih rating bintang antara 1 sampai 5.' };
  }
  if (!input.comment.trim() || input.comment.trim().length < 8) {
    return { ok: false, error: 'Tulis ulasan singkat minimal 8 karakter agar membantu pembeli lain.' };
  }
  return { ok: true };
}

export function getTrustVisualMeta(level: SellerTrustLevel): {
  badgeClass: string;
  textClass: string;
  surfaceClass: string;
  dotColor: string;
} {
  if (level === 'terpercaya') {
    return {
      badgeClass: 'bg-[#E6F6EC] text-[#145C36] border-[#B8E6C8]',
      textClass: 'text-[#145C36]',
      surfaceClass: 'bg-[#EEF9F2] border-[#C4EBD2]',
      dotColor: '#1D6E42',
    };
  }
  if (level === 'terverifikasi') {
    return {
      badgeClass: 'bg-[#EEF4FF] text-[#1E4799] border-[#C8DAFF]',
      textClass: 'text-[#1E4799]',
      surfaceClass: 'bg-[#F3F7FF] border-[#D0E0FF]',
      dotColor: '#2563EB',
    };
  }
  return {
    badgeClass: 'bg-[#FFF3DA] text-[#8A4700] border-[#F6D59B]',
    textClass: 'text-[#8A4700]',
    surfaceClass: 'bg-[#FFF8EB] border-[#F4DCB0]',
    dotColor: '#B45309',
  };
}
