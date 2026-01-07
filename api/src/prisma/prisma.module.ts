import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@striders/database";
import type { EnvironmentVariables } from "../config/env.config";

const PrismaServiceProvider = {
  provide: PrismaService,
  useFactory: (configService: ConfigService<EnvironmentVariables, true>) => {
    const dbConfig = configService.get("database", { infer: true });
    return new PrismaService(dbConfig?.url);
  },
  inject: [ConfigService],
};

@Global()
@Module({
  providers: [PrismaServiceProvider],
  exports: [PrismaService],
})
export class PrismaModule {}
