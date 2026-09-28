import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';

export class AuthController {
  /**
   * POST /api/auth/login
   * Karyawan dapat login dengan menggunakan username dan password
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/select-role
   * Untuk karyawan dengan jabatan ganda setelah proses login sistem akan memberi pilihan role apa yang dipilih
   */
  static async selectRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { preAuthToken, roleId } = req.body;
      const result = await AuthService.selectRole(preAuthToken, Number(roleId));

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/switch-role
   * Berganti role aktif tanpa perlu login ulang
   */
  static async switchRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.body;
      const userId = req.user!.userId;
      const result = await AuthService.switchRole(userId, Number(roleId));

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/profile
   * Ambil data profil dan role aktif
   */
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const roleId = req.user!.roleId;
      const result = await AuthService.getProfile(userId, roleId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
