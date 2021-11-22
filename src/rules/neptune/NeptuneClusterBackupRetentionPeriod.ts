/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
*/
import { parse } from 'path';
import { CfnResource } from 'aws-cdk-lib';
import { CfnDBCluster } from 'aws-cdk-lib/aws-neptune';
import { resolveIfPrimitive } from '../../nag-pack';

/**
 * Neptune DB clusters have a reasonable minimum backup retention period configured
 * @param node the CfnResource to check
 */
export default Object.defineProperty(
  (node: CfnResource): boolean => {
    if (node instanceof CfnDBCluster) {
      const backupRetentionPeriod = resolveIfPrimitive(
        node,
        node.backupRetentionPeriod
      );
      if (backupRetentionPeriod == undefined || backupRetentionPeriod < 7) {
        return false;
      }
    }
    return true;
  },
  'name',
  { value: parse(__filename).name }
);