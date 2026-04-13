import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const emailConfirmationToken = uuidv4();

    await this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      emailConfirmationToken,
      emailConfirmationSentAt: new Date(),
    });

    await this.mailService.sendConfirmationEmail(dto.email, emailConfirmationToken);

    return { message: 'Registration successful. Please check your email to confirm your account.' };
  }

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Partial<User>;
  }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailConfirmed) {
      throw new UnauthorizedException('Please confirm your email before logging in');
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Partial<User>;
  }> {
    const tokenHash = this.hashToken(dto.refreshToken);
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash, isRevoked: false },
      relations: ['user'],
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old token (rotation)
    storedToken.isRevoked = true;
    await this.refreshTokenRepository.save(storedToken);

    const tokens = await this.generateTokens(storedToken.user);

    return {
      ...tokens,
      user: this.sanitizeUser(storedToken.user),
    };
  }

  async logout(dto: RefreshTokenDto): Promise<{ message: string }> {
    const tokenHash = this.hashToken(dto.refreshToken);
    await this.refreshTokenRepository.update(
      { tokenHash },
      { isRevoked: true },
    );
    return { message: 'Logged out successfully' };
  }

  async confirmEmail(token: string): Promise<{ message: string }> {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const userByToken = await this.findUserByConfirmationToken(token);

    if (!userByToken) {
      throw new BadRequestException('Invalid or expired confirmation token');
    }

    // Check token expiry (24 hours)
    if (
      userByToken.emailConfirmationSentAt &&
      Date.now() - userByToken.emailConfirmationSentAt.getTime() > 24 * 60 * 60 * 1000
    ) {
      throw new BadRequestException('Confirmation token has expired');
    }

    userByToken.isEmailConfirmed = true;
    userByToken.emailConfirmationToken = null;
    userByToken.emailConfirmationSentAt = null;
    await this.usersService.save(userByToken);

    return { message: 'Email confirmed successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If an account exists with this email, a reset link has been sent.' };
    }

    const resetToken = uuidv4();
    user.passwordResetToken = resetToken;
    user.passwordResetSentAt = new Date();
    await this.usersService.save(user);

    await this.mailService.sendPasswordResetEmail(dto.email, resetToken);

    return { message: 'If an account exists with this email, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.findUserByResetToken(dto.token);

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check token expiry (1 hour)
    if (
      user.passwordResetSentAt &&
      Date.now() - user.passwordResetSentAt.getTime() > 60 * 60 * 1000
    ) {
      throw new BadRequestException('Reset token has expired');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    user.passwordResetToken = null;
    user.passwordResetSentAt = null;
    await this.usersService.save(user);

    // Revoke all refresh tokens for security
    await this.refreshTokenRepository.update(
      { userId: user.id },
      { isRevoked: true },
    );

    return { message: 'Password reset successfully' };
  }

  async getMe(userId: string): Promise<Partial<User>> {
    const user = await this.usersService.findById(userId);
    return this.sanitizeUser(user);
  }

  // --- Private helpers ---

  private async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload);

    const refreshTokenRaw = uuidv4();
    const refreshExpiration = this.configService.get<string>('jwt.refreshExpiration', '7d');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(refreshExpiration) || 7);

    await this.refreshTokenRepository.save({
      userId: user.id,
      tokenHash: this.hashToken(refreshTokenRaw),
      expiresAt,
    });

    return { accessToken, refreshToken: refreshTokenRaw };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private sanitizeUser(user: User): Partial<User> {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
  }

  private async findUserByConfirmationToken(token: string): Promise<User | null> {
    return this.usersService['userRepository'].findOne({
      where: { emailConfirmationToken: token },
    });
  }

  private async findUserByResetToken(token: string): Promise<User | null> {
    return this.usersService['userRepository'].findOne({
      where: { passwordResetToken: token },
    });
  }
}
