import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User, UserRole } from './user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    const mockJwt = {
      sign: jest.fn().mockReturnValue('test-token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get(AuthService);
    userRepo = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('should throw ConflictException if username exists', async () => {
      userRepo.findOne.mockResolvedValue({ id: 1 } as unknown as User);
      await expect(service.register('test', 'pass123', 'Test')).rejects.toThrow(
        '注册失败',
      );
    });

    it('should create user and return token', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue({
        username: 'test',
        nickname: 'Test',
      } as unknown as User);
      userRepo.save.mockResolvedValue({
        id: 1,
        username: 'test',
        nickname: 'Test',
        role: UserRole.USER,
        createdAt: new Date(),
      } as unknown as User);

      const result = await service.register('test', 'pass123', 'Test');

      expect(result.token).toBe('test-token');
      expect(result.user.username).toBe('test');
    });
  });

  describe('login', () => {
    it('should throw if captcha invalid', async () => {
      await expect(
        service.login('test', 'pass', 'invalid-id', 'wrong'),
      ).rejects.toThrow('验证码错误');
    });

    it('should throw if user not found', async () => {
      // mock captcha valid, but user not found
      jwtService.verify.mockReturnValue({ answer: 'abcd' });
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login('test', 'pass', 'valid-id', 'abcd'),
      ).rejects.toThrow('用户名或密码错误');
    });

    it('should return token on successful login', async () => {
      const mockUser = {
        id: 1,
        username: 'test',
        passwordHash: await bcrypt.hash('pass123', 10),
        nickname: 'Test',
        role: UserRole.USER,
        createdAt: new Date(),
        avatarUrl: null,
      } as unknown as User;

      jwtService.verify.mockReturnValue({ answer: 'abcd' });
      userRepo.findOne.mockResolvedValue(mockUser);

      const result = await service.login('test', 'pass123', 'valid-id', 'abcd');

      expect(result.token).toBe('test-token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('getMe', () => {
    it('should throw if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.getMe(999)).rejects.toThrow('用户不存在');
    });
  });
});
