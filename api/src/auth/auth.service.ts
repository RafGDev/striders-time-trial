import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "@striders/database";
import { randomBytes } from "crypto";
import type { JwtPayload } from "./strategies/jwt.strategy";

export interface StravaUser {
  stravaId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private generateRefreshToken(): string {
    return randomBytes(64).toString("hex");
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = this.generateRefreshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async handleStravaLogin(stravaUser: StravaUser): Promise<AuthTokens> {
    let user = await this.prisma.user.findUnique({
      where: { stravaId: stravaUser.stravaId },
    });

    const fullName = `${stravaUser.firstName} ${stravaUser.lastName}`;
    const tokenExpiresAt = new Date(stravaUser.expiresAt * 1000);

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: fullName,
          stravaId: stravaUser.stravaId,
          avatarUrl: stravaUser.avatarUrl,
          stravaAccessToken: stravaUser.accessToken,
          stravaRefreshToken: stravaUser.refreshToken,
          stravaTokenExpiresAt: tokenExpiresAt,
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          avatarUrl: stravaUser.avatarUrl,
          stravaAccessToken: stravaUser.accessToken,
          stravaRefreshToken: stravaUser.refreshToken,
          stravaTokenExpiresAt: tokenExpiresAt,
        },
      });
    }

    const payload: JwtPayload = {
      sub: user.id,
      name: user.name,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new UnauthorizedException("Refresh token expired");
    }

    // Delete the old refresh token (rotation for security)
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Create new tokens
    const payload: JwtPayload = {
      sub: storedToken.user.id,
      name: storedToken.user.name,
    };

    const newAccessToken = await this.jwtService.signAsync(payload);
    const newRefreshToken = await this.createRefreshToken(storedToken.user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
