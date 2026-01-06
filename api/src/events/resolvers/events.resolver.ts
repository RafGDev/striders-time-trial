import { Args, Query, Resolver, ResolveField, Parent } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { Event } from "../entities/event.entity";
import { EventsService } from "../services/events.service";
import { TimeTrial } from "../../time-trials/entities/time-trial.entity";
import { Club } from "../../clubs/entities/club.entity";
import { Course } from "../../courses/entities/course.entity";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";

@Resolver(() => Event)
export class EventsResolver {
  constructor(private readonly eventsService: EventsService) {}

  @Query(() => [Event], { name: "events" })
  @UseGuards(JwtAuthGuard)
  findByClub(@Args("clubId", { type: () => String }) clubId: string) {
    return this.eventsService.findByClubId(clubId);
  }

  @Query(() => Event, { name: "event", nullable: true })
  findOne(@Args("id", { type: () => String }) id: string) {
    return this.eventsService.findOne(id);
  }

  @Query(() => Event, {
    name: "latestEventByCourseName",
    nullable: true,
    description: "Get the most recent event for a course by course name",
  })
  findLatestByCourseName(
    @Args("courseName", { type: () => String }) courseName: string
  ) {
    return this.eventsService.findLatestByCourseName(courseName);
  }

  @ResolveField(() => TimeTrial, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async myTimeTrial(
    @Parent() event: Event,
    @CurrentUser() user: { id: string }
  ): Promise<TimeTrial | null> {
    return this.eventsService.getUserTimeTrialForEvent(event.id, user.id);
  }

  @ResolveField(() => Club, { nullable: true })
  async club(@Parent() event: Event): Promise<Club | null> {
    if (event.club) return event.club;
    return this.eventsService.getClub(event.clubId);
  }

  @ResolveField(() => Course, { nullable: true })
  async course(@Parent() event: Event): Promise<Course | null> {
    if (event.course) return event.course;
    return this.eventsService.getCourse(event.courseId);
  }

  @ResolveField(() => [TimeTrial], { nullable: true })
  async timeTrials(@Parent() event: Event): Promise<TimeTrial[]> {
    if (event.timeTrials) return event.timeTrials;
    return this.eventsService.getTimeTrials(event.id);
  }
}
