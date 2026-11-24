# WEDDING PLANNER — Luxury Elegant Real-Time Web App

> *"Plan Your Perfect Day, Create Your Forever."*

Aplikasi web Wedding Planner bertema **Luxury Elegant** yang dirancang khusus untuk di-hosting gratis melalui **GitHub Pages** dan mendukung **sinkronisasi real-time lintas perangkat dan jaringan berbeda** menggunakan **Firebase Realtime Database**.

## Fitur Utama
1. **Multi-Workspace Real-Time (Owner & Partner):** Undang pasangan dengan satu tautan untuk mengelola data pernikahan yang sama secara bersamaan.
2. **Dashboard & Countdown Otomatis:** Live countdown detik demi detik, progres checklist, ringkasan anggaran Rupiah, dan agenda terdekat.
3. **Checklist 16 Kategori:** Deteksi otomatis tugas terlambat (*Overdue*) dan kalkulasi progres.
4. **Anggaran & 3 Grafik Chart.js:** Estimasi vs Aktual, deteksi pembengkakan biaya, serta riwayat pengeluaran.
5. **Manajemen Tamu & Vendor:** Import/Export CSV Excel, Cetak PDF, direktori vendor, kontrak booking, dan pembayaran bertahap.
6. **FullCalendar Interaktif:** Kalender bulanan/mingguan/harian yang menyatukan agenda, deadline checklist, dan jatuh tempo pembayaran.
7. **Undangan Digital Publik (4 Template) + RSVP Real-Time:** Bagikan tautan undangan ke WhatsApp dan terima ucapan serta konfirmasi kehadiran secara langsung.

## Akun Demo Langsung
- **Email:** `raka.nabila@weddingplanner.id`
- **Password:** `123456`
- **Kode Workspace:** `WP-DEMO-2026`

## Cara Hosting Online di GitHub Pages
1. Buat repository baru di GitHub (misal: `wedding-planner`).
2. Unggah seluruh file (`index.html`, `css/`, `js/`, `README.md`) ke branch `main`.
3. Buka **Settings > Pages** pada repository GitHub Anda.
4. Pada bagian **Build and deployment > Source**, pilih **Deploy from a branch**, pilih branch `main` dan folder `/ (root)`, lalu klik **Save**.
5. Dalam 1–2 menit, aplikasi Anda sudah online di `https://username.github.io/wedding-planner/`.

## Cara Mengaktifkan Sinkronisasi Real-Time Lintas Jaringan (Firebase)
1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat project baru.
2. Aktifkan menu **Build > Realtime Database** (pilih lokasi `asia-southeast1` / Singapore, mulai dalam mode test atau gunakan Rules di bawah).
3. Buka **Project Settings > Your apps > Web (`</>`)**, lalu salin objek `firebaseConfig`.
4. Anda bisa menempelkan `firebaseConfig` tersebut di:
   - File `js/firebase-sync.js` pada variabel `window.DEFAULT_FIREBASE_CONFIG` (disarankan agar permanen untuk semua perangkat), **ATAU**
   - Langsung melalui menu **Cloud & Pengaturan** di dalam aplikasi web.

### Rekomendasi Firebase Realtime Database Rules
```json
{
  "rules": {
    "workspaces": {
      "$wsId": {
        ".read": true,
        ".write": true
      }
    },
    "invitationSlugs": {
      ".read": true,
      ".write": true
    }
  }
}
```
*(Catatan: Untuk produksi tingkat lanjut dengan Firebase Authentication aktif, ubah `.write` menjadi `auth != null` pada node utama dan izinkan `rsvps` ditulis oleh tamu publik).*
