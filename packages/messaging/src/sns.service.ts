import { Injectable, Logger } from "@nestjs/common";
import {
  SNSClient,
  PublishCommand,
  PublishCommandInput,
  MessageAttributeValue,
} from "@aws-sdk/client-sns";

export interface SnsConfig {
  region: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export const MessageTypes = {
  EXAMPLE_EVENT: "EXAMPLE_EVENT",
} as const;

export type MessageType = (typeof MessageTypes)[keyof typeof MessageTypes];

@Injectable()
export class SnsService {
  private readonly logger = new Logger(SnsService.name);
  private readonly client: SNSClient;

  constructor(config: SnsConfig) {
    this.client = new SNSClient({
      region: config.region,
      endpoint: config.endpoint,
      credentials: config.credentials,
    });
  }

  async publish<T>(
    topicArn: string,
    messageType: MessageType,
    payload: T
  ): Promise<string | undefined> {
    const messageAttributes: Record<string, MessageAttributeValue> = {
      messageType: {
        DataType: "String",
        StringValue: messageType,
      },
    };

    const input: PublishCommandInput = {
      TopicArn: topicArn,
      Message: JSON.stringify(payload),
      MessageAttributes: messageAttributes,
    };

    this.logger.debug(
      `Publishing ${messageType} message to topic: ${topicArn}`
    );

    const command = new PublishCommand(input);
    const response = await this.client.send(command);

    this.logger.debug(`Message published with ID: ${response.MessageId}`);

    return response.MessageId;
  }
}
