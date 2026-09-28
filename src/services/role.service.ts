import { prisma } from '../config/prisma.js';

export class RoleService {
  /**
   * Mengambil semua role aktif
   */
  static async getAllRoles() {
    return prisma.role.findMany({
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: {
            users: true,
            menus: true
          }
        }
      }
    });
  }

  /**
   * Dapatkan detail role by ID
   */
  static async getRoleById(id: number) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        menus: {
          include: {
            menu: true
          }
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!role) {
      throw { statusCode: 404, message: 'Role tidak ditemukan.' };
    }

    return role;
  }

  /**
   * Tambah Role baru
   */
  static async createRole(data: { name: string; code: string; description?: string }) {
    const existing = await prisma.role.findFirst({
      where: {
        OR: [{ name: data.name }, { code: data.code }]
      }
    });

    if (existing) {
      throw { statusCode: 400, message: 'Nama role atau kode role sudah terdaftar.' };
    }

    return prisma.role.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        isActive: true
      }
    });
  }

  /**
   * Update Role
   */
  static async updateRole(id: number, data: { name?: string; code?: string; description?: string; isActive?: boolean }) {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw { statusCode: 404, message: 'Role tidak ditemukan.' };
    }

    return prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code ? data.code.toUpperCase() : undefined,
        description: data.description,
        isActive: data.isActive
      }
    });
  }

  /**
   * Hapus Role
   */
  static async deleteRole(id: number) {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw { statusCode: 404, message: 'Role tidak ditemukan.' };
    }

    return prisma.role.delete({ where: { id } });
  }

  /**
   * Kriteria 4: Management access role
   * Ambil daftar menu IDs yang memiliki hak akses untuk role tertentu
   */
  static async getRoleMenuPermissions(roleId: number) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw { statusCode: 404, message: 'Role tidak ditemukan.' };
    }

    const roleMenus = await prisma.roleMenu.findMany({
      where: { roleId },
      select: {
        menuId: true
      }
    });

    return {
      roleId,
      roleName: role.name,
      roleCode: role.code,
      assignedMenuIds: roleMenus.map((rm: { menuId: number }) => rm.menuId)
    };
  }

  /**
   * Kriteria 4: Management access role
   * Assign / Sinkronisasi izin menu ke role tertentu
   */
  static async updateRoleMenuPermissions(roleId: number, menuIds: number[]) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw { statusCode: 404, message: 'Role tidak ditemukan.' };
    }

    // Jalankan dalam transaction: hapus menu lama, pasang menu baru
    return prisma.$transaction(async (tx: any) => {
      // 1. Hapus semua permission lama
      await tx.roleMenu.deleteMany({
        where: { roleId }
      });

      // 2. Insert permission baru
      if (menuIds.length > 0) {
        await tx.roleMenu.createMany({
          data: menuIds.map((menuId: number) => ({
            roleId,
            menuId
          })),
          skipDuplicates: true
        });
      }

      const updated = await tx.roleMenu.findMany({
        where: { roleId },
        select: { menuId: true }
      });

      return {
        message: `Izin akses menu untuk role '${role.name}' berhasil diperbarui.`,
        roleId,
        assignedMenuCount: updated.length,
        assignedMenuIds: updated.map((rm: { menuId: number }) => rm.menuId)
      };
    });
  }
}
