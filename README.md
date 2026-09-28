# PT Data Integrasi Inovasi (NUHA) - Backend Developer Assessment
> **Modul Login, Jabatan Ganda (Dual Role), Menu Bersarang Tanpa Batas, & Management Access Role**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey.svg)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.x-teal.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/Auth-JWT-black.svg)](https://jwt.io/)


## Data Akun

| Username | Password | Tipe Akun | Hak Akses Role | Keterangan Uji Coba |
|---|---|---|---|---|
| `budi.santoso` | `password123` | **Jabatan Ganda (Dual Role)** | 1. **Manager Operasional**<br>2. **Supervisor Lapangan** | **Menguji Kriteria #2:** Sistem menampilkan modal pilihan role. Menu Manager (Menu 1 & 2) berbeda dengan Menu Supervisor (Menu 2 & 3). Tersedia tombol switch-role instan. |
| `siti.aminah` | `password123` | **Jabatan Tunggal (Single Role)** | **Staff Administrasi** | **Menguji Kriteria #1 & #3:** Langsung login tanpa modal dan hanya mendapatkan akses ke Menu 1. |
| `admin` | `admin123` | **Super Administrator** | **Super Administrator** | **Menguji Kriteria #4:** Akses penuh ke seluruh menu, CRUD Management Menu bersarang, & Management Access Role. |

---

## Struktur Menu S

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


## Instalasi 

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

```bash
npm run setup:db
```

### 4. Jalankan Server
```bash
npm run dev
```

---

## 🧪 Koleksi Postman & Dokumentasi API

- **File Postman Collection:** [`postman_collection.json`](./postman_collection.json)  
  *Import langsung ke Postman. Dilengkapi dengan automatic token scripting!*
- **Dokumentasi API Lengkap:** [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)  
  *Memuat seluruh endpoint, request schema, response schema (200, 401, 403), dan flow diagram.*

---

