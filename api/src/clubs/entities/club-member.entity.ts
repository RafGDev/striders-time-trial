import { ObjectType, Field } from "@nestjs/graphql";
import { Club } from "./club.entity";
import { User } from "../../users/entities/user.entity";

@ObjectType()
export class ClubMember {
  @Field(() => String)
  id: string;

  @Field(() => String)
  role: string;

  @Field(() => String)
  userId: string;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => String)
  clubId: string;

  @Field(() => Club, { nullable: true })
  club?: Club;

  @Field(() => Date)
  joinedAt: Date;
}
