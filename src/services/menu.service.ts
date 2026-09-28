import { prisma } from '../config/prisma.js';
import { MenuItemNode } from '../types/menu.types.js';

export class MenuService {
  /**
   * Helper rekursif untuk mengubah flat array menu menjadi tree hierarchy bertingkat tanpa batas (unlimited levels)
   */
  static buildTree(menus: any[], parentId: number | null = null): MenuItemNode[] {
    return menus
      .filter((menu) => menu.parentId === parentId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((menu) => ({
        id: menu.id,
        name: menu.name,
        code: menu.code,
        icon: menu.icon,
        path: menu.path,
        orderIndex: menu.orderIndex,
        parentId: menu.parentId,
        isActive: menu.isActive,
        children: MenuService.buildTree(menus, menu.id)
      }));
  }

  /**
   * Kriteria 3: Karyawan yang berhasil login akan diberikan sederet menu sesuai dengan role yang dipilih
   * Mengambil menu hierarki berdasarkan role yang sedang aktif.
   */
  static async getMenusByRole(roleId: number): Promise<MenuItemNode[]> {
    // 1. Dapatkan semua role_menus yang dimiliki roleId
    const roleMenus = await prisma.roleMenu.findMany({
      where: { roleId },
      include: {
        menu: true
      }
    });

    const activeMenus = roleMenus
      .map((rm: { menu: any }) => rm.menu)
      .filter((m: any) => m && m.isActive);

    if (activeMenus.length === 0) {
      return [];
    }

    // 2. Untuk menjaga integritas hierarki (jika ada child yang diberi akses tetapi parentnya belum masuk role_menu),
    // kita load juga parent-parentnya secara rekursif agar pohon menu tetap utuh di frontend.
    const menuMap = new Map<number, any>();
    activeMenus.forEach((m: any) => menuMap.set(m.id, m));

    // Kumpulkan parent ID yang belum ada di menuMap
    let missingParentIds = activeMenus
      .map((m: any) => m.parentId)
      .filter((pid: any): pid is number => pid !== null && !menuMap.has(pid));

    while (missingParentIds.length > 0) {
      const parents = await prisma.menu.findMany({
        where: {
          id: { in: missingParentIds },
          isActive: true
        }
      });

      parents.forEach((p: any) => menuMap.set(p.id, p));

      missingParentIds = parents
        .map((p: any) => p.parentId)
        .filter((pid: any): pid is number => pid !== null && !menuMap.has(pid));
    }

    const allResolvedMenus = Array.from(menuMap.values());
    return MenuService.buildTree(allResolvedMenus, null);
  }

  /**
   * Mengambil semua menu dalam format hierarki pohon (Master Menu Tree)
   */
  static async getAllMenusTree(): Promise<MenuItemNode[]> {
    const allMenus = await prisma.menu.findMany({
      orderBy: [{ orderIndex: 'asc' }]
    });

    return MenuService.buildTree(allMenus, null);
  }

  /**
   * Mengambil semua menu dalam format flat (misal untuk dropdown parent saat create/update menu)
   */
  static async getAllMenusFlat() {
    return prisma.menu.findMany({
      orderBy: [{ parentId: 'asc' }, { orderIndex: 'asc' }],
      include: {
        parent: {
          select: { id: true, name: true, code: true }
        }
      }
    });
  }

  /**
   * Dapatkan detail menu berdasarkan ID
   */
  static async getMenuById(id: number) {
    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true
      }
    });

    if (!menu) {
      throw { statusCode: 404, message: 'Menu tidak ditemukan.' };
    }

    return menu;
  }

  /**
   * Kriteria 4: Management menu (dengan multiple level tanpa batas)
   * Tambah menu baru
   */
  static async createMenu(data: {
    name: string;
    code: string;
    icon?: string;
    path?: string;
    orderIndex?: number;
    parentId?: number | null;
    isActive?: boolean;
  }) {
    // Cek apakah code menu sudah dipakai
    const existingCode = await prisma.menu.findUnique({
      where: { code: data.code }
    });
    if (existingCode) {
      throw { statusCode: 400, message: `Kode menu '${data.code}' sudah digunakan.` };
    }

    // Jika ada parentId, pastikan parent valid
    if (data.parentId) {
      const parent = await prisma.menu.findUnique({
        where: { id: data.parentId }
      });
      if (!parent) {
        throw { statusCode: 400, message: 'Parent menu tidak ditemukan.' };
      }
    }

    return prisma.menu.create({
      data: {
        name: data.name,
        code: data.code,
        icon: data.icon || 'file-text',
        path: data.path || null,
        orderIndex: data.orderIndex ?? 0,
        parentId: data.parentId || null,
        isActive: data.isActive ?? true
      }
    });
  }

  /**
   * Update menu yang ada
   */
  static async updateMenu(
    id: number,
    data: {
      name?: string;
      code?: string;
      icon?: string;
      path?: string;
      orderIndex?: number;
      parentId?: number | null;
      isActive?: boolean;
    }
  ) {
    const menu = await prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      throw { statusCode: 404, message: 'Menu tidak ditemukan.' };
    }

    // Validasi pencegahan circular reference (menu tidak boleh jadi parent dari dirinya sendiri)
    if (data.parentId !== undefined && data.parentId !== null) {
      if (data.parentId === id) {
        throw { statusCode: 400, message: 'Sebuah menu tidak dapat dijadikan parent untuk dirinya sendiri.' };
      }

      // Pastikan parentId bukan merupakan salah satu turunan (descendant) dari menu ini
      const isDescendant = await MenuService.checkIsDescendant(id, data.parentId);
      if (isDescendant) {
        throw { statusCode: 400, message: 'Parent menu tidak boleh merupakan submenu/turunan dari menu ini.' };
      }
    }

    // Cek duplikasi code jika code diubah
    if (data.code && data.code !== menu.code) {
      const existing = await prisma.menu.findUnique({ where: { code: data.code } });
      if (existing) {
        throw { statusCode: 400, message: `Kode menu '${data.code}' sudah digunakan.` };
      }
    }

    return prisma.menu.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        icon: data.icon,
        path: data.path,
        orderIndex: data.orderIndex,
        parentId: data.parentId !== undefined ? data.parentId : menu.parentId,
        isActive: data.isActive
      }
    });
  }

  /**
   * Hapus menu beserta cascade turunannya
   */
  static async deleteMenu(id: number) {
    const menu = await prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      throw { statusCode: 404, message: 'Menu tidak ditemukan.' };
    }

    // Prisma cascade delete akan otomatis menghapus children & role_menus jika configured,
    // atau kita hapus secara rekursif/aman.
    return prisma.menu.delete({
      where: { id }
    });
  }

  /**
   * Helper pengecekan circular reference: apakah targetId adalah turunan dari currentId?
   */
  private static async checkIsDescendant(currentId: number, targetId: number): Promise<boolean> {
    let currentTarget = await prisma.menu.findUnique({ where: { id: targetId } });
    while (currentTarget && currentTarget.parentId) {
      if (currentTarget.parentId === currentId) {
        return true;
      }
      currentTarget = await prisma.menu.findUnique({ where: { id: currentTarget.parentId } });
    }
    return false;
  }
}
