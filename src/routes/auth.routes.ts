import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { loginSchema, selectRoleSchema, switchRoleSchema } from '../validations/auth.validation.js';

const router = Router();

// Endpoint Login (Kriteria 1 & 2)
router.post('/login', validateRequest(loginSchema), AuthController.login);

// Endpoint Pemilihan Role untuk Jabatan Ganda (Kriteria 2)
router.post('/select-role', validateRequest(selectRoleSchema), AuthController.selectRole);

// Endpoint Switch Role (Beralih jabatan saat sedang aktif)
router.post('/switch-role', authenticateJWT, validateRequest(switchRoleSchema), AuthController.switchRole);

// Endpoint Profil & Role Info
router.get('/profile', authenticateJWT, AuthController.getProfile);

export default router;
