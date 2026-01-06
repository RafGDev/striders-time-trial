import { Query, Resolver } from "@nestjs/graphql";
import { UseGuards, UnauthorizedException } from "@nestjs/common";
import { User } from "../entities/user.entity";
import { UsersService } from "../services/users.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, {
    name: "me",
    description: "Get current authenticated user",
  })
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() currentUser: { id: string }): Promise<User> {
    const user = await this.usersService.findById(currentUser.id);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return user;
  }
}
