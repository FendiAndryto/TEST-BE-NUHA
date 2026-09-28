export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'PT Data Integrasi Inovasi (NUHA) - Backend Developer Assessment API',
    version: '1.0.0',
    description: `
Dokumentasi REST API Modul Login & Management Access:
1. **Autentikasi Pegawai**: Login dengan username & password (JWT).
2. **Dukungan Jabatan Ganda (Dual Role)**: Deteksi otomatis multi-role & endpoint pemilihan role aktif (\`/api/auth/select-role\`).
3. **Menu Dinamis Hierarkis**: Dapatkan hierarki menu bersarang tanpa batas sesuai role aktif (\`/api/menus/my-menu\`).
4. **Management Menu & Role Access**: CRUD Menu berjenjang tanpa batas & assignment akses menu ke masing-masing role.
    `,
    contact: {
      name: 'PT Data Integrasi Inovasi',
      url: 'https://nuha.care',
      email: 'admin@dataintegrasiinovasi.net'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan JWT Token yang didapatkan dari login / select-role.'
      }
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'budi.santoso' },
          password: { type: 'string', example: 'password123' }
        }
      },
      SelectRoleRequest: {
        type: 'object',
        required: ['preAuthToken', 'roleId'],
        properties: {
          preAuthToken: { type: 'string', description: 'Token sementara dari response login jika memiliki jabatan ganda' },
          roleId: { type: 'integer', example: 2, description: 'ID role yang dipilih oleh karyawan' }
        }
      },
      SwitchRoleRequest: {
        type: 'object',
        required: ['roleId'],
        properties: {
          roleId: { type: 'integer', example: 3, description: 'ID role tujuan' }
        }
      },
      CreateMenuRequest: {
        type: 'object',
        required: ['name', 'code'],
        properties: {
          name: { type: 'string', example: 'Menu 1.4' },
          code: { type: 'string', example: 'M1_4' },
          icon: { type: 'string', example: 'file-text' },
          path: { type: 'string', example: '/menu-1/4' },
          orderIndex: { type: 'integer', example: 4 },
          parentId: { type: 'integer', nullable: true, example: 1, description: 'ID menu induk (null jika root menu)' },
          isActive: { type: 'boolean', example: true }
        }
      },
      UpdateRoleMenusRequest: {
        type: 'object',
        required: ['menuIds'],
        properties: {
          menuIds: {
            type: 'array',
            items: { type: 'integer' },
            example: [1, 2, 3, 4, 5]
          }
        }
      }
    }
  },
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login Karyawan (Kriteria #1 & #2)',
        description: 'Jika user memiliki jabatan tunggal, langsung mengembalikan accessToken JWT. Jika user memiliki jabatan ganda (multiple roles), mengembalikan requiresRoleSelection: true, daftar pilihan role, dan preAuthToken.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Berhasil login atau butuh pemilihan role jabatan ganda',
            content: {
              'application/json': {
                example: {
                  success: true,
                  requiresRoleSelection: true,
                  message: 'Karyawan memiliki jabatan ganda. Silakan pilih role untuk melanjutkan sesi login.',
                  preAuthToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  user: { id: 2, username: 'budi.santoso', name: 'Budi Santoso' },
                  roles: [
                    { id: 2, name: 'Manager Operasional', code: 'MANAGER_OPS' },
                    { id: 3, name: 'Supervisor Lapangan', code: 'SUPERVISOR' }
                  ]
                }
              }
            }
          },
          401: { description: 'Username atau password salah' }
        }
      }
    },
    '/api/auth/select-role': {
      post: {
        tags: ['Authentication'],
        summary: 'Pilih Role untuk Karyawan Jabatan Ganda (Kriteria #2)',
        description: 'Dipanggil setelah login ketika requiresRoleSelection bernilai true.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SelectRoleRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Role berhasil dipilih dan JWT token resmi diterbitkan',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: "Role 'Manager Operasional' berhasil dipilih. Login selesai.",
                  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  user: { id: 2, username: 'budi.santoso', name: 'Budi Santoso' },
                  activeRole: { id: 2, name: 'Manager Operasional', code: 'MANAGER_OPS' }
                }
              }
            }
          },
          401: { description: 'preAuthToken tidak valid atau kadaluarsa' },
          403: { description: 'Role yang dipilih tidak dimiliki oleh karyawan' }
        }
      }
    },
    '/api/auth/switch-role': {
      post: {
        tags: ['Authentication'],
        summary: 'Switch Role Aktif (Tanpa Logout)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SwitchRoleRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Berhasil beralih ke role lain yang dimiliki' }
        }
      }
    },
    '/api/auth/profile': {
      get: {
        tags: ['Authentication'],
        summary: 'Dapatkan Profil & Daftar Role yang Dimiliki',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Data profil user dan role aktif' }
        }
      }
    },
    '/api/menus/my-menu': {
      get: {
        tags: ['Menus'],
        summary: 'Dapatkan Pohon Menu Sesuai Role Login (Kriteria #3)',
        description: 'Mengembalikan struktur pohon menu (unlimited nested tree) yang diizinkan untuk role yang sedang aktif.',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Hierarki menu berjenjang berhasil diambil',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: "Berhasil memuat daftar menu untuk role 'Manager Operasional'.",
                  data: [
                    {
                      id: 1,
                      name: 'Menu 1',
                      code: 'M1',
                      path: '/menu-1',
                      children: [
                        { id: 2, name: 'Menu 1.1', code: 'M1_1', path: '/menu-1/1', children: [] },
                        {
                          id: 3,
                          name: 'Menu 1.2',
                          code: 'M1_2',
                          path: '/menu-1/2',
                          children: [
                            { id: 4, name: 'Menu 1.2.1', code: 'M1_2_1', children: [] },
                            { id: 5, name: 'Menu 1.2.2', code: 'M1_2_2', children: [] }
                          ]
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    '/api/menus/tree': {
      get: {
        tags: ['Menus'],
        summary: 'Master Seluruh Menu dalam Format Tree (Kriteria #4)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Master menu pohon tanpa batas level' }
        }
      }
    },
    '/api/menus': {
      get: {
        tags: ['Menus'],
        summary: 'Daftar Menu Flat',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Daftar menu flat' } }
      },
      post: {
        tags: ['Menus'],
        summary: 'Tambah Menu Baru (Kriteria #4 - Super Admin)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateMenuRequest' }
            }
          }
        },
        responses: {
          201: { description: 'Menu berhasil dibuat' }
        }
      }
    },
    '/api/roles': {
      get: {
        tags: ['Roles & Access Management'],
        summary: 'Dapatkan Semua Role',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'List roles' } }
      }
    },
    '/api/roles/{id}/menus': {
      get: {
        tags: ['Roles & Access Management'],
        summary: 'Dapatkan Hak Akses Menu untuk Suatu Role (Kriteria #4)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Role ID' }
        ],
        responses: {
          200: { description: 'Daftar Menu ID yang diizinkan untuk role ini' }
        }
      },
      post: {
        tags: ['Roles & Access Management'],
        summary: 'Simpan / Sinkronisasi Hak Akses Menu untuk Role (Kriteria #4 - Super Admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Role ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateRoleMenusRequest' }
            }
          }
        },
        responses: {
          200: { description: 'Hak akses menu berhasil diperbarui' }
        }
      }
    },
    '/api/users': {
      get: {
        tags: ['User Management'],
        summary: 'Daftar Karyawan beserta Role (Super Admin)',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Daftar user dan roles' } }
      }
    },
    '/api/users/{id}/roles': {
      post: {
        tags: ['User Management'],
        summary: 'Tetapkan Role ke Karyawan (Dukungan Jabatan Ganda / Single)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'User ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['roleIds'],
                properties: {
                  roleIds: {
                    type: 'array',
                    items: { type: 'integer' },
                    example: [2, 3]
                  }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Role karyawan berhasil diperbarui' }
        }
      }
    }
  }
};
