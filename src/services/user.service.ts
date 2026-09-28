import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';

export class UserService {
  /**
   * Ambil semua user beserta role mereka
   */
  static async getAllUsers() {
    const users = await prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      createdAt: u.createdAt,
      roles: u.roles.map((ur) => ur.role)
    }));
  }

  /**
   * Detail user by ID
   */
  static async getUserById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      throw { statusCode: 404, message: 'User tidak ditemukan.' };
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      roles: user.roles.map((ur) => ur.role)
    };
  }

  /**
   * Buat user / karyawan baru
   */
  static async createUser(data: {
    username: string;
    password?: string;
    name: string;
    email?: string;
    roleIds: number[];
  }) {
    const existing = await prisma.user.findUnique({
      where: { username: data.username }
    });

    if (existing) {
      throw { statusCode: 400, message: `Username '${data.username}' sudah digunakan.` };
    }

    const hashedPassword = await bcrypt.hash(data.password || 'password123', 10);

    return prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        name: data.name,
        email: data.email,
        roles: {
          create: data.roleIds.map((roleId) => ({ roleId }))
        }
      },
      include: {
        roles: {
          include: { role: true }
        }
      }
    });
  }

  /**
   * Assign / Update daftar role untuk karyawan (Kriteria 2: Mendukung jabatan ganda / single jabatan)
   */
  static async assignRolesToUser(userId: number, roleIds: number[]) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw { statusCode: 404, message: 'User tidak ditemukan.' };
    }

    return prisma.$transaction(async (tx) => {
      // Hapus role lama
      await tx.userRole.deleteMany({
        where: { userId }
      });

      // Tambahkan role baru
      if (roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({
            userId,
            roleId
          }))
        });
      }

      const updated = await tx.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: { role: true }
          }
        }
      });

      return {
        message: 'Role karyawan berhasil diperbarui.',
        user: {
          id: updated?.id,
          username: updated?.username,
          name: updated?.name,
          roles: updated?.roles.map((ur) => ur.role)
        }
      };
    });
  }
}
