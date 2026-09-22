// Nilai rujukan sistem — semua BOLEH diubah oleh Admin dalam data sebenar;
// senarai ini hanya default/cadangan permulaan (lihat Spesifikasi §8).

export const DISCIPLINES = {
  trek: [
    { id: '100m', name: '100m', group: 'Lari Pecut' },
    { id: '200m', name: '200m', group: 'Lari Pecut' },
    { id: '400m', name: '400m', group: 'Lari Pecut' },
    { id: '800m', name: '800m', group: 'Lari Jarak Sederhana/Jauh' },
    { id: '1500m', name: '1500m', group: 'Lari Jarak Sederhana/Jauh' },
    { id: '3000m', name: '3000m', group: 'Lari Jarak Sederhana/Jauh' },
    { id: '4x100m', name: '4x100m Berganti-ganti', group: 'Berganti-ganti', isRelay: true },
    { id: '4x400m', name: '4x400m Berganti-ganti', group: 'Berganti-ganti', isRelay: true },
    { id: 'hurdles', name: 'Lari Berpagar', group: 'Berpagar' },
  ],
  padang: [
    { id: 'lompat_jauh', name: 'Lompat Jauh', group: 'Lompat' },
    { id: 'lompat_tinggi', name: 'Lompat Tinggi', group: 'Lompat' },
    { id: 'lompat_kijang', name: 'Lompat Kijang (Triple Jump)', group: 'Lompat' },
    { id: 'lontar_peluru', name: 'Lontar Peluru (Shot Put)', group: 'Baling' },
    { id: 'lempar_lembing', name: 'Lempar Lembing (Javelin)', group: 'Baling' },
    { id: 'lempar_cakera', name: 'Lempar Cakera (Discus)', group: 'Baling' },
  ],
}

export const DEFAULT_AGE_GROUPS = ['Bawah 12', 'Bawah 15', 'Bawah 18', 'Terbuka']

export const GENDERS = [
  { id: 'L', name: 'Lelaki' },
  { id: 'P', name: 'Perempuan' },
]

// Default jadual mata — Admin boleh ubah sepenuhnya (Tetapan Jadual Mata).
export const DEFAULT_POINTS_TABLE = { 1: 5, 2: 3, 3: 1 }

export const ROUNDS = [
  { id: 'saringan', name: 'Saringan (Heat)' },
  { id: 'separuh_akhir', name: 'Separuh Akhir' },
  { id: 'akhir', name: 'Akhir (Final)' },
]

export const EVENT_STATUS = [
  { id: 'belum_mula', name: 'Belum Mula', color: 'slate' },
  { id: 'sedang_berjalan', name: 'Sedang Berjalan', color: 'amber' },
  { id: 'selesai', name: 'Selesai', color: 'blue' },
  { id: 'disahkan', name: 'Disahkan', color: 'green' },
]

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  PENGURUS_PASUKAN: 'pengurus_pasukan',
}
