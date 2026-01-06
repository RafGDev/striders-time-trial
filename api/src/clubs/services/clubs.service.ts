import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@striders/database";
import { ClubMember } from "../entities/club-member.entity";
import { User } from "src/users/entities/user.entity";
import { Club } from "../entities/club.entity";

@Injectable()
export class ClubsService {
  constructor(private prisma: PrismaService) {}

  async joinClubIfNotMember(
    userId: string,
    inviteCode: string
  ): Promise<ClubMember> {
    // Find club by invite code
    const club = await this.prisma.club.findUnique({
      where: { inviteCode },
    });

    if (!club) {
      throw new BadRequestException("Invalid invite code");
    }

    // Check if user is already a member
    const existingMembership = await this.prisma.clubMember.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId: club.id,
        },
      },
    });

    if (existingMembership) return existingMembership;

    return this.prisma.clubMember.create({
      data: {
        userId,
        clubId: club.id,
        role: "member",
      },
    });
  }

  async getUserClubs(userId: string) {
    return this.prisma.clubMember.findMany({
      where: { userId },
    });
  }

  async getUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async getClub(clubId: string): Promise<Club> {
    const club = await this.prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new NotFoundException("Club not found");
    return club;
  }
}
