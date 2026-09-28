import { Request, Response, NextFunction } from 'express';

export const requireRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Pengguna tidak terautentikasi.'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.roleCode)) {
      res.status(403).json({
        success: false,
        message: `Akses ditolak: Role '${req.user.roleName}' tidak memiliki izin untuk fitur ini.`
      });
      return;
    }

    next();
  };
};
