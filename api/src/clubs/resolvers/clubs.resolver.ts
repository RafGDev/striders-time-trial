import {
  Resolver,
  Mutation,
  Args,
  Query,
  ResolveField,
  Parent,
} from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { ClubsService } from "../services/clubs.service";
import { ClubMember } from "../entities/club-member.entity";
import { Club } from "../entities/club.entity";
import { User } from "../../users/entities/user.entity";
import { JoinClubInput } from "../dto/join-club.input";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";

@Resolver(() => ClubMember)
export class ClubsResolver {
  constructor(private readonly clubsService: ClubsService) {}

  @Mutation(() => ClubMember)
  @UseGuards(JwtAuthGuard)
  async joinClub(
    @CurrentUser() user: { id: string },
    @Args("input") input: JoinClubInput
  ): Promise<ClubMember> {
    return this.clubsService.joinClubIfNotMember(user.id, input.inviteCode);
  }

  @Query(() => [ClubMember])
  @UseGuards(JwtAuthGuard)
  async myClubs(@CurrentUser() user: { id: string }): Promise<ClubMember[]> {
    return this.clubsService.getUserClubs(user.id);
  }

  @ResolveField(() => User, { nullable: true })
  async user(@Parent() member: ClubMember): Promise<User | null> {
    if (member.user) return member.user;
    return this.clubsService.getUser(member.userId);
  }

  @ResolveField(() => Club, { nullable: true })
  async club(@Parent() member: ClubMember): Promise<Club | null> {
    if (member.club) return member.club;
    return this.clubsService.getClub(member.clubId);
  }
}
