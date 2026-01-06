import { InputType, Field, Int } from "@nestjs/graphql";
import { IsString, IsNotEmpty, IsInt, Min } from "class-validator";

@InputType()
export class SubmitTimeTrialInput {
  @Field(() => String, { description: "Event ID to submit time for" })
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @Field(() => Int, { description: "Time in milliseconds" })
  @IsInt()
  @Min(0)
  timeMs: number;
}
