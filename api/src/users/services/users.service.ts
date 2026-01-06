import { Injectable } from "@nestjs/common";
import { PrismaService } from "@striders/database";
import { CreateUserInput } from "../dto/create-user.input";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(input: CreateUserInput) {
    return this.prisma.user.create({
      data: {
        name: input.name,
      },
    });
  }
}
