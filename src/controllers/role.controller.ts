import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../services/role.service.js';

export class RoleController {
  /**
   * GET /api/roles
   */
  static async getAllRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await RoleService.getAllRoles();
      res.status(200).json({
        success: true,
        data: roles
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/roles/:id
   */
  static async getRoleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const role = await RoleService.getRoleById(id);
      res.status(200).json({
        success: true,
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/roles
   */
  static async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await RoleService.createRole(req.body);
      res.status(201).json({
        success: true,
        message: 'Role baru berhasil ditambahkan.',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/roles/:id
   */
  static async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const updated = await RoleService.updateRole(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Role berhasil diperbarui.',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/roles/:id
   */
  static async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      await RoleService.deleteRole(id);
      res.status(200).json({
        success: true,
        message: 'Role berhasil dihapus.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/roles/:id/menus
   * Kriteria 4: Dapatkan daftar menu yang diakses oleh role
   */
  static async getRoleMenuPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const permissions = await RoleService.getRoleMenuPermissions(id);
      res.status(200).json({
        success: true,
        data: permissions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/roles/:id/menus
   * Kriteria 4: Management access role (assign/sync daftar menu untuk role)
   */
  static async updateRoleMenuPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const { menuIds } = req.body;
      const result = await RoleService.updateRoleMenuPermissions(id, menuIds || []);
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}
