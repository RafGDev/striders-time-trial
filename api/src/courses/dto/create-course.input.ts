import { InputType, Field, Float } from "@nestjs/graphql";
import { IsString, IsNotEmpty, IsNumber, Min } from "class-validator";

@InputType()
export class CreateCourseInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  distanceKm: number;
}
