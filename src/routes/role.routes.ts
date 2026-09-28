import { Router } from 'express';
import { RoleController } from '../controllers/role.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { requireRoles } from '../middlewares/role.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { createRoleSchema, updateRoleSchema, updateRoleMenusSchema } from '../validations/role.validation.js';

const router = Router();

// Master Data Role
router.get('/', authenticateJWT, RoleController.getAllRoles);
router.get('/:id', authenticateJWT, RoleController.getRoleById);

// Role Management CRUD (Super Admin)
router.post('/', authenticateJWT, requireRoles('SUPER_ADMIN'), validateRequest(createRoleSchema), RoleController.createRole);
router.put('/:id', authenticateJWT, requireRoles('SUPER_ADMIN'), validateRequest(updateRoleSchema), RoleController.updateRole);
router.delete('/:id', authenticateJWT, requireRoles('SUPER_ADMIN'), RoleController.deleteRole);

// Kriteria 4: Management Access Role (Ambil & Simpan Izin Menu untuk Role)
router.get('/:id/menus', authenticateJWT, RoleController.getRoleMenuPermissions);
router.post('/:id/menus', authenticateJWT, requireRoles('SUPER_ADMIN'), validateRequest(updateRoleMenusSchema), RoleController.updateRoleMenuPermissions);

export default router;
