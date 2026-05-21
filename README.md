# 📦 Aplikasi Stok Gudang

Aplikasi web berbasis **Google Apps Script** untuk manajemen stok barang internal perusahaan dengan UI modern (SaaS style), role-based access control, dan fitur lengkap untuk operasional tim.

![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=flat&logo=google&logoColor=white)
![Bootstrap 5](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=flat&logo=bootstrap&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat&logo=chartdotjs&logoColor=white)

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🔐 Login System | Username & password dengan SHA-256 hash |
| 👥 Role System | Staff, Admin, Manager dengan akses berbeda |
| 📦 Manajemen Stok | CRUD barang, stok otomatis update |
| 📷 Scan Barcode | Scan via kamera untuk input cepat |
| 📊 Dashboard | Grafik bulanan, statistik realtime |
| 📄 Laporan | Filter tanggal, export CSV & PDF |
| 📋 Pengajuan | Staff ajukan → Admin approve/reject |
| 🔔 Notifikasi | Email otomatis jika stok rendah |
| 🌙 Dark Mode | Toggle dengan preferensi tersimpan |
| 📱 Responsive | Mobile-friendly, tampilan seperti app |
| ⚡ Auto Refresh | Data refresh otomatis setiap 5 detik |

---

## 👥 Role & Akses

| Role | Akses |
|------|-------|
| **Staff** | Barang keluar, scan barcode, pengajuan barang |
| **Admin** | Barang masuk, kelola stok, approve/reject pengajuan |
| **Manager** | Dashboard, laporan, monitoring grafik |

---

## 🚀 Cara Setup

### 1. Buat Google Spreadsheet Baru

1. Buka [Google Sheets](https://sheets.google.com) dan buat spreadsheet baru
2. Catat **Spreadsheet ID** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### 2. Buat Project Google Apps Script

1. Buka [Google Apps Script](https://script.google.com)
2. Klik **New Project**
3. Hapus konten default di `Code.gs`
4. Copy-paste seluruh isi file `Code.gs` dari repository ini

### 3. Tambahkan File HTML

1. Di Apps Script Editor, klik **+** → **HTML**
2. Beri nama `index` (tanpa .html)
3. Copy-paste seluruh isi file `index.html` dari repository ini

### 4. Konfigurasi

Edit baris berikut di `Code.gs`:

```javascript
const SPREADSHEET_ID = 'ISI_DENGAN_SPREADSHEET_ID_ANDA';
const ADMIN_EMAIL = 'email@domain.com'; // untuk notifikasi stok rendah
```

### 5. Inisialisasi Database

1. Di Apps Script Editor, pilih fungsi `setupSheets` dari dropdown
2. Klik **Run** (▶)
3. Berikan izin yang diminta
4. Sheet Barang, Transaksi, Pengajuan, dan User akan dibuat otomatis

### 6. Deploy sebagai Web App

1. Klik **Deploy** → **New deployment**
2. Pilih type: **Web app**
3. Settings:
   - Description: `Stok Gudang v1.0`
   - Execute as: **Me**
   - Who has access: **Anyone** (atau sesuai kebutuhan)
4. Klik **Deploy**
5. Copy URL web app yang diberikan

---

## 🔑 Login Default

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | Admin |
| `staff` | `staff123` | Staff |
| `manager` | `manager123` | Manager |

> ⚠️ **Penting:** Segera ganti password default setelah deploy!

---

## 📦 Struktur Database (Google Sheets)

### Sheet: Barang
| Kolom | Deskripsi |
|-------|-----------|
| ID Barang | Auto-generated (BRG-timestamp-random) |
| Nama Barang | Nama item |
| Stok | Jumlah stok saat ini |
| Satuan | pcs, kg, liter, dll |
| Minimum Stok | Batas minimum untuk notifikasi |

### Sheet: Transaksi
| Kolom | Deskripsi |
|-------|-----------|
| ID Transaksi | Auto-generated (TRX-timestamp-random) |
| Tanggal | Timestamp transaksi |
| Nama Barang | Nama item |
| Jumlah | Quantity |
| Jenis | masuk / keluar |
| User | Username pelaku |

### Sheet: Pengajuan
| Kolom | Deskripsi |
|-------|-----------|
| ID Pengajuan | Auto-generated (PGJ-timestamp-random) |
| Tanggal | Timestamp pengajuan |
| Nama Barang | Nama item yang diajukan |
| Jumlah | Quantity yang diminta |
| Status | Pending / Approve / Reject |
| User | Username pengaju |

### Sheet: User
| Kolom | Deskripsi |
|-------|-----------|
| Username | Username login |
| Password | SHA-256 hashed password |
| Role | staff / admin / manager |

---

## 🎨 Design System

- **Hijau Utama:** `#006241`
- **Hijau Accent:** `#00754A`
- **Background:** `#f2f0eb`
- **Dark:** `#1E3932`
- **Card Radius:** 14px
- **Button Radius:** 50px (rounded)
- **Animasi:** Hover scale, card lift, sidebar slide

---

## 🛠️ Teknologi

- **Backend:** Google Apps Script
- **Database:** Google Sheets
- **Frontend:** HTML5, CSS3, JavaScript (vanilla)
- **UI Framework:** Bootstrap 5.3
- **Charts:** Chart.js
- **Barcode Scanner:** html5-qrcode
- **Notifikasi:** Google MailApp

---

## 📋 SOP Penggunaan

### Staff
1. Login dengan akun staff
2. Untuk mengeluarkan barang: Menu **Transaksi** → Barang Keluar
3. Untuk scan cepat: Menu **Scan Barcode** → Arahkan kamera
4. Jika stok kurang: Menu **Pengajuan** → Isi form → Submit

### Admin
1. Login dengan akun admin
2. Input barang masuk: Menu **Transaksi** → Barang Masuk
3. Kelola stok: Menu **Data Stok** → Tambah/Edit/Hapus
4. Approve pengajuan: Menu **Approval** → Approve/Reject

### Manager
1. Login dengan akun manager
2. Lihat statistik: Menu **Dashboard**
3. Filter laporan: Menu **Laporan** → Pilih tanggal → Filter
4. Export data: Klik tombol CSV atau PDF

---

## ⚠️ Catatan Penting

- Password disimpan dalam bentuk hash SHA-256
- Stok tidak bisa minus (ada validasi)
- Jika pengajuan di-approve, stok otomatis bertambah
- Email notifikasi dikirim saat stok di bawah minimum
- Data auto-refresh setiap 5 detik tanpa reload halaman
- Preferensi dark mode tersimpan di localStorage

---

## 📄 Lisensi

MIT License - Bebas digunakan dan dimodifikasi.
