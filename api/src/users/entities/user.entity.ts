import { ObjectType, Field } from "@nestjs/graphql";

@ObjectType()
export class User {
  @Field(() => String, { description: "Unique identifier" })
  id: string;

  @Field(() => String, { description: "User name" })
  name: string;

  @Field(() => String, { nullable: true, description: "Avatar URL" })
  avatarUrl?: string | null;

  @Field(() => String, { nullable: true, description: "Strava ID" })
  stravaId?: string | null;
}
