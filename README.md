# Sistem Pengurusan Pertandingan Olahraga

Projek React + Firebase (100% Spark plan) untuk urus pertandingan olahraga —
pendaftaran peserta ikut pasukan, jadual acara, heat saringan, rekod
keputusan, kedudukan automatik, dan carta pungutan mata pasukan.

Dibina ikut spesifikasi penuh dalam `SPEC.md`. Rujuk fail itu untuk butiran
peranan, struktur data dan senarai skrin.

## Tech Stack

- React 19 + Vite + React Router (`HashRouter` — sesuai untuk hosting statik)
- Tailwind CSS v4
- Firebase: Auth (Email/Password) + Firestore sahaja — **hosting di GitHub Pages**
- **Tiada Cloud Functions** — semua logik privileged dijaga oleh Firestore
  Security Rules (`firestore.rules`)

## Mula (Setup)

### 1. Cipta projek Firebase

1. Buka [Firebase Console](https://console.firebase.google.com) → Add project
2. Aktifkan **Authentication → Email/Password**
3. Cipta **Firestore Database** (mod production)
4. Daftar app web baharu → salin config SDK

### 2. Konfigurasi tempatan

```bash
cp .env.example .env
# isi .env dengan config Firebase dari langkah di atas
npm install
npm run dev
```

### 3. Deploy Firestore Rules & Indexes

```bash
npm install -g firebase-tools
firebase login
firebase use --add          # pilih projek Firebase anda
firebase deploy --only firestore:rules,firestore:indexes
```

### 4. Cipta Super Admin pertama (manual)

Peranan Super Admin **tidak** boleh dicipta melalui borang (sengaja, untuk
keselamatan). Selepas seseorang mendaftar sebagai Admin biasa (yang mencipta
dokumen `users/{uid}`), naikkan taraf secara manual di Firebase Console →
Firestore → `users/{uid}` → tukar `role` kepada `superadmin`. Atau guna
Firebase Admin SDK / Console.

### 5. Tambah domain ke Firebase Auth "Authorized domains" (WAJIB)

Firebase Authentication **menolak** log masuk/daftar dari domain yang tidak
disenaraikan, walaupun API key betul. Sebelum deploy:

Firebase Console → projek anda → **Authentication → Settings → Authorized
domains** → Add domain → tambah:
- `<username-github>.github.io` (domain GitHub Pages default)
- `swim.syazr.com` (domain custom anda)

### 6. Push ke GitHub & deploy ke GitHub Pages

1. Cipta repo GitHub, push kod ini ke branch `main`
2. Repo → **Settings → Pages** → Source: pilih **GitHub Actions**
3. Repo → **Settings → Secrets and variables → Actions** → tambah 6 secrets:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
   `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
   `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
4. Push ke `main` → workflow `.github/workflows/deploy-gh-pages.yml` akan
   build & deploy automatik. Semak progress di tab **Actions**.

### 7. Sambung domain custom (swim.syazr.com)

Fail `public/CNAME` sudah disediakan dengan kandungan `swim.syazr.com` —
GitHub Pages akan guna ini automatik selepas deploy.

1. Di pembekal DNS domain `syazr.com` anda, tambah rekod **CNAME**:
   - Nama/Host: `swim`
   - Nilai/Target: `<username-github>.github.io`
   - Jika DNS guna Cloudflare, matikan proxy (mod **DNS only**) untuk rekod
     ini semasa provisioning, jika tidak SSL GitHub akan gagal
2. Repo GitHub → **Settings → Pages** → bahagian **Custom domain** patut
   auto-detect `swim.syazr.com` daripada fail CNAME; tunggu semakan DNS lulus
   (tanda hijau) lalu hidupkan **Enforce HTTPS**
3. Boleh ambil beberapa minit hingga 24 jam untuk sijil SSL siap

## Struktur Projek

```
src/
  firebase/config.js       Inisialisasi Firebase (Auth + Firestore)
  context/AuthContext.jsx  Log masuk/daftar/log keluar + profil peranan
  components/
    RequireRole.jsx        Kawal akses laluan ikut peranan
    Layout.jsx              Nav + shell aplikasi
    UI.jsx                  Komponen kecil dikongsi (kad, badge, spinner)
  hooks/
    useLiveDoc.js            Langgan Firestore doc/collection secara live
    useAdminCompetition.js  Cari pertandingan aktif Admin semasa
    useMyTeam.js            Data pasukan Pengurus Pasukan semasa
  lib/
    constants.js            Disiplin, kategori, jadual mata default
    ranking.js              Logik teras: kedudukan automatik & mata (diuji)
  pages/
    public/                 Landing, Keputusan Rasmi, Carta Kedudukan
    admin/                  Dashboard, Acara, Jadual, Heat, Keputusan, Pasukan, Mata
    team/                   Dashboard, Peserta, Jadual, Keputusan
    superadmin/             Dashboard, Tetapan Sistem
firestore.rules             Peraturan keselamatan (lihat SPEC.md §5)
firestore.indexes.json      Index composite diperlukan untuk query merentasi
```

## Ujian logik teras

```bash
node src/lib/ranking.test.manual.mjs
```

Menguji: pengiraan kedudukan (trek/padang), seri, DNS/DNF, nilai terbaik
percubaan padang, pengiraan mata, dan agregat mata pasukan.

## Alur Kerja Peranan

1. **Admin** daftar di `/daftar-admin` → cipta pertandingan + Kod Pertandingan
2. Admin tambah **Kategori & Acara** (`/admin/acara`)
3. Admin **jemput Pengurus Pasukan** (`/admin/pasukan`) — akaun dicipta terus
4. **Pengurus Pasukan** log masuk → daftar peserta & pilih acara (`/pasukan/peserta`)
5. Admin susun **Jadual** (`/admin/jadual`) dan **Jana Heat** untuk acara trek (`/admin/heat`)
6. Selepas acara, Admin **rekod & sahkan keputusan** (`/admin/keputusan`) —
   kedudukan & mata dikira automatik ikut Jadual Mata (`/admin/mata`)
7. Orang ramai lihat **Keputusan Rasmi** & **Carta Kedudukan Pasukan** tanpa
   log masuk, guna Kod Pertandingan di halaman utama

## Perkara Belum Ditentukan (rujuk SPEC.md §8)

- Nama & jenama projek
- Jadual mata rasmi (default sistem: 5-3-1)
- Had bilangan acara individu setiap peserta (default kod: 3)
- Had bilangan lorong setiap heat (default kod: 8)
- Sokongan penuh acara relay (asas disediakan; keputusan berpasukan belum dilaksana)
- Muat naik dokumen pengesahan umur (belum dilaksana)

Nilai default di atas ditanda dalam kod (`MAX_INDIVIDUAL_EVENTS` dalam
`src/pages/team/Participants.jsx`, `LANES` dalam `src/pages/admin/Heats.jsx`)
— mudah diubah bila keputusan dibuat.
