# Sistem Pengurusan Pertandingan Olahraga — Spesifikasi

Projek **baharu**, berasingan daripada ITChallenge, direka khusus 100% untuk
pertandingan **olahraga** (acara trek & padang) — bukan sistem sukan generik.

> **Nama projek:** belum ditetapkan — gantikan placeholder `[NamaSistem]` di
> bawah dengan nama sebenar bila sedia.

---

## 1. Ringkasan Produk

- **Tujuan:** Urus pertandingan olahraga (hari sukan, kejohanan MSSD/MSSM,
  antara kelab) — pendaftaran peserta ikut pasukan, jadual acara, heat
  saringan, rekod keputusan (masa/jarak), kedudukan automatik, carta
  pungutan mata pasukan.
- **Model tenant:** sama seperti ITChallenge — Admin = Organisasi. Satu akaun
  Admin ialah satu organisasi/kelab/sekolah.
- **Beza besar berbanding ITChallenge:** **TIADA login Peserta.** Semua
  pendaftaran peserta diuruskan sepenuhnya oleh **Pengurus Pasukan** — peserta
  sendiri tidak pernah log masuk ke sistem.

---

## 2. Peranan (Roles)

| Peranan | Login sendiri? | Skop akses |
|---|---|---|
| **Super Admin** | Ya | Seluruh platform — semua organisasi, tetapan sistem |
| **Admin** | Ya | Satu organisasi/kejohanan — cipta pertandingan, urus acara, jadual, keputusan rasmi |
| **Pengurus Pasukan** (Team Manager) | Ya | Satu pasukan — daftar peserta ke acara, lihat penyertaan pasukan sendiri |
| ~~Peserta~~ | **Tiada login** | Rekod sahaja (nama, No. K/P, kategori) di bawah pasukan — bukan akaun Auth |

### Bagaimana setiap peranan dicipta

- **Super Admin** — dicipta manual (Firebase Console / Admin SDK)
- **Admin** — self-signup melalui borang awam "Daftar Admin & Cipta
  Pertandingan" (sama konsep macam ITChallenge §6, boleh guna semula kod tu)
- **Pengurus Pasukan** — dicipta oleh Admin organisasi/kejohanan (borang
  "Jemput Pengurus Pasukan" dalam Dashboard Admin)
- **Peserta** — **hanya rekod data** (bukan akaun), dicipta/diedit oleh
  Pengurus Pasukan terus dalam Firestore, terikat kepada `teamId`

---

## 3. Struktur Acara (Events)

Satu **Acara (Event)** ialah gabungan: **Disiplin** + **Kategori Umur** +
**Jantina**. Contoh: `"100m Lelaki Bawah 15"`.

### 3.1 Disiplin — Trek (rekod: MASA, makin rendah makin baik)
- Lari pecut: 100m, 200m, 400m
- Lari jarak sederhana/jauh: 800m, 1500m, 3000m
- Lari berganti-ganti (relay): 4x100m, 4x400m — unit peserta ialah **pasukan
  4 orang**, bukan individu
- Lari berpagar (hurdles) — pilihan tambahan

### 3.2 Disiplin — Padang (rekod: JARAK/KETINGGIAN, makin tinggi makin baik)
- Lompat: Lompat Jauh, Lompat Tinggi, Lompat Kijang (triple jump)
- Baling: Lontar Peluru (shot put), Lempar Lembing (javelin), Lempar Cakera
  (discus)

### 3.3 Kategori
- **Umur:** contoh Bawah 12, Bawah 15, Bawah 18, Terbuka (Admin tetapkan
  sendiri ikut keperluan kejohanan — bukan hardcode)
- **Jantina:** Lelaki / Perempuan (berasingan)

---

## 4. Fungsi Teras

### 4.1 Pendaftaran Peserta (oleh Pengurus Pasukan)
- Pengurus Pasukan daftar peserta: Nama, No. K/P, Tarikh Lahir (auto-tentukan
  kategori umur layak), Jantina
- Daftarkan peserta ke satu/lebih Acara yang dia layak sertai (semak had
  bilangan acara per peserta jika kejohanan tetapkan had, cth maks 3 acara
  individu)

### 4.2 Jadual Acara
- Admin susun jadual: tarikh, masa, disiplin, kategori, lokasi (trek/padang
  yang mana)
- Papar sebagai carta/jadual harian — boleh tapis ikut hari/kategori

### 4.3 Heat / Pusingan Saringan
- Untuk acara trek dengan peserta ramai: Admin jana **heat** (kumpulan
  saringan), agih peserta ikut lorong (lane)
- Struktur: Saringan (Heat) → (pilihan) Separuh Akhir → Akhir (Final)
- Keputusan setiap pusingan tentukan siapa lolos ke pusingan seterusnya (cth:
  2 terpantas setiap heat + masa terpantas keseluruhan)
- Acara padang biasanya terus ke pusingan akhir (tiada heat, guna percubaan
  berganda — lihat 4.4)

### 4.4 Rekod Keputusan
- Admin / Pengurus Pertandingan masuk keputusan selepas acara:
  - **Trek:** masa (format `mm:ss.ss`) setiap peserta/lorong
  - **Padang:** jarak/ketinggian terbaik daripada beberapa percubaan (cth 3–6
    percubaan setiap peserta, sistem ambil nilai terbaik)
- Sistem kira **kedudukan automatik** (1/2/3/…) ikut peraturan disiplin (masa
  rendah menang untuk trek; jarak/tinggi terbesar menang untuk padang)
- Keputusan rasmi dikunci selepas disahkan (elak pertikaian data berubah)

### 4.5 Carta Pungutan Mata Pasukan
- Setiap kedudukan (1, 2, 3, …) dalam setiap acara individu diberi **mata**
  ikut **jadual mata** yang Admin boleh tetapkan (contoh lazim sekolah:
  Tempat 1 = 5 mata, Tempat 2 = 3 mata, Tempat 3 = 1 mata — **ini contoh
  sahaja, Admin perlu boleh ubah ikut peraturan kejohanan masing-masing**)
- Mata terkumpul setiap peserta disumbang kepada **jumlah mata pasukan**
  (`teamId` mereka)
- Papar **Carta Kedudukan Pasukan** (leaderboard) — dikemaskini automatik
  setiap kali keputusan baharu disahkan

---

## 5. Model Data Firestore (cadangan)

```
users/{uid}
  role: 'superadmin' | 'admin' | 'pengurus_pasukan'
  orgId: string              // untuk admin, == uid sendiri
  teamId?: string            // untuk pengurus_pasukan, rujuk teams/{teamId}
  email, activeSessionId, createdAt

settings/landingPage
  badge, headline, subtitle   // sama konsep ITChallenge

competitions/{code}           // doc ID == Kod Pertandingan
  name, orgId, orgName, code, createdAt
  pointsTable: { "1": 5, "2": 3, "3": 1 }   // jadual mata, boleh Admin edit

  competitions/{code}/categories/{categoryId}
    ageGroup: string          // cth "Bawah 15"
    gender: 'L' | 'P'

  competitions/{code}/events/{eventId}
    discipline: string        // cth "100m", "Lompat Jauh"
    type: 'trek' | 'padang'
    categoryId: string
    scheduledAt: timestamp
    round: 'saringan' | 'separuh_akhir' | 'akhir'
    status: 'belum_mula' | 'sedang_berjalan' | 'selesai' | 'disahkan'

    competitions/{code}/events/{eventId}/heats/{heatId}
      laneAssignments: [{ participantId, lane }]

    competitions/{code}/events/{eventId}/results/{participantId}
      value: number            // saat (trek) atau meter (padang)
      attempts?: number[]      // percubaan padang, ambil max
      position: number         // dikira automatik
      points: number           // ikut pointsTable

  teams/{teamId}
    orgId, competitionCode, name, managerId (== uid Pengurus Pasukan)

    teams/{teamId}/participants/{participantId}
      name, icNumber, dob, gender
      categoryId: string        // ditentukan auto ikut dob + gender
      eventIds: string[]        // acara didaftarkan
```

### Nota peraturan keselamatan (Firestore Rules)

- `users/{uid}` create: self-signup client-side **hanya** sebagai `role ==
  'admin'` dengan `orgId == uid` (sama seperti ITChallenge). Peranan
  `pengurus_pasukan` **mesti** dicipta oleh Admin (bukan self-signup awam),
  jadi rules kena semak `isAdminOf(...)` bagi write jenis ni.
- `teams/{teamId}/participants/{participantId}` — hanya Pengurus Pasukan
  pemilik pasukan (`teamId` sepadan `users/{auth.uid}.teamId`) atau Admin
  organisasi tersebut boleh tulis.
- `events/{eventId}/results/{participantId}` — hanya **Admin** (bukan
  Pengurus Pasukan) boleh tulis/sahkan keputusan rasmi — elak konflik
  kepentingan (pasukan sendiri "tolong" masuk keputusan sendiri).
- Kekal 100% Spark plan (tiada Cloud Function) — ikut prinsip sama seperti
  ITChallenge §10, dengan Firestore Rules sebagai penjaga utama.

---

## 6. Senarai Skrin / Laluan (cadangan)

### Awam
- Landing Page — sama konsep ITChallenge (boleh guna semula reka bentuk),
  CTA "Daftar Sebagai Admin"
- Papar Keputusan Rasmi (awam, ikut Kod Pertandingan) — tanpa login
- Carta Kedudukan Pasukan (leaderboard awam, live)

### Admin
- Daftar Admin & Cipta Pertandingan (borang gabung, sama konsep ITChallenge)
- Dashboard Admin — ringkasan acara, jumlah peserta, jumlah pasukan
- Urus Kategori & Acara — cipta/edit senarai acara + kategori umur/jantina
- Jadual Acara — susun atur tarikh/masa/lokasi setiap acara
- Jana Heat — agih peserta ke heat/lorong
- Rekod & Sahkan Keputusan — masuk masa/jarak, sistem kira kedudukan+mata
- Jemput Pengurus Pasukan — cipta akaun untuk pasukan baharu
- Tetapan Jadual Mata — edit `pointsTable`

### Pengurus Pasukan
- Dashboard Pasukan — senarai peserta & status pendaftaran
- Daftar Peserta — tambah peserta baharu, daftar ke acara
- Lihat Jadual Acara pasukan sendiri
- Lihat Keputusan pasukan sendiri (selepas disahkan)

### Super Admin
- Dashboard — semua organisasi/kejohanan
- Tetapan Sistem — label Landing Page (sama ITChallenge)

---

## 7. Tech Stack (cadangan — sama seperti ITChallenge)

- React + Vite + Tailwind CSS v4 + React Router
- Firebase (Auth Email/Password, Firestore, Storage jika perlu muat naik
  dokumen pasukan, Hosting)
- GitHub Actions → Firebase Hosting
- **100% Spark plan** — tiada Cloud Functions, logik privileged dijaga oleh
  Firestore Rules (lihat §5)
- Boleh guna semula design system (warna ungu→pink, font Manrope) daripada
  ITChallenge, atau tukar jenama baharu — belum ditetapkan

---

## 8. Perkara Belum Ditentukan (perlu keputusan sebelum bina)

- [ ] Nama & jenama projek ni
- [ ] Jadual mata rasmi (default 5-3-1, atau ikut sistem lain cth 10-8-6-5-4-3-2-1)
- [ ] Had bilangan acara individu setiap peserta (jika ada)
- [ ] Had bilangan peserta setiap lorong/heat (biasanya 6–8 lorong)
- [ ] Sama ada acara relay (4x100m) perlu disokong pada versi pertama
- [ ] Sama ada perlu muat naik dokumen (sijil lahir/IC) untuk pengesahan umur peserta

---

## 9. Checklist Bina (bila sedia teruskan)

1. Scaffold projek (rujuk struktur ITChallenge §11 sebagai templat)
2. Bina `AuthContext` + `RequireRole` — tambah peranan `pengurus_pasukan`
3. Bina Firestore Rules ikut §5, sesuaikan `isPengurusOf(teamId)` function
4. Bina skrin Admin: Urus Acara → Jadual → Jana Heat → Rekod Keputusan
   (susunan ni penting — setiap peringkat bergantung data peringkat sebelum)
5. Bina logik kira kedudukan automatik (fungsi tersendiri, mudah diuji)
6. Bina Carta Kedudukan Pasukan (agregat mata real-time)
7. Selesaikan senarai §8 dahulu sebelum mula skrin Rekod Keputusan &
   Jadual Mata (bergantung keputusan tersebut)
