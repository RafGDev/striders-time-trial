import { ObjectType, Field } from "@nestjs/graphql";

@ObjectType()
export class Club {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  inviteCode: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
