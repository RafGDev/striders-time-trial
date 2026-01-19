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
    inviteCode: string,
  ): Promise<ClubMember> {
    // First, try to find club by regular invite code
    let club = await this.prisma.club.findUnique({
      where: { inviteCode },
    });

    let role: "member" | "admin" = "member";

    // If not found, try admin invite code
    if (!club) {
      club = await this.prisma.club.findUnique({
        where: { adminInviteCode: inviteCode },
      });

      if (club) {
        role = "admin";
      }
    }

    const clubs = await this.prisma.club.findMany();
    console.log("clubs", clubs);

    if (!club) {
      throw new BadRequestException("Invalid invite code");
    }

    const existingMembership = await this.prisma.clubMember.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId: club.id,
        },
      },
    });

    // If already a member, optionally upgrade to admin if using admin code
    if (existingMembership) {
      if (role === "admin" && existingMembership.role !== "admin") {
        return this.prisma.clubMember.update({
          where: { id: existingMembership.id },
          data: { role: "admin" },
        });
      }
      return existingMembership;
    }

    return this.prisma.clubMember.create({
      data: {
        userId,
        clubId: club.id,
        role,
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
