import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ??
        (() => {
          throw new Error('JWT_SECRET 环境变量未设置，请在 .env 文件中配置');
        })(),
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async validate(payload: { sub: number; username: string; role?: string }) {
    return {
      id: payload.sub,
      username: payload.username,
      role: payload.role || 'user',
    };
  }
}
