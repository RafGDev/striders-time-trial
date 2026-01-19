import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import awsLambdaFastify from "@fastify/aws-lambda";
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { AppModule } from "./app.module";

type LambdaHandler = (
  event: APIGatewayProxyEvent,
  context: Context,
) => Promise<APIGatewayProxyResult>;

let cachedHandler: LambdaHandler;

async function bootstrap(): Promise<LambdaHandler> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: ["error", "warn"] },
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.init();

  const fastifyInstance = app.getHttpAdapter().getInstance();
  return awsLambdaFastify(fastifyInstance, {
    callbackWaitsForEmptyEventLoop: false,
  });
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  if (!cachedHandler) {
    cachedHandler = await bootstrap();
  }

  return cachedHandler(event, context);
};
