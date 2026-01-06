import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext();

    // GraphQL context
    if (gqlContext.req) {
      return gqlContext.req.user;
    }

    // REST context
    return context.switchToHttp().getRequest().user;
  }
);
