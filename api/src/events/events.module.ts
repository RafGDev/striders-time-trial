import { Module } from "@nestjs/common";
import { EventsResolver } from "./resolvers/events.resolver";
import { EventsService } from "./services/events.service";

@Module({
  providers: [EventsResolver, EventsService],
  exports: [EventsService],
})
export class EventsModule {}
