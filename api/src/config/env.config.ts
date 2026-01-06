import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  validateSync,
} from "class-validator";
import { plainToInstance, Type } from "class-transformer";

export class DatabaseConfig {
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class AwsConfig {
  @IsString()
  @IsNotEmpty()
  region: string;

  @IsString()
  @IsOptional()
  endpoint?: string;

  @IsString()
  @IsOptional()
  accessKeyId?: string;

  @IsString()
  @IsOptional()
  secretAccessKey?: string;
}

export class SnsConfig {
  @IsString()
  @IsOptional()
  eventsTopicArn?: string;
}

export class StravaConfig {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @IsString()
  @IsNotEmpty()
  callbackUrl: string;
}

export class JwtConfig {
  @IsString()
  @IsNotEmpty()
  secret: string;

  @IsString()
  @IsOptional()
  expiresIn: string;
}

export class EnvironmentVariables {
  @Type(() => DatabaseConfig)
  database: DatabaseConfig;

  @Type(() => AwsConfig)
  aws: AwsConfig;

  @Type(() => SnsConfig)
  sns: SnsConfig;

  @Type(() => StravaConfig)
  strava: StravaConfig;

  @Type(() => JwtConfig)
  jwt: JwtConfig;

  @IsNumber()
  port: number;

  @IsString()
  @IsNotEmpty()
  appUrl: string;
}

export function validate(
  config: Record<string, unknown>
): EnvironmentVariables {
  const transformedConfig = {
    database: {
      url: config.DATABASE_URL,
    },
    aws: {
      region: config.AWS_REGION || "us-east-1",
      endpoint: config.AWS_ENDPOINT,
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
    sns: {
      eventsTopicArn: config.SNS_EVENTS_TOPIC_ARN,
    },
    strava: {
      clientId: config.STRAVA_CLIENT_ID,
      clientSecret: config.STRAVA_CLIENT_SECRET,
      callbackUrl:
        config.STRAVA_CALLBACK_URL ||
        "http://localhost:3000/auth/strava/callback",
    },
    jwt: {
      secret: config.JWT_SECRET || "development-secret-change-in-production",
      expiresIn: config.JWT_EXPIRES_IN || "7d",
    },
    port: parseInt(config.PORT as string, 10) || 3000,
    appUrl: config.APP_URL || "http://localhost:3000",
  };

  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    transformedConfig,
    {
      enableImplicitConversion: true,
    }
  );

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.toString()}`);
  }

  return validatedConfig;
}
