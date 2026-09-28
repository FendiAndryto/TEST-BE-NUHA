import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { requireRoles } from '../middlewares/role.middleware.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { createUserSchema, assignRolesSchema } from '../validations/user.validation.js';

const router = Router();

// User & Role Assignment Management (Super Admin)
router.get('/', authenticateJWT, requireRoles('SUPER_ADMIN'), UserController.getAllUsers);
router.get('/:id', authenticateJWT, requireRoles('SUPER_ADMIN'), UserController.getUserById);
router.post('/', authenticateJWT, requireRoles('SUPER_ADMIN'), validateRequest(createUserSchema), UserController.createUser);

// Kriteria 2: Assign multiple roles to user (Jabatan Ganda / Single)
router.post('/:id/roles', authenticateJWT, requireRoles('SUPER_ADMIN'), validateRequest(assignRolesSchema), UserController.assignRolesToUser);

export default router;
