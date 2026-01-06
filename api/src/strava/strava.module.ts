import { Module } from "@nestjs/common";
import { StravaService } from "./strava.service";
import { StravaResolver } from "./strava.resolver";

@Module({
  providers: [StravaService, StravaResolver],
  exports: [StravaService],
})
export class StravaModule {}
