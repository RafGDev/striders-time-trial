import { ObjectType, Field } from "@nestjs/graphql";
import { Course } from "../../courses/entities/course.entity";
import { Club } from "../../clubs/entities/club.entity";
import { TimeTrial } from "../../time-trials/entities/time-trial.entity";

@ObjectType()
export class Event {
  @Field(() => String)
  id: string;

  @Field(() => Date)
  date: Date;

  @Field(() => String)
  courseId: string;

  @Field(() => Course, { nullable: true })
  course?: Course;

  @Field(() => String)
  clubId: string;

  @Field(() => Club, { nullable: true })
  club?: Club;

  @Field(() => [TimeTrial], { nullable: true })
  timeTrials?: TimeTrial[];

  @Field(() => TimeTrial, {
    nullable: true,
    description: "The current user's time trial for this event",
  })
  myTimeTrial?: TimeTrial;
}
