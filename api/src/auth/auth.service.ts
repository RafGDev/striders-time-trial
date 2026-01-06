import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "@striders/database";
import type { JwtPayload } from "./strategies/jwt.strategy";

export interface StravaUser {
  stravaId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

export interface AuthTokens {
  accessToken: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async handleStravaLogin(stravaUser: StravaUser): Promise<AuthTokens> {
    // Find or create user based on Strava ID
    let user = await this.prisma.user.findUnique({
      where: { stravaId: stravaUser.stravaId },
    });

    const fullName = `${stravaUser.firstName} ${stravaUser.lastName}`;
    const tokenExpiresAt = new Date(stravaUser.expiresAt * 1000);

    if (!user) {
      // Create new user
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
      // Update existing user's avatar and tokens
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

    // Generate JWT
    const payload: JwtPayload = {
      sub: user.id,
      name: user.name,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
