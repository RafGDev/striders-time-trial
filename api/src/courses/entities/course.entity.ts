import { ObjectType, Field, Float } from "@nestjs/graphql";

@ObjectType()
export class Course {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => Float)
  distanceKm: number;
}
