export interface JwtPayload {
  userId: number;
  username: string;
  name: string;
  roleId: number;
  roleCode: string;
  roleName: string;
  iat?: number;
  exp?: number;
}

export interface PreAuthJwtPayload {
  userId: number;
  username: string;
  name: string;
  roles: {
    id: number;
    name: string;
    code: string;
  }[];
  isDualRole: boolean;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
