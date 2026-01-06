import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { GqlExecutionContext } from "@nestjs/graphql";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  getRequest(context: ExecutionContext) {
    // Handle both REST and GraphQL contexts
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext();

    // If it's a GraphQL request, get the request from context
    if (gqlContext.req) {
      return gqlContext.req;
    }

    // Otherwise it's a REST request
    return context.switchToHttp().getRequest();
  }
}
