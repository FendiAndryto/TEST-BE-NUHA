import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { ENV } from '../config/env.js';
import { JwtPayload, PreAuthJwtPayload } from '../types/auth.types.js';

export class AuthService {
  /**
   * Process employee login
   * Kriteria 1: Login dengan username dan password
   * Kriteria 2: Jika karyawan memiliki jabatan ganda, sistem akan memberi pilihan role
   */
  static async login(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      throw { statusCode: 401, message: 'Username atau password salah / akun tidak aktif.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw { statusCode: 401, message: 'Username atau password salah.' };
    }

    const assignedRoles = user.roles
      .map((ur: { role: any }) => ur.role)
      .filter((r: { isActive: boolean }) => r.isActive);

    if (assignedRoles.length === 0) {
      throw { statusCode: 403, message: 'Akun Anda belum memiliki role aktif yang ditetapkan. Hubungi administrator.' };
    }

    // Kriteria 2: Jabatan Ganda (Multiple Roles)
    if (assignedRoles.length > 1) {
      const preAuthPayload: PreAuthJwtPayload = {
        userId: user.id,
        username: user.username,
        name: user.name,
        isDualRole: true,
        roles: assignedRoles.map((r: { id: number; name: string; code: string }) => ({
          id: r.id,
          name: r.name,
          code: r.code
        }))
      };

      const preAuthToken = jwt.sign(preAuthPayload, ENV.PREAUTH_JWT_SECRET, {
        expiresIn: '15m'
      });

      return {
        requiresRoleSelection: true,
        message: 'Karyawan memiliki jabatan ganda. Silakan pilih role untuk melanjutkan sesi login.',
        preAuthToken,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email
        },
        roles: assignedRoles.map((r: { id: number; name: string; code: string; description: string | null }) => ({
          id: r.id,
          name: r.name,
          code: r.code,
          description: r.description
        }))
      };
    }

    // Single Role: Langsung issue JWT Token
    const primaryRole = assignedRoles[0];
    const jwtPayload: JwtPayload = {
      userId: user.id,
      username: user.username,
      name: user.name,
      roleId: primaryRole.id,
      roleCode: primaryRole.code,
      roleName: primaryRole.name
    };

    const accessToken = jwt.sign(jwtPayload, ENV.JWT_SECRET, {
      expiresIn: '1d'
    });

    return {
      requiresRoleSelection: false,
      message: 'Login berhasil.',
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email
      },
      activeRole: {
        id: primaryRole.id,
        name: primaryRole.name,
        code: primaryRole.code,
        description: primaryRole.description
      },
      availableRoles: [
        {
          id: primaryRole.id,
          name: primaryRole.name,
          code: primaryRole.code,
          description: primaryRole.description
        }
      ]
    };
  }

  /**
   * Selesaikan login jabatan ganda dengan memilih role
   */
  static async selectRole(preAuthToken: string, roleId: number) {
    let decoded: PreAuthJwtPayload;

    try {
      decoded = jwt.verify(preAuthToken, ENV.PREAUTH_JWT_SECRET) as PreAuthJwtPayload;
    } catch (err: any) {
      throw { statusCode: 401, message: 'Sesi pemilihan role tidak valid atau sudah kadaluarsa. Silakan login kembali.' };
    }

    // Verifikasi apakah roleId yang dipilih benar-benar dimiliki oleh user
    const hasRole = decoded.roles.some((r) => r.id === roleId);
    if (!hasRole) {
      throw { statusCode: 403, message: 'Anda tidak memiliki hak akses untuk role yang dipilih.' };
    }

    // Ambil detail role dari database untuk memastikan role masih aktif
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });

    if (!role || !role.isActive) {
      throw { statusCode: 400, message: 'Role tidak ditemukan atau sudah tidak aktif.' };
    }

    // Buat JWT Token Resmi
    const jwtPayload: JwtPayload = {
      userId: decoded.userId,
      username: decoded.username,
      name: decoded.name,
      roleId: role.id,
      roleCode: role.code,
      roleName: role.name
    };

    const accessToken = jwt.sign(jwtPayload, ENV.JWT_SECRET, {
      expiresIn: '1d'
    });

    return {
      message: `Role '${role.name}' berhasil dipilih. Login selesai.`,
      accessToken,
      user: {
        id: decoded.userId,
        username: decoded.username,
        name: decoded.name
      },
      activeRole: {
        id: role.id,
        name: role.name,
        code: role.code,
        description: role.description
      },
      availableRoles: decoded.roles
    };
  }

  /**
   * Switch role secara instan bagi user yang memiliki jabatan ganda
   */
  static async switchRole(userId: number, targetRoleId: number) {
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId: targetRoleId,
        role: {
          isActive: true
        }
      },
      include: {
        user: true,
        role: true
      }
    });

    if (!userRole) {
      throw { statusCode: 403, message: 'Anda tidak memiliki hak akses ke role yang dituju.' };
    }

    const jwtPayload: JwtPayload = {
      userId: userRole.user.id,
      username: userRole.user.username,
      name: userRole.user.name,
      roleId: userRole.role.id,
      roleCode: userRole.role.code,
      roleName: userRole.role.name
    };

    const accessToken = jwt.sign(jwtPayload, ENV.JWT_SECRET, {
      expiresIn: '1d'
    });

    return {
      message: `Berhasil berganti ke role '${userRole.role.name}'.`,
      accessToken,
      activeRole: {
        id: userRole.role.id,
        name: userRole.role.name,
        code: userRole.role.code,
        description: userRole.role.description
      }
    };
  }

  /**
   * Dapatkan profil user saat ini beserta daftar semua role yang dimiliki
   */
  static async getProfile(userId: number, activeRoleId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    const availableRoles = user.roles.map((ur: { role: any }) => ur.role);
    const activeRole = availableRoles.find((r: { id: number }) => r.id === activeRoleId) || availableRoles[0];

    return {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email
      },
      activeRole,
      availableRoles
    };
  }
}
