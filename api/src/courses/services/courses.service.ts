import { Injectable } from "@nestjs/common";
import { PrismaService } from "@striders/database";
import { CreateCourseInput } from "../dto/create-course.input";

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.course.findMany();
  }

  async findOne(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
    });
  }

  async create(input: CreateCourseInput) {
    return this.prisma.course.create({
      data: {
        name: input.name,
        distanceKm: input.distanceKm,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.course.delete({
      where: { id },
    });
  }
}
