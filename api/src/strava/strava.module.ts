import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { StravaService } from "./strava.service";
import { StravaResolver } from "./strava.resolver";

@Module({
  imports: [ConfigModule],
  providers: [StravaService, StravaResolver],
  exports: [StravaService],
})
export class StravaModule {}
