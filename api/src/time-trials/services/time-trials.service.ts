import { Injectable } from "@nestjs/common";
import { PrismaService } from "@striders/database";
import { CreateTimeTrialInput } from "../dto/create-time-trial.input";

@Injectable()
export class TimeTrialsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.timeTrial.findUnique({
      where: { id },
      include: { user: true, event: { include: { course: true } } },
    });
  }

  async findByEvent(eventId: string) {
    return this.prisma.timeTrial.findMany({
      where: { eventId },
      include: { user: true, event: { include: { course: true } } },
    });
  }

  async findByCourse(courseId: string) {
    return this.prisma.timeTrial.findMany({
      where: {
        event: { courseId },
      },
      include: { user: true, event: { include: { course: true } } },
    });
  }

  async findByUserAndClub(userId: string, clubId: string) {
    return this.prisma.timeTrial.findMany({
      where: {
        userId,
        event: { clubId },
      },
      include: { user: true, event: { include: { course: true, club: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(input: CreateTimeTrialInput) {
    return this.prisma.timeTrial.create({
      data: {
        timeMs: input.timeMs,
        userId: input.userId,
        eventId: input.eventId,
      },
      include: { user: true, event: { include: { course: true } } },
    });
  }

  async getEvent(eventId: string) {
    return this.prisma.event.findUnique({
      where: { id: eventId },
      include: { course: true, club: true },
    });
  }

  async getUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
