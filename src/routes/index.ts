import { Router } from 'express';
import authRoutes from './auth.routes.js';
import menuRoutes from './menu.routes.js';
import roleRoutes from './role.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/menus', menuRoutes);
router.use('/roles', roleRoutes);
router.use('/users', userRoutes);

export default router;
