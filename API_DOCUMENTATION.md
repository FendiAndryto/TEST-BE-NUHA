# DOKUMENTASI SISTEM & API (BACKEND DEVELOPER ASSESSMENT)
**PT DATA INTEGRASI INOVASI (NUHA)**  
*Modul Login & Management Access*

---

## 📋 DAFTAR ISI
1. [Ringkasan Solusi & Kriteria Soal](#ringkasan-solusi--kriteria-soal)
2. [Data Akun Uji Coba Interview](#data-akun-uji-coba-interview)
3. [Arsitektur & Alur Kerja (Workflow)](#arsitektur--alur-kerja-workflow)
   - [Alur 1: Login Karyawan Jabatan Tunggal (Single Role)](#alur-1-login-karyawan-jabatan-tunggal-single-role)
   - [Alur 2: Login Karyawan Jabatan Ganda (Dual / Multiple Roles)](#alur-2-login-karyawan-jabatan-ganda-dual--multiple-roles)
   - [Alur 3: Navigasi Menu Dinamis Hierarkis Sesuai Role](#alur-3-navigasi-menu-dinamis-hierarkis-sesuai-role)
   - [Alur 4: Management Access Role & Menu](#alur-4-management-access-role--menu)
4. [Katalog Endpoint REST API](#katalog-endpoint-rest-api)
   - [Modul Autentikasi (`/api/auth`)](#1-modul-autentikasi-apiauth)
   - [Modul Menu (`/api/menus`)](#2-modul-menu-apimenus)
   - [Modul Role & Access Management (`/api/roles`)](#3-modul-role--access-management-apiroles)
   - [Modul User (`/api/users`)](#4-modul-user-apiusers)
5. [Struktur ERD & Database PostgreSQL](#struktur-erd--database-postgresql)
6. [Panduan Menjalankan Project](#panduan-menjalankan-project)

---

## 🎯 Ringkasan Solusi & Kriteria Soal

| No | Kriteria Soal | Implementasi Solusi |
|---|---|---|
| **1** | Karyawan dapat login dengan username dan password | Endpoint `POST /api/auth/login` menggunakan enkripsi bcrypt & validasi input Zod. |
| **2** | Untuk karyawan dengan jabatan ganda setelah login sistem memberi pilihan role | Jika user memiliki > 1 role, API mengembalikan flag `requiresRoleSelection: true`, daftar pilihan role, dan `preAuthToken` sementara (15m). Frontend memanggil `POST /api/auth/select-role` untuk memilih role aktif & menerbitkan JWT resmi. |
| **3** | Karyawan yang berhasil login diberikan menu sesuai role yang dipilih | Endpoint `GET /api/menus/my-menu` membaca `roleId` dari payload JWT dan menghasilkan format pohon bersarang (*nested hierarchical tree*). |
| **4** | Management menu (multiple level tanpa batas) & Management access role | - **Menu Berjenjang:** Self-referencing FK `parent_id` pada tabel `menus` mendukung kedalaman tanpa batas (Level 1, 2, 3, 4, ... N).<br>- **Role Access:** Relasi `role_menus` dengan endpoint `GET/POST /api/roles/:id/menus` untuk sinkronisasi hak akses per role. |
| **5** | Menggunakan JWT untuk token login | Token JWT ditandatangani secara aman dengan secret key, memuat `userId`, `username`, `roleId`, dan `roleName`. |
| **6** | Wireframe / Mockup (Nilai Lebih) | Tersedia Web UI Mockup interaktif responsif pada `http://localhost:3000` dengan visualisasi pohon menu, modal pemilihan dual-role, dan live API inspector. |

---

## 🔑 Data Akun Uji Coba Interview

Untuk kemudahan pengujian saat sesi interview, database telah diisi (*seeded*) dengan data berikut:

| No | Username | Password | Tipe Akun | Role / Jabatan | Keterangan Uji Coba |
|---|---|---|---|---|---|
| 1 | `budi.santoso` | `password123` | **Jabatan Ganda (Dual Role)** | 1. **Manager Operasional**<br>2. **Supervisor Lapangan** | **Menguji Kriteria #2**: Sistem memicu modal/pilihan role setelah login. Menu akan berubah sesuai role yang dipilih. |
| 2 | `siti.aminah` | `password123` | **Jabatan Tunggal (Single Role)** | **Staff Administrasi** | **Menguji Kriteria #1 & #3**: Langsung masuk dan hanya mendapat akses ke Menu 1. |
| 3 | `admin` | `admin123` | **Super Administrator** | **Super Administrator** | **Menguji Kriteria #4**: Memiliki akses ke seluruh menu serta fitur Management Menu & Management Access Role. |

---

## 🔄 Arsitektur & Alur Kerja (Workflow)

### Alur 1: Login Karyawan Jabatan Tunggal (Single Role)
```
[User Input: username, password]
            │
            ▼
POST /api/auth/login ────────► Validasi Password (bcrypt)
            │
            ├─► Cek Jumlah Role Aktif = 1
            │
            ▼
Response: 200 OK
{
  "requiresRoleSelection": false,
  "accessToken": "eyJhbGciOi...",
  "activeRole": { "id": 4, "name": "Staff Administrasi", "code": "STAFF" }
}
```

---

### Alur 2: Login Karyawan Jabatan Ganda (Dual / Multiple Roles)
```
[User Input: username, password] (Contoh: budi.santoso)
            │
            ▼
POST /api/auth/login ────────► Validasi Password (bcrypt)
            │
            ├─► Terdeteksi Jumlah Role Aktif > 1 (Manager & Supervisor)
            │
            ▼
Response: 200 OK
{
  "requiresRoleSelection": true,
  "preAuthToken": "eyJhbGciOi...",  <-- Token sementara (15 Menit)
  "roles": [
    { "id": 2, "name": "Manager Operasional", "code": "MANAGER_OPS" },
    { "id": 3, "name": "Supervisor Lapangan", "code": "SUPERVISOR" }
  ]
}
            │
            ▼
[Frontend menampilkan Modal Pemilihan Role]
            │
            ▼
POST /api/auth/select-role
Body: { "preAuthToken": "...", "roleId": 2 }
            │
            ▼
Response: 200 OK
{
  "accessToken": "eyJhbGciOi...",  <-- JWT Resmi dengan roleId=2
  "activeRole": { "id": 2, "name": "Manager Operasional" }
}
```

---

### Alur 3: Navigasi Menu Dinamis Hierarkis Sesuai Role
```
GET /api/menus/my-menu
Header: Authorization: Bearer <accessToken>
            │
            ▼
Ekstrak `roleId` dari JWT Token
            │
            ▼
Query tabel `role_menus` JOIN `menus` WHERE role_id = roleId AND is_active = true
            │
            ▼
Proses Rekursif: Mengubah Flat Data menjadi Pohon Bersarang (Hierarchical Tree)
            │
            ▼
Response: 200 OK
[
  {
    "id": 1, "name": "Menu 1", "path": "/menu-1",
    "children": [
      { "id": 2, "name": "Menu 1.1", "children": [] },
      {
        "id": 3, "name": "Menu 1.2",
        "children": [
          { "id": 4, "name": "Menu 1.2.1", "children": [] },
          { "id": 5, "name": "Menu 1.2.2", "children": [] }
        ]
      }
    ]
  },
  ...
]
```

---

## 📡 Katalog Endpoint REST API

Semua endpoint API diawali dengan base URL: `http://localhost:3000/api`

### 1. Modul Autentikasi (`/api/auth`)

#### 1.1. Login Karyawan
- **Endpoint:** `POST /api/auth/login`
- **Akses:** Publik
- **Deskripsi:** Autentikasi awal karyawan menggunakan username dan password.

**Request Body:**
```json
{
  "username": "budi.santoso",
  "password": "password123"
}
```

**Response 200 OK (Karyawan Jabatan Ganda):**
```json
{
  "success": true,
  "requiresRoleSelection": true,
  "message": "Karyawan memiliki jabatan ganda. Silakan pilih role untuk melanjutkan sesi login.",
  "preAuthToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "username": "budi.santoso",
    "name": "Budi Santoso (Jabatan Ganda)",
    "email": "budi.santoso@nuha.care"
  },
  "roles": [
    {
      "id": 2,
      "name": "Manager Operasional",
      "code": "MANAGER_OPS",
      "description": "Akses operasional: Menu 1 & Menu 2"
    },
    {
      "id": 3,
      "name": "Supervisor Lapangan",
      "code": "SUPERVISOR",
      "description": "Akses supervisi: Menu 2 & Menu 3"
    }
  ]
}
```

**Response 200 OK (Karyawan Jabatan Tunggal):**
```json
{
  "success": true,
  "requiresRoleSelection": false,
  "message": "Login berhasil.",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 3,
    "username": "siti.aminah",
    "name": "Siti Aminah"
  },
  "activeRole": {
    "id": 4,
    "name": "Staff Administrasi",
    "code": "STAFF"
  }
}
```

---

#### 1.2. Pilih Role untuk Jabatan Ganda
- **Endpoint:** `POST /api/auth/select-role`
- **Akses:** Publik (Menggunakan `preAuthToken`)
- **Deskripsi:** Menyelesaikan autentikasi untuk karyawan dengan jabatan ganda.

**Request Body:**
```json
{
  "preAuthToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roleId": 2
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Role 'Manager Operasional' berhasil dipilih. Login selesai.",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "username": "budi.santoso",
    "name": "Budi Santoso (Jabatan Ganda)"
  },
  "activeRole": {
    "id": 2,
    "name": "Manager Operasional",
    "code": "MANAGER_OPS"
  }
}
```

---

#### 1.3. Beralih Role / Switch Role (Tanpa Perlu Login Ulang)
- **Endpoint:** `POST /api/auth/switch-role`
- **Akses:** Terautentikasi (`Authorization: Bearer <accessToken>`)
- **Deskripsi:** Memungkinkan user dengan jabatan ganda beralih peran kerja secara instan.

**Request Body:**
```json
{
  "roleId": 3
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Berhasil berganti ke role 'Supervisor Lapangan'.",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "activeRole": {
    "id": 3,
    "name": "Supervisor Lapangan",
    "code": "SUPERVISOR"
  }
}
```

---

#### 1.4. Dapatkan Profil & Role Aktif
- **Endpoint:** `GET /api/auth/profile`
- **Akses:** Terautentikasi (`Authorization: Bearer <accessToken>`)

---

### 2. Modul Menu (`/api/menus`)

#### 2.1. Dapatkan Menu Hierarki Sesuai Role (Kriteria #3)
- **Endpoint:** `GET /api/menus/my-menu`
- **Akses:** Terautentikasi (`Authorization: Bearer <accessToken>`)
- **Deskripsi:** Mengembalikan struktur pohon berjenjang menu yang diizinkan untuk role yang sedang aktif.

**Contoh Response 200 OK:**
```json
{
  "success": true,
  "message": "Berhasil memuat daftar menu untuk role 'Manager Operasional'.",
  "data": [
    {
      "id": 1,
      "name": "Menu 1",
      "code": "M1",
      "icon": "folder",
      "path": "/menu-1",
      "orderIndex": 1,
      "parentId": null,
      "isActive": true,
      "children": [
        {
          "id": 2,
          "name": "Menu 1.1",
          "code": "M1_1",
          "children": []
        },
        {
          "id": 3,
          "name": "Menu 1.2",
          "code": "M1_2",
          "children": [
            { "id": 4, "name": "Menu 1.2.1", "code": "M1_2_1", "children": [] },
            { "id": 5, "name": "Menu 1.2.2", "code": "M1_2_2", "children": [] }
          ]
        }
      ]
    },
    {
      "id": 8,
      "name": "Menu 2",
      "code": "M2",
      "children": [
        {
          "id": 10,
          "name": "Menu 2.2",
          "children": [
            {
              "id": 12,
              "name": "Menu 2.2.2",
              "children": [
                { "id": 13, "name": "Menu 2.2.2.1", "children": [] },
                { "id": 14, "name": "Menu 2.2.2.2", "children": [] }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

#### 2.2. Master Seluruh Menu dalam Format Pohon (Kriteria #4)
- **Endpoint:** `GET /api/menus/tree`
- **Akses:** Terautentikasi

#### 2.3. Tambah Menu Baru (Kriteria #4)
- **Endpoint:** `POST /api/menus`
- **Akses:** Super Admin (`SUPER_ADMIN`)
- **Deskripsi:** Membuat menu baru dengan hierarki tanpa batas. Cukup sertakan `parentId` jika ingin menjadikannya submenu.

**Request Body:**
```json
{
  "name": "Menu 1.4",
  "code": "M1_4",
  "icon": "file-text",
  "path": "/menu-1/4",
  "orderIndex": 4,
  "parentId": 1,
  "isActive": true
}
```

---

### 3. Modul Role & Access Management (`/api/roles`)

#### 3.1. Dapatkan Daftar Role
- **Endpoint:** `GET /api/roles`
- **Akses:** Terautentikasi

#### 3.2. Dapatkan Izin Menu untuk Suatu Role (Kriteria #4)
- **Endpoint:** `GET /api/roles/:id/menus`
- **Akses:** Terautentikasi

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "roleId": 2,
    "roleName": "Manager Operasional",
    "roleCode": "MANAGER_OPS",
    "assignedMenuIds": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  }
}
```

#### 3.3. Simpan / Sinkronisasi Hak Akses Menu Role (Kriteria #4)
- **Endpoint:** `POST /api/roles/:id/menus`
- **Akses:** Super Admin (`SUPER_ADMIN`)

**Request Body:**
```json
{
  "menuIds": [1, 2, 3, 4, 5, 8, 9, 10]
}
```

---

### 4. Modul User (`/api/users`)

#### 4.1. Tetapkan Role ke Karyawan (Dukungan Jabatan Ganda)
- **Endpoint:** `POST /api/users/:id/roles`
- **Akses:** Super Admin (`SUPER_ADMIN`)

**Request Body:**
```json
{
  "roleIds": [2, 3]
}
```

---

## 🗄️ Struktur ERD & Database PostgreSQL

Lihat file visual:
- `erd.drawio` (Buka via [app.diagrams.net](https://app.diagrams.net))
- `erd.svg` (Visual diagram vektor)

### Hubungan Antar Tabel (Relational Mapping)
```
users (1) <────> (N) user_roles (N) <────> (1) roles
                                                 │ (1)
                                                 │
                                                 ▼ (N)
menus (1) <──────────────────────────────> (N) role_menus
  │   ▲
  └───┘ (Self Reference: menus.parent_id -> menus.id)
```

---

## 🚀 Panduan Menjalankan Project

### 1. Prasyarat:
- Node.js (v18+)
- PostgreSQL (Lokal port 5432 atau Docker)

### 2. Konfigurasi Environment:
Buat file `.env` (atau gunakan `.env.example`):
```env
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/test_be_nuha?schema=public"
JWT_SECRET="nuha_super_secret_jwt_key_2026_xyz"
PREAUTH_JWT_SECRET="nuha_preauth_secret_key_2026_abc"
```

### 3. Migrasi & Seeder Database:
Jalankan perintah ini untuk membuat tabel PostgreSQL dan mengisi data interview:
```bash
npm run setup:db
```

### 4. Jalankan Server:
```bash
npm run dev
```

Akses browser:
- **Interactive Web Mockup:** `http://localhost:3000`
- **Interactive Swagger UI:** `http://localhost:3000/api-docs`
