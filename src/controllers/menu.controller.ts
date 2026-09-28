import { Request, Response, NextFunction } from 'express';
import { MenuService } from '../services/menu.service.js';

export class MenuController {
  /**
   * GET /api/menus/my-menu
   * Kriteria 3: Karyawan yang berhasil login akan diberikan sederet menu sesuai dengan role yang dipilih
   */
  static async getMyMenus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roleId = req.user!.roleId;
      const menus = await MenuService.getMenusByRole(roleId);

      res.status(200).json({
        success: true,
        message: `Berhasil memuat daftar menu untuk role '${req.user!.roleName}'.`,
        data: menus
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/menus/tree
   * Master tree semua menu dengan multiple level tanpa batas
   */
  static async getAllMenusTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await MenuService.getAllMenusTree();
      res.status(200).json({
        success: true,
        data: tree
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/menus
   * Daftar menu flat (bisa difilter)
   */
  static async getAllMenusFlat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const menus = await MenuService.getAllMenusFlat();
      res.status(200).json({
        success: true,
        data: menus
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/menus/:id
   */
  static async getMenuById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const menu = await MenuService.getMenuById(id);
      res.status(200).json({
        success: true,
        data: menu
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/menus
   * Kriteria 4: Management menu (multiple level tanpa batas)
   */
  static async createMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newMenu = await MenuService.createMenu(req.body);
      res.status(201).json({
        success: true,
        message: 'Menu baru berhasil dibuat.',
        data: newMenu
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/menus/:id
   */
  static async updateMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      const updated = await MenuService.updateMenu(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Menu berhasil diperbarui.',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/menus/:id
   */
  static async deleteMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      await MenuService.deleteMenu(id);
      res.status(200).json({
        success: true,
        message: 'Menu berhasil dihapus.'
      });
    } catch (error) {
      next(error);
    }
  }
}
