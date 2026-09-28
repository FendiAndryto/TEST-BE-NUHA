import { z } from 'zod';

export const createMenuSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Nama menu wajib diisi.'),
    code: z.string().min(1, 'Kode menu wajib diisi.').trim(),
    icon: z.string().optional(),
    path: z.string().optional(),
    orderIndex: z.number().int().optional().default(0),
    parentId: z.number().int().positive().nullable().optional(),
    isActive: z.boolean().optional().default(true)
  })
});

export const updateMenuSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID harus berupa angka.')
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).trim().optional(),
    icon: z.string().nullable().optional(),
    path: z.string().nullable().optional(),
    orderIndex: z.number().int().optional(),
    parentId: z.number().int().positive().nullable().optional(),
    isActive: z.boolean().optional()
  })
});
