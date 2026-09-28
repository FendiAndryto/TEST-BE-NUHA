import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';

export class UserController {
  /**
   * GET /api/users
   */
  static async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   */
  static async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const user = await UserService.getUserById(id);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users
   */
  static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.createUser(req.body);
      res.status(201).json({
        success: true,
        message: 'Karyawan baru berhasil didaftarkan.',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/:id/roles
   * Tetapkan role ke karyawan (bisa lebih dari satu / jabatan ganda)
   */
  static async assignRolesToUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const { roleIds } = req.body;
      const result = await UserService.assignRolesToUser(id, roleIds || []);
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}
