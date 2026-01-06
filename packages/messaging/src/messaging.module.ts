import {
  DynamicModule,
  Global,
  Module,
  type InjectionToken,
  type OptionalFactoryDependency,
} from "@nestjs/common";
import { SnsService, SnsConfig } from "./sns.service";

export const SNS_CONFIG = "SNS_CONFIG";

export interface MessagingModuleOptions {
  sns: SnsConfig;
}

type InjectToken = InjectionToken | OptionalFactoryDependency;

@Global()
@Module({})
export class MessagingModule {
  static forRoot(options: MessagingModuleOptions): DynamicModule {
    return {
      module: MessagingModule,
      providers: [
        {
          provide: SnsService,
          useFactory: () => new SnsService(options.sns),
        },
      ],
      exports: [SnsService],
    };
  }

  static forRootAsync(options: {
    useFactory: (
      ...args: unknown[]
    ) => Promise<MessagingModuleOptions> | MessagingModuleOptions;
    inject?: InjectToken[];
  }): DynamicModule {
    return {
      module: MessagingModule,
      providers: [
        {
          provide: SnsService,
          useFactory: async (...args: unknown[]) => {
            const config = await options.useFactory(...args);
            return new SnsService(config.sns);
          },
          inject: options.inject || [],
        },
      ],
      exports: [SnsService],
    };
  }
}
