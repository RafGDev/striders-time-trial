import { Resolver, Query, Args, ObjectType, Field, Int } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { StravaService } from "./strava.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ObjectType()
export class StravaActivity {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  type: string;

  @Field(() => Int, { description: "Distance in meters" })
  distance: number;

  @Field(() => Int, { description: "Moving time in seconds" })
  movingTime: number;

  @Field(() => Int, { description: "Elapsed time in seconds" })
  elapsedTime: number;

  @Field(() => String)
  startDate: string;

  @Field(() => String)
  startDateLocal: string;
}

@Resolver()
export class StravaResolver {
  constructor(private readonly stravaService: StravaService) {}

  @Query(() => [StravaActivity], {
    name: "stravaActivities",
    description: "Get recent running activities from Strava",
  })
  @UseGuards(JwtAuthGuard)
  async getStravaActivities(
    @CurrentUser() user: { id: string },
    @Args("after", { type: () => String, nullable: true }) after?: string,
    @Args("before", { type: () => String, nullable: true }) before?: string
  ): Promise<StravaActivity[]> {
    const activities = await this.stravaService.getActivities(user.id, {
      after: after ? new Date(after) : undefined,
      before: before ? new Date(before) : undefined,
    });

    return activities.map((a) => ({
      id: String(a.id),
      name: a.name,
      type: a.type,
      distance: Math.round(a.distance),
      movingTime: a.moving_time,
      elapsedTime: a.elapsed_time,
      startDate: a.start_date,
      startDateLocal: a.start_date_local,
    }));
  }
}
