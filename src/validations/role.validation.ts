import { z } from 'zod';

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Nama role wajib diisi.'),
    code: z.string().min(1, 'Kode role wajib diisi.').trim(),
    description: z.string().optional()
  })
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID harus berupa angka.')
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).trim().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional()
  })
});

export const updateRoleMenusSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID harus berupa angka.')
  }),
  body: z.object({
    menuIds: z.array(z.number().int().positive())
  })
});
