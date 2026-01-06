#!/bin/bash

echo "Creating SQS queues..."

# Create queues (add your queues here as needed)
# awslocal sqs create-queue --queue-name example-queue

echo "Creating SNS topics..."

# Create SNS topics (add your topics here as needed)
awslocal sns create-topic --name events

echo "Listing created resources..."
echo "SQS Queues:"
awslocal sqs list-queues

echo "SNS Topics:"
awslocal sns list-topics

echo "LocalStack initialization complete!"

