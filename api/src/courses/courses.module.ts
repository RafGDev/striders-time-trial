import { Module } from "@nestjs/common";
import { CoursesResolver } from "./resolvers/courses.resolver";
import { CoursesService } from "./services/courses.service";

@Module({
  providers: [CoursesResolver, CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
