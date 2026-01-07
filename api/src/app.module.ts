import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { MessagingModule } from "@striders/messaging";

import { validate, EnvironmentVariables } from "./config/env.config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { CoursesModule } from "./courses/courses.module";
import { EventsModule } from "./events/events.module";
import { TimeTrialsModule } from "./time-trials/time-trials.module";
import { ClubsModule } from "./clubs/clubs.module";
import { StravaModule } from "./strava/strava.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    PrismaModule,
    MessagingModule.forRootAsync({
      useFactory: (
        configService: ConfigService<EnvironmentVariables, true>
      ) => {
        const awsConfig = configService.get("aws", { infer: true });
        return {
          sns: {
            region: awsConfig?.region ?? "ap-southeast-2",
            endpoint: awsConfig?.endpoint,
            credentials: awsConfig?.accessKeyId
              ? {
                  accessKeyId: awsConfig.accessKeyId,
                  secretAccessKey: awsConfig.secretAccessKey!,
                }
              : undefined,
          },
        };
      },
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: "schema.graphql",
      sortSchema: true,
      playground: true,
      introspection: true,
      context: ({ request }: { request: unknown }) => ({ req: request }),
    }),
    AuthModule,
    UsersModule,
    CoursesModule,
    EventsModule,
    TimeTrialsModule,
    ClubsModule,
    StravaModule,
  ],
})
export class AppModule {}
