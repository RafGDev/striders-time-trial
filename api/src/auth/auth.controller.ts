import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { FastifyReply } from "fastify";
import { AuthService } from "./auth.service";
import type { EnvironmentVariables } from "../config/env.config";

class ExchangeTokenDto {
  code: string;
  redirectUri: string;
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<EnvironmentVariables, true>
  ) {}

  /**
   * Initiates Strava OAuth flow
   * Redirect users here to start login
   */
  @Get("strava")
  async stravaLogin(@Res() res: FastifyReply) {
    const stravaConfig = this.configService.get("strava", { infer: true });

    const authUrl = new URL("https://www.strava.com/oauth/authorize");
    authUrl.searchParams.set("client_id", stravaConfig.clientId);
    authUrl.searchParams.set("redirect_uri", stravaConfig.callbackUrl);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "read,activity:read");

    return res.status(302).redirect(authUrl.toString());
  }

  /**
   * Strava OAuth callback
   * Strava redirects here after user authorizes
   */
  @Get("strava/callback")
  async stravaCallback(
    @Query("code") code: string,
    @Query("error") error: string,
    @Res() res: FastifyReply
  ) {
    if (error) {
      throw new BadRequestException(`Strava authorization failed: ${error}`);
    }

    if (!code) {
      throw new BadRequestException("No authorization code received");
    }

    const stravaConfig = this.configService.get("strava", { infer: true });
    const appUrl = this.configService.get("appUrl", { infer: true });

    // Exchange code for access token
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: stravaConfig.clientId,
        client_secret: stravaConfig.clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      throw new UnauthorizedException("Failed to exchange code for token");
    }

    const tokenData = await tokenResponse.json();

    // Strava returns athlete info in the token response
    const stravaUser = {
      stravaId: String(tokenData.athlete.id),
      firstName: tokenData.athlete.firstname,
      lastName: tokenData.athlete.lastname,
      avatarUrl: tokenData.athlete.profile,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at,
    };

    const tokens = await this.authService.handleStravaLogin(stravaUser);

    // Redirect to frontend with token
    const redirectUrl = new URL("/auth/callback", appUrl);
    redirectUrl.searchParams.set("token", tokens.accessToken);
    redirectUrl.searchParams.set("userId", tokens.user.id);

    return res.status(302).redirect(redirectUrl.toString());
  }

  /**
   * Exchange Strava authorization code for JWT token
   * Used by mobile apps that handle the OAuth redirect directly
   */
  @Post("strava/token")
  async exchangeStravaToken(@Body() body: ExchangeTokenDto) {
    const { code, redirectUri } = body;

    if (!code) {
      throw new BadRequestException("Authorization code is required");
    }

    if (!redirectUri) {
      throw new BadRequestException("Redirect URI is required");
    }

    const stravaConfig = this.configService.get("strava", { infer: true });

    // Exchange code for access token
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: stravaConfig.clientId,
        client_secret: stravaConfig.clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Strava token exchange failed:", errorData);
      throw new UnauthorizedException("Failed to exchange code for token");
    }

    const tokenData = await tokenResponse.json();

    // Strava returns athlete info in the token response
    const stravaUser = {
      stravaId: String(tokenData.athlete.id),
      firstName: tokenData.athlete.firstname,
      lastName: tokenData.athlete.lastname,
      avatarUrl: tokenData.athlete.profile,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_at,
    };

    const tokens = await this.authService.handleStravaLogin(stravaUser);

    return {
      token: tokens.accessToken,
      user: tokens.user,
    };
  }
}
