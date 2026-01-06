import { InputType, Field } from "@nestjs/graphql";
import { IsString, IsNotEmpty } from "class-validator";

@InputType()
export class JoinClubInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  inviteCode: string;
}
