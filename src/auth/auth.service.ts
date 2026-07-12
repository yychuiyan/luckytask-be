import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as svgCaptcha from 'svg-captcha';
import { User } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, password: string, nickname: string) {
    const exists = await this.userRepo.findOne({ where: { username } });
    if (exists) {
      throw new ConflictException('注册失败，请检查输入信息');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ username, passwordHash, nickname });
    await this.userRepo.save(user);

    const token = this.signToken(user);
    return { token, user: this.sanitizeUser(user) };
  }

  async login(
    username: string,
    password: string,
    captchaId: string,
    captchaCode: string,
  ) {
    // 验证码校验
    if (
      !captchaId ||
      !captchaCode ||
      !this.verifyCaptcha(captchaId, captchaCode)
    ) {
      throw new UnauthorizedException('验证码错误');
    }

    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const token = this.signToken(user);
    return { token, user: this.sanitizeUser(user) };
  }

  generateCaptcha() {
    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: '0o1il',
      noise: 2,
      color: true,
    });
    const captchaId = this.jwtService.sign(
      { answer: captcha.text.toLowerCase() },
      { expiresIn: '2m' },
    );
    return { captchaId, svg: captcha.data };
  }

  private verifyCaptcha(captchaId: string, code: string): boolean {
    try {
      const payload = this.jwtService.verify<{ answer: string }>(captchaId);
      return payload.answer === code.toLowerCase();
    } catch {
      return false;
    }
  }

  async getMe(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
    return this.sanitizeUser(user);
  }

  private signToken(user: User) {
    return this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
