# Wedding Planner Real-Time — Fajar Sidiq & Selviana Nurhidayah

Aplikasi web **Wedding Planner** kolaboratif dan *real-time* yang dirancang khusus untuk persiapan pernikahan **Fajar Sidiq & Selviana Nurhidayah**. Dibangun dalam format *single-file* HTML (`index.html`) menggunakan Tailwind CSS dan Firebase Cloud Sync sehingga dapat di-*hosting* secara gratis di **GitHub Pages** dan diakses serta diedit bersama dari perangkat maupun jaringan internet yang berbeda.

---

## Fitur Utama

1. **Gerbang Masuk Kolaboratif & PIN Akses**
   - Pilihan identitas editor: **Fajar Sidiq**, **Selviana Nurhidayah**, atau **Keluarga / WO**.
   - Dilengkapi perlindungan PIN akses (PIN default awal: `2026`, dapat diubah kapan saja di menu **Edit Acara & PIN**).
2. **Real-Time Cloud Sync + Mode Lokal Otomatis**
   - Sinkronisasi instan antar perangkat menggunakan **Cloud Firestore** atau **Firebase Realtime Database**.
   - Jika koneksi cloud belum diatur atau sedang *offline*, data otomatis tersimpan di `localStorage` browser dan tetap tersinkron antar-tab.
3. **Dashboard & Live Countdown**
   - Hitung mundur detik demi detik menuju hari Akad Nikah.
   - 4 Kartu KPI utama (Progress Checklist, Anggaran & Terpakai, Tamu & Pax Hadir, Pembayaran Vendor).
   - **Agenda Terdekat**, **Pengingat Prioritas Otomatis**, dan **Log Aktivitas Terbaru** untuk memantau riwayat perubahan oleh masing-masing editor.
4. **Checklist Persiapan (6 Kategori)**
   - Mencakup kategori *Administrasi/KUA*, *Venue & Katering*, *Busana & MUA*, *Dokumentasi*, *Dekorasi & Hiburan*, serta *Souvenir & Undangan*.
5. **Manajemen Anggaran**
   - Kalkulasi otomatis Plafon Anggaran Induk, Total Estimasi, Total Realisasi/Terbayar, Sisa Dana, serta peringatan jika pengeluaran melebihi batas.
6. **Manajemen Tamu, RSVP & Link Undangan Personal**
   - Pencarian instan, filter kategori relasi & status RSVP, kalkulasi total Pax hadir, serta tombol **Salin Link** undangan personal untuk masing-masing tamu.
7. **Vendor & Pembayaran Bertahap (Termin)**
   - Kelola nilai kontrak dan rincian termin pembayaran (DP, Termin, Pelunasan) beserta status lunas dan jatuh tempo.
8. **Kalender & Jadwal Acara**
   - Kalender interaktif bulanan (klik tanggal untuk langsung menambah agenda) dan tampilan *timeline* terurut.
9. **Galeri Inspirasi (Moodboard)**
   - Palet warna *Luxury Champagne & Ivory* (klik untuk menyalin kode hex) beserta kartu catatan konsep pernikahan.
10. **Undangan Digital Publik (`?undangan=1`)**
    - Tersedia 3 pilihan tema (*Champagne Ivory*, *Royal Espresso Gold*, *Soft Floral Beige*).
    - Tamu undangan dapat membuka mode publik tanpa login, melihat detail Akad & Resepsi, membuka Google Maps, serta mengisi konfirmasi RSVP dan ucapan doa restu yang langsung tersinkron ke daftar tamu planner.

---

## Cara Setup Firebase & Deploy ke GitHub Pages

### Langkah 1: Siapkan Proyek Firebase (Gratis)
1. Buka [Firebase Console](https://console.firebase.google.com/) dan login menggunakan akun Google.
2. Klik **Create a project** (misalnya beri nama `wedding-fajar-selvi`).
3. Di menu sebelah kiri, buka **Build > Firestore Database** *(disarankan)*:
   - Klik **Create database**, pilih lokasi server terdekat (misalnya `asia-southeast2` Jakarta atau `asia-southeast1` Singapore).
   - Pilih **Start in test mode** agar proses penulisan dan pembacaan data langsung berjalan.
4. *(Opsional namun disarankan)* Buka **Build > Authentication > Sign-in method**, lalu aktifkan **Anonymous** agar koneksi klien lebih stabil.
5. Buka **Project Settings** (ikon gerigi di samping *Project Overview*), scroll ke bagian **Your apps**, klik ikon **Web (`</>`)** untuk mendaftarkan aplikasi web, lalu salin objek `firebaseConfig`.

### Langkah 2: Tanamkan Konfigurasi Firebase ke `index.html`
Anda memiliki dua cara mudah untuk menghubungkan aplikasi dengan Firebase:

* **Cara A (Lewat Antarmuka Aplikasi — Paling Mudah):**
  1. Buka file `wedding-planner-fajar-selviana.html` di browser.
  2. Klik tombol **Setup Cloud Firebase** (atau **Cloud Sync & GitHub Setup**).
  3. Pastikan **Workspace ID** diisi (misalnya `fajar-selviana-wedding`), pilih **Cloud Firestore**, lalu tempelkan `firebaseConfig` Anda.
  4. Klik **Simpan & Hubungkan**.
  5. Klik tombol **Download index.html (GitHub)** di modal tersebut. File `index.html` yang terunduh sudah otomatis membawa konfigurasi Firebase Anda.

* **Cara B (Edit Manual di Kode):**
  1. Ubah nama file `wedding-planner-fajar-selviana.html` menjadi `index.html`.
  2. Cari baris `const DEFAULT_FIREBASE_CONFIG = null;` di bagian `<script type="module">`, lalu ganti `null` dengan objek `firebaseConfig` dari Firebase Console.

### Langkah 3: Upload ke GitHub & Aktifkan GitHub Pages
1. Buat repository baru di [GitHub](https://github.com/new) (misalnya `wedding-fajar-selviana`), set ke **Public** (untuk akun GitHub gratis).
2. Upload file `index.html` dan `README.md` ke repository tersebut (bisa langsung via tombol **Add file > Upload files** di web GitHub).
3. Masuk ke tab **Settings** pada repository GitHub Anda.
4. Di menu kiri, pilih **Pages**.
5. Pada bagian **Build and deployment > Source**, pilih **Deploy from a branch**.
6. Pilih branch **`main`** dan folder **`/(root)`**, lalu klik **Save**.
7. Tunggu 1–2 menit, lalu muat ulang halaman **Pages** untuk mendapatkan tautan web online Anda (contoh: `https://username.github.io/wedding-fajar-selviana/`).

---

## Panduan Penggunaan

### 1. Akses Mode Planner (Untuk Mempelai & Panitia)
- Buka URL GitHub Pages Anda.
- Pilih identitas (**Fajar Sidiq**, **Selviana Nurhidayah**, atau **Keluarga / WO**).
- Masukkan PIN akses (default awal: `2026`).
- Pastikan indikator di pojok kanan atas bertuliskan **Live Cloud Sync (Real-Time)**. Semua perubahan dari HP maupun laptop berbeda akan otomatis tersinkron.

### 2. Berbagi Link Undangan Digital ke Tamu
Tamu yang membuka link undangan **tidak perlu memasukkan PIN**.
- **Link Undangan Umum:**
  `https://username.github.io/wedding-fajar-selviana/?undangan=1`
- **Link Undangan Personal (Menampilkan Nama Tamu):**
  Gunakan tombol **Salin Link** langsung pada baris nama tamu di menu **Tamu & RSVP**, atau tambahkan parameter `?undangan=1&tamu=Nama%20Tamu`.

### 3. Backup & Restore Data
- Gunakan tombol **Export** di bagian bawah sidebar untuk mengunduh salinan seluruh data dalam format `.json`.
- Gunakan tombol **Import** untuk memulihkan data dari file cadangan `.json`.

---

## Catatan Keamanan
- Segera ubah PIN akses default (`2026`) melalui menu **Dashboard > Edit Acara & PIN** setelah aplikasi online.
- Pada Firebase Firestore, *Test Mode* memiliki batas waktu aktif (biasanya 30 hari). Pastikan Anda menyesuaikan **Firestore Rules** di Firebase Console jika masa *Test Mode* hampir berakhir agar aplikasi tetap bisa membaca dan menyimpan data.