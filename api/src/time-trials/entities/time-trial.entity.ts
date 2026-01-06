import { ObjectType, Field, Int } from "@nestjs/graphql";
import { User } from "../../users/entities/user.entity";
import { Event } from "../../events/entities/event.entity";

@ObjectType()
export class TimeTrial {
  @Field(() => String)
  id: string;

  @Field(() => Int, { description: "Time in milliseconds" })
  timeMs: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => String)
  userId: string;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => String)
  eventId: string;

  @Field(() => Event, { nullable: true })
  event?: Event;
}
