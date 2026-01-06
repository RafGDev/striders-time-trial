import { Injectable } from "@nestjs/common";
import { PrismaService } from "@striders/database";
import { CreateEventInput } from "../dto/create-event.input";

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.event.findMany({
      include: { course: true, club: true },
    });
  }

  async findByClubId(clubId: string) {
    return this.prisma.event.findMany({
      where: { clubId },
      include: { course: true, club: true },
      orderBy: { date: "asc" },
    });
  }

  async getUserTimeTrialForEvent(eventId: string, userId: string) {
    return this.prisma.timeTrial.findFirst({
      where: { eventId, userId },
    });
  }

  async findOne(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        course: true,
        club: true,
        timeTrials: { include: { user: true } },
      },
    });
  }

  async findLatestByCourseName(courseName: string) {
    return this.prisma.event.findFirst({
      where: {
        course: { name: courseName },
      },
      orderBy: { date: "desc" },
      include: {
        course: true,
        club: true,
        timeTrials: { include: { user: true } },
      },
    });
  }

  async create(input: CreateEventInput) {
    return this.prisma.event.create({
      data: {
        date: new Date(input.date),
        courseId: input.courseId,
        clubId: input.clubId,
      },
      include: { course: true, club: true },
    });
  }

  async delete(id: string) {
    return this.prisma.event.delete({
      where: { id },
      include: { course: true, club: true },
    });
  }

  async getClub(clubId: string) {
    return this.prisma.club.findUnique({
      where: { id: clubId },
    });
  }

  async getCourse(courseId: string) {
    return this.prisma.course.findUnique({
      where: { id: courseId },
    });
  }

  async getTimeTrials(eventId: string) {
    return this.prisma.timeTrial.findMany({
      where: { eventId },
      include: { user: true },
      orderBy: { timeMs: "asc" },
    });
  }
}
