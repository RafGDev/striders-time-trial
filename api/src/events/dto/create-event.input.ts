import { InputType, Field } from "@nestjs/graphql";
import { IsString, IsNotEmpty, IsDateString } from "class-validator";

@InputType()
export class CreateEventInput {
  @Field(() => String)
  @IsDateString()
  date: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  clubId: string;
}
