/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
*/
import {
  AnyPrincipal,
  Effect,
  PolicyDocument,
  PolicyStatement,
  StarPrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { CfnSubscription, CfnTopicPolicy, Topic } from 'aws-cdk-lib/aws-sns';
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Aspects, Stack } from 'aws-cdk-lib/core';
import { TestPack, TestType, validateStack } from './utils';
import {
  SNSEncryptedKMS,
  SNSRedrivePolicy,
  SNSTopicSSLPublishOnly,
} from '../../src/rules/sns';

const testPack = new TestPack([
  SNSEncryptedKMS,
  SNSTopicSSLPublishOnly,
  SNSRedrivePolicy,
]);
let stack: Stack;

beforeEach(() => {
  stack = new Stack();
  Aspects.of(stack).add(testPack);
});

describe('Amazon Simple Notification Service (Amazon SNS)', () => {
  describe('SNSEncryptedKMS: SNS topics are encrypted via KMS', () => {
    const ruleId = 'SNSEncryptedKMS';
    test('Noncompliance 1', () => {
      new Topic(stack, 'rTopic');
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Compliance', () => {
      new Topic(stack, 'rTopic', { masterKey: new Key(stack, 'rKey') });
      validateStack(stack, ruleId, TestType.COMPLIANCE);
    });
  });

  describe('SNSTopicSSLPublishOnly: SNS topics require SSL requests for publishing', () => {
    const ruleId = 'SNSTopicSSLPublishOnly';
    test('Noncompliance 1', () => {
      new Topic(stack, 'rTopic');
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Noncompliance 2', () => {
      new Topic(stack, 'rTopic', { topicName: 'foo' });
      new CfnTopicPolicy(stack, 'rTopicPolicy', {
        topics: ['foo'],
        policyDocument: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['sns:publish'],
              effect: Effect.ALLOW,
              principals: [new AnyPrincipal()],
              conditions: { Bool: { 'aws:SecureTransport': false } },
              resources: ['foo'],
            }),
          ],
        }).toJSON(),
      });
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Compliance', () => {
      new Topic(stack, 'rTopic', { topicName: 'foo' });
      new Topic(stack, 'rTopic2', { masterKey: new Key(stack, 'rKey') });
      new Topic(stack, 'rTopic3').addToResourcePolicy(
        new PolicyStatement({
          actions: ['sns:publish', 'sns:subscribe'],
          effect: Effect.DENY,
          principals: [new AnyPrincipal()],
          conditions: { Bool: { 'aws:SecureTransport': 'false' } },
          resources: ['foo'],
        })
      );
      new CfnTopicPolicy(stack, 'rTopicPolicy', {
        topics: ['foo'],
        policyDocument: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['sns:Publish'],
              effect: Effect.DENY,
              principals: [new StarPrincipal()],
              conditions: { Bool: { 'aws:SecureTransport': false } },
              resources: ['foo'],
            }),
          ],
        }).toJSON(),
      });
      validateStack(stack, ruleId, TestType.COMPLIANCE);
    });
  });

  describe('SNSRedrivePolicy: SNS subscriptions specify a redrive policy', () => {
    const ruleId = 'SNSRedrivePolicy';

    test('Noncompliance: CfnSubscription without redrive policy', () => {
      new CfnSubscription(stack, 'rSubscription', {
        topicArn: 'arn:aws:sns:us-east-1:123456789012:MyTopic',
        protocol: 'sqs',
        endpoint: 'arn:aws:sqs:us-east-1:123456789012:MyQueue',
      });
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });

    test('Noncompliance: Subscription without redrive policy', () => {
      const topic = new Topic(stack, 'rTopic');
      const queue = new Queue(stack, 'rQueue');
      topic.addSubscription(new SqsSubscription(queue));
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });

    test('Compliance: CfnSubscription with redrive policy', () => {
      new CfnSubscription(stack, 'rSubscription', {
        topicArn: 'arn:aws:sns:us-east-1:123456789012:MyTopic',
        protocol: 'sqs',
        endpoint: 'arn:aws:sqs:us-east-1:123456789012:MyQueue',
        redrivePolicy: {
          deadLetterTargetArn: 'arn:aws:sqs:us-east-1:123456789012:MyDLQ',
        },
      });
      validateStack(stack, ruleId, TestType.COMPLIANCE);
    });

    test('Compliance: Subscription with redrive policy', () => {
      const topic = new Topic(stack, 'rTopic');
      const queue = new Queue(stack, 'rQueue');
      const dlq = new Queue(stack, 'rDLQ');
      topic.addSubscription(
        new SqsSubscription(queue, {
          deadLetterQueue: dlq,
        })
      );
      validateStack(stack, ruleId, TestType.COMPLIANCE);
    });
  });
});
