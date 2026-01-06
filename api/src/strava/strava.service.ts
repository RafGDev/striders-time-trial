import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@striders/database";
import type { EnvironmentVariables } from "../config/env.config";

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_date: string;
  start_date_local: string;
}

@Injectable()
export class StravaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvironmentVariables, true>
  ) {}

  /**
   * Get a valid access token for a user, refreshing if needed
   */
  private async getValidAccessToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        stravaAccessToken: true,
        stravaRefreshToken: true,
        stravaTokenExpiresAt: true,
      },
    });

    if (!user?.stravaAccessToken || !user?.stravaRefreshToken) {
      throw new UnauthorizedException("Strava not connected");
    }

    // Check if token is expired (with 5 min buffer)
    const now = new Date();
    const expiresAt = user.stravaTokenExpiresAt;
    const bufferMs = 5 * 60 * 1000; // 5 minutes

    if (expiresAt && expiresAt.getTime() - bufferMs > now.getTime()) {
      // Token is still valid
      return user.stravaAccessToken;
    }

    // Token expired, refresh it
    return this.refreshToken(userId, user.stravaRefreshToken);
  }

  /**
   * Refresh the Strava access token
   */
  private async refreshToken(
    userId: string,
    refreshToken: string
  ): Promise<string> {
    const stravaConfig = this.configService.get("strava", { infer: true });

    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: stravaConfig.clientId,
        client_secret: stravaConfig.clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new UnauthorizedException("Failed to refresh Strava token");
    }

    const data = await response.json();

    // Update the stored tokens
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        stravaAccessToken: data.access_token,
        stravaRefreshToken: data.refresh_token,
        stravaTokenExpiresAt: new Date(data.expires_at * 1000),
      },
    });

    return data.access_token;
  }

  /**
   * Fetch recent activities from Strava for a user
   */
  async getActivities(
    userId: string,
    options?: {
      after?: Date;
      before?: Date;
      perPage?: number;
    }
  ): Promise<StravaActivity[]> {
    const accessToken = await this.getValidAccessToken(userId);

    const url = new URL("https://www.strava.com/api/v3/athlete/activities");

    if (options?.after) {
      url.searchParams.set(
        "after",
        Math.floor(options.after.getTime() / 1000).toString()
      );
    }
    if (options?.before) {
      url.searchParams.set(
        "before",
        Math.floor(options.before.getTime() / 1000).toString()
      );
    }
    url.searchParams.set("per_page", String(options?.perPage ?? 30));

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Strava API error:", error);
      throw new UnauthorizedException("Failed to fetch Strava activities");
    }

    const activities: StravaActivity[] = await response.json();

    // Filter to only running activities
    return activities.filter(
      (a) =>
        a.type === "Run" ||
        a.sport_type === "Run" ||
        a.type === "VirtualRun" ||
        a.sport_type === "VirtualRun"
    );
  }
}
