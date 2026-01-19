import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { FastifyRequest } from "fastify";

interface GqlContext {
  req?: FastifyRequest;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  getRequest(context: ExecutionContext): FastifyRequest {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<GqlContext>();

    if (gqlContext.req) {
      return gqlContext.req;
    }

    return context.switchToHttp().getRequest<FastifyRequest>();
  }
}
