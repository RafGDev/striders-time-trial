import { Resolver, Query } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { Course } from "../entities/course.entity";
import { CoursesService } from "../services/courses.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

@Resolver(() => Course)
export class CoursesResolver {
  constructor(private readonly coursesService: CoursesService) {}

  @Query(() => [Course], { name: "courses" })
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.coursesService.findAll();
  }
}
