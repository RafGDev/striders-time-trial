import { InputType, Field, Int } from "@nestjs/graphql";
import { IsString, IsNotEmpty, IsInt, Min } from "class-validator";

@InputType()
export class CreateTimeTrialInput {
  @Field(() => Int, { description: "Time in milliseconds" })
  @IsInt()
  @Min(0)
  timeMs: number;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  userId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  eventId: string;
}
