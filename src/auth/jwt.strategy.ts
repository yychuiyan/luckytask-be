import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

const jwtSecret: string = process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET 环境变量未设置，请在 .env 文件中配置'); })();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: { sub: number; username: string; role?: string }) {
    return { id: payload.sub, username: payload.username, role: payload.role || 'user' };
  }
}
