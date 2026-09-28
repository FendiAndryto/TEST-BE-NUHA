# PT Data Integrasi Inovasi (NUHA) - Backend Developer Assessment
> **Modul Login, Jabatan Ganda (Dual Role), Menu Bersarang Tanpa Batas, & Management Access Role**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey.svg)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.x-teal.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/Auth-JWT-black.svg)](https://jwt.io/)

---

## Studi Kasus & Pemenuhan Kriteria Soal

| No | Kriteria Soal | Status | Solusi Implementasi |
|:--:|---|:---:|---|
| **1** | Karyawan dapat login dengan menggunakan username dan password | ✅ **LENGKAP** | Endpoint `POST /api/auth/login` dengan enkripsi password `bcrypt` & validasi skema `Zod`. |
| **2** | Untuk karyawan dengan jabatan ganda, sistem memberi pilihan role apa yang dipilih | ✅ **LENGKAP** | Deteksi otomatis `roles.length > 1`. Mengembalikan `requiresRoleSelection: true`, daftar pilihan role, dan `preAuthToken` sementara (15 menit). Diikuti pemanggilan endpoint `POST /api/auth/select-role` untuk memilih role aktif & menerbitkan JWT resmi. |
| **3** | Karyawan yang berhasil login diberikan sederet menu sesuai dengan role yang dipilih | ✅ **LENGKAP** | Endpoint `GET /api/menus/my-menu` membaca `roleId` dari payload JWT dan mengembalikan struktur pohon berjenjang (*nested tree*) sesuai izin role. |
| **4** | Management menu (multiple level tanpa batas) & Management access role | ✅ **LENGKAP** | - **Menu Berjenjang:** Menggunakan relasi *self-referencing* `parent_id` pada tabel `menus` yang mendukung kedalaman tanpa batas (*unlimited levels*).<br>- **Role Access:** Relasi *many-to-many* `role_menus` dengan endpoint `GET/POST /api/roles/:id/menus` untuk sinkronisasi hak akses per role. |
| **5** | Menggunakan JWT untuk token login | ✅ **LENGKAP** | JWT token dengan claims `userId`, `username`, `roleId`, dan `roleName`. |
| **6** | Membuat Wireframe/Mockup (Nilai Lebih) | 🌟 **BONUS** | Tersedia **Web UI Mockup interaktif responsif** di `http://localhost:3000` dengan navigasi sidebar pohon berjenjang, modal pemilihan role jabatan ganda, dan live API inspector. |

---

## 👥 Data Akun Uji Coba Interview

Database telah dilengkapi dengan data seeder otomatis untuk simulasi interview:

| Username | Password | Tipe Akun | Hak Akses Role | Keterangan Uji Coba |
|---|---|---|---|---|
| `budi.santoso` | `password123` | **Jabatan Ganda (Dual Role)** | 1. **Manager Operasional**<br>2. **Supervisor Lapangan** | **Menguji Kriteria #2:** Sistem menampilkan modal pilihan role. Menu Manager (Menu 1 & 2) berbeda dengan Menu Supervisor (Menu 2 & 3). Tersedia tombol switch-role instan. |
| `siti.aminah` | `password123` | **Jabatan Tunggal (Single Role)** | **Staff Administrasi** | **Menguji Kriteria #1 & #3:** Langsung login tanpa modal dan hanya mendapatkan akses ke Menu 1. |
| `admin` | `admin123` | **Super Administrator** | **Super Administrator** | **Menguji Kriteria #4:** Akses penuh ke seluruh menu, CRUD Management Menu bersarang, & Management Access Role. |

---

## 🌳 Struktur Menu Uji Coba (Catatan Soal)

Sistem database seeder secara presisi mengimplementasikan seluruh struktur menu yang diminta pada **Catatan Soal**:

```text
Menu 1
├── Menu 1.1
├── Menu 1.2
│   ├── Menu 1.2.1
│   └── Menu 1.2.2
└── Menu 1.3
    └── Menu 1.3.1
Menu 2
├── Menu 2.1
├── Menu 2.2
│   ├── Menu 2.2.1
│   ├── Menu 2.2.2
│   │   ├── Menu 2.2.2.1  <-- [Level 4 Depth]
│   │   └── Menu 2.2.2.2  <-- [Level 4 Depth]
│   └── Menu 2.2.3
└── Menu 2.3
Menu 3
├── Menu 3.1
└── Menu 3.2
```


## ⚡ Panduan Instalasi & Menjalankan Aplikasi

### 1. Clone & Install Dependencies
```bash
git clone <URL_REPOSITORY_ANDA>
cd TEST-BE-NUHA
npm install
```

### 2. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi konfigurasi database PostgreSQL Anda:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/test_be_nuha?schema=public"
JWT_SECRET="nuha_super_secret_jwt_key_2026_xyz"
PREAUTH_JWT_SECRET="nuha_preauth_secret_key_2026_abc"
```

> **Opsional (Docker):** Jika belum memiliki PostgreSQL lokal, Anda dapat menjalankan PostgreSQL dengan 1 perintah:
> ```bash
> docker compose up -d
> ```

### 3. Generate Schema & Seeding Database
Jalankan perintah berikut untuk migrasi tabel dan mengisi data pengujian interview:
```bash
npm run setup:db
```
*(Perintah ini mengeksekusi `prisma db push` dan `prisma/seed.ts`)*

### 4. Jalankan Server
```bash
npm run dev
```

Server akan aktif pada:
- **🎨 Interactive Web UI Mockup:** [http://localhost:3000](http://localhost:3000)
- **📄 Interactive Swagger API Docs:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## 🧪 Koleksi Postman & Dokumentasi API

- **File Postman Collection:** [`postman_collection.json`](./postman_collection.json)  
  *Import langsung ke Postman. Dilengkapi dengan automatic token scripting!*
- **Dokumentasi API Lengkap:** [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)  
  *Memuat seluruh endpoint, request schema, response schema (200, 401, 403), dan flow diagram.*

---

## 🚀 Panduan Push ke GitHub (Soal #4)

1. Buat repository baru di GitHub (misal: `test-be-nuha`).
2. Jalankan perintah git berikut di terminal:
```bash
git init
git add .
git commit -m "feat: complete backend assessment PT Data Integrasi Inovasi (NUHA)"
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/test-be-nuha.git
git push -u origin main
```
