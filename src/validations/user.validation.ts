import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username minimal 3 karakter.').trim(),
    password: z.string().min(6, 'Password minimal 6 karakter.').optional(),
    name: z.string().min(1, 'Nama lengkap wajib diisi.').trim(),
    email: z.string().email('Format email tidak valid.').optional(),
    roleIds: z.array(z.number().int().positive()).min(1, 'Minimal pilih 1 role untuk karyawan.')
  })
});

export const assignRolesSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID harus berupa angka.')
  }),
  body: z.object({
    roleIds: z.array(z.number().int().positive()).min(1, 'Minimal pilih 1 role untuk karyawan.')
  })
});
