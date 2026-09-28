import { Router } from 'express';
import { MenuController } from '../controllers/menu.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { requireRoles } from '../middlewares/role.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { createMenuSchema, updateMenuSchema } from '../validations/menu.validation.js';

const router = Router();

// Kriteria 3: Dapatkan menu hierarki sesuai role aktif login
router.get('/my-menu', authenticateJWT, MenuController.getMyMenus);

// Kriteria 4: Master Tree Menu tanpa batas level (bisa diakses user terautentikasi)
router.get('/tree', authenticateJWT, MenuController.getAllMenusTree);

// Master Flat Menu (untuk kebutuhan dropdown parent dsb)
router.get('/', authenticateJWT, MenuController.getAllMenusFlat);

// Detail Menu
router.get('/:id', authenticateJWT, MenuController.getMenuById);

// Kriteria 4: CRUD Management Menu (Hak Akses Super Admin)
router.post('/', authenticateJWT, requireRoles('SUPER_ADMIN'), validateRequest(createMenuSchema), MenuController.createMenu);
router.put('/:id', authenticateJWT, requireRoles('SUPER_ADMIN'), validateRequest(updateMenuSchema), MenuController.updateMenu);
router.delete('/:id', authenticateJWT, requireRoles('SUPER_ADMIN'), MenuController.deleteMenu);

export default router;
