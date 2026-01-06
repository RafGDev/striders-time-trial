import { Module } from "@nestjs/common";
import { ClubsResolver } from "./resolvers/clubs.resolver";
import { ClubsService } from "./services/clubs.service";

@Module({
  providers: [ClubsResolver, ClubsService],
  exports: [ClubsService],
})
export class ClubsModule {}
