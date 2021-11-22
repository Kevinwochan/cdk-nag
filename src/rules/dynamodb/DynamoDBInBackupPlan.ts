/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
*/
import { parse } from 'path';
import { CfnResource, Stack } from 'aws-cdk-lib';
import { CfnBackupSelection } from 'aws-cdk-lib/aws-backup';
import { CfnTable } from 'aws-cdk-lib/aws-dynamodb';
import { resolveResourceFromInstrinsic } from '../../nag-pack';

/**
 * DynamoDB tables are part of AWS Backup plan(s)
 * @param node the CfnResource to check
 */

export default Object.defineProperty(
  (node: CfnResource): boolean => {
    if (node instanceof CfnTable) {
      const tableLogicalId = resolveResourceFromInstrinsic(node, node.ref);
      const tableName = Stack.of(node).resolve(node.tableName);
      let found = false;
      for (const child of Stack.of(node).node.findAll()) {
        if (child instanceof CfnBackupSelection) {
          if (isMatchingSelection(child, tableLogicalId, tableName)) {
            found = true;
            break;
          }
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  },
  'name',
  { value: parse(__filename).name }
);

/**
 * Helper function to check whether the Backup Plan Selection contains the given Table
 * @param node the CfnBackupSelection to check
 * @param tableLogicalId the Cfn Logical ID of the table
 * @param tableName the name of the table
 * returns whether the CfnBackupSelection contains the given Table
 */
function isMatchingSelection(
  node: CfnBackupSelection,
  tableLogicalId: string,
  tableName: string | undefined
): boolean {
  const backupSelection = Stack.of(node).resolve(node.backupSelection);
  const resources = Stack.of(node).resolve(backupSelection.resources);
  if (Array.isArray(resources)) {
    for (const resource of resources) {
      const resolvedResource = JSON.stringify(Stack.of(node).resolve(resource));
      if (
        new RegExp(`${tableLogicalId}(?![\\w])`).test(resolvedResource) ||
        (tableName != undefined &&
          new RegExp(`table\/${tableName}(?![\\w\\-_\\.])`).test(
            resolvedResource
          ))
      ) {
        return true;
      }
    }
  }
  return false;
}