import type { Request } from 'express';

/** JWT 鉴权后的请求对象，req.user 包含 token payload */
export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    username: string;
    role: string;
  };
}
