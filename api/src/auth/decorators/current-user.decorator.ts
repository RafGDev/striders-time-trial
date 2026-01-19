import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import type { FastifyRequest } from "fastify";

interface GqlContext {
  req?: FastifyRequest & { user?: unknown };
}

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<GqlContext>();

    if (gqlContext.req) {
      return gqlContext.req.user;
    }

    return (context.switchToHttp().getRequest<FastifyRequest>() as FastifyRequest & { user?: unknown }).user;
  },
);
