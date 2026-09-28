import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username wajib diisi.'),
    password: z.string().min(1, 'Password wajib diisi.')
  })
});

export const selectRoleSchema = z.object({
  body: z.object({
    preAuthToken: z.string().min(1, 'preAuthToken wajib disertakan.'),
    roleId: z.number({ required_error: 'roleId wajib diisi.' }).int().positive()
  })
});

export const switchRoleSchema = z.object({
  body: z.object({
    roleId: z.number({ required_error: 'roleId tujuan wajib diisi.' }).int().positive()
  })
});
