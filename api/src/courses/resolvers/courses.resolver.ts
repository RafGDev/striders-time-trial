import { Resolver } from "@nestjs/graphql";
import { Course } from "../entities/course.entity";

@Resolver(() => Course)
export class CoursesResolver {}
