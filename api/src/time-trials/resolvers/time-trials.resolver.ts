import {
  Resolver,
  Query,
  Mutation,
  ResolveField,
  Parent,
  Args,
} from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { TimeTrial } from "../entities/time-trial.entity";
import { TimeTrialsService } from "../services/time-trials.service";
import { SubmitTimeTrialInput } from "../dto/submit-time-trial.input";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { Event } from "../../events/entities/event.entity";
import { User } from "../../users/entities/user.entity";

@Resolver(() => TimeTrial)
export class TimeTrialsResolver {
  constructor(private readonly timeTrialsService: TimeTrialsService) {}

  @Query(() => [TimeTrial], {
    name: "myTimeTrials",
    description: "Get all time trials for the current user in a specific club",
  })
  @UseGuards(JwtAuthGuard)
  async myTimeTrials(
    @CurrentUser() user: { id: string },
    @Args("clubId", { type: () => String }) clubId: string,
  ) {
    return this.timeTrialsService.findByUserAndClub(user.id, clubId);
  }

  @Mutation(() => TimeTrial, {
    name: "submitTimeTrial",
    description: "Submit a time trial result for an event",
  })
  @UseGuards(JwtAuthGuard)
  async submitTimeTrial(
    @CurrentUser() user: { id: string },
    @Args("input") input: SubmitTimeTrialInput,
  ) {
    return this.timeTrialsService.create({
      userId: user.id,
      eventId: input.eventId,
      timeMs: input.timeMs,
    });
  }

  @ResolveField(() => Event, { nullable: true })
  async event(@Parent() timeTrial: TimeTrial): Promise<Event | null> {
    if (timeTrial.event) return timeTrial.event;
    return this.timeTrialsService.getEvent(timeTrial.eventId);
  }

  @ResolveField(() => User, { nullable: true })
  async user(@Parent() timeTrial: TimeTrial): Promise<User | null> {
    if (timeTrial.user) return timeTrial.user;
    return this.timeTrialsService.getUser(timeTrial.userId);
  }
}
