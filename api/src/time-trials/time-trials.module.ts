import { Module } from "@nestjs/common";
import { TimeTrialsResolver } from "./resolvers/time-trials.resolver";
import { TimeTrialsService } from "./services/time-trials.service";

@Module({
  providers: [TimeTrialsResolver, TimeTrialsService],
  exports: [TimeTrialsService],
})
export class TimeTrialsModule {}
