/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
*/

import { SynthUtils } from '@aws-cdk/assert';
import {
  MethodLoggingLevel,
  RestApi,
  CfnClientCertificate,
  CfnStage,
} from '@aws-cdk/aws-apigateway';
import { CfnWebACLAssociation } from '@aws-cdk/aws-wafv2';
import { Aspects, Stack } from '@aws-cdk/core';
import { PCIDSS321Checks } from '../../src';

describe('Amazon API Gateway', () => {
  test('PCI.DSS.321-APIGWAssociatedWithWAF: - Rest API stages are associated with AWS WAFv2 web ACLs - (Control ID: 6.6)', () => {
    const nonCompliant = new Stack();
    Aspects.of(nonCompliant).add(new PCIDSS321Checks());
    const nonCompliantRestApi = new RestApi(nonCompliant, 'rRestApi', {
      deploy: false,
    });
    nonCompliantRestApi.root.addMethod('ANY');
    new CfnStage(nonCompliant, 'rRestStage', {
      restApiId: nonCompliantRestApi.restApiId,
      stageName: 'foo',
    });
    const messages = SynthUtils.synthesize(nonCompliant).messages;
    expect(messages).toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining('PCI.DSS.321-APIGWAssociatedWithWAF:'),
        }),
      })
    );

    const nonCompliant2 = new Stack();
    Aspects.of(nonCompliant2).add(new PCIDSS321Checks());
    const nonCompliant2RestApi = new RestApi(nonCompliant2, 'rRestApi', {
      deploy: false,
    });
    nonCompliant2RestApi.root.addMethod('ANY');
    new CfnStage(nonCompliant2, 'rRestStage', {
      restApiId: nonCompliant2RestApi.restApiId,
      stageName: 'foo',
    });
    new CfnWebACLAssociation(nonCompliant2, 'rWebAClAssoc', {
      webAclArn: 'bar',
      resourceArn: `${nonCompliant2RestApi.restApiId}`,
    });
    const messages2 = SynthUtils.synthesize(nonCompliant2).messages;
    expect(messages2).toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining('PCI.DSS.321-APIGWAssociatedWithWAF:'),
        }),
      })
    );

    const nonCompliant3 = new Stack();
    Aspects.of(nonCompliant3).add(new PCIDSS321Checks());
    const nonCompliant3RestApi = new RestApi(nonCompliant3, 'rRestApi', {
      deploy: false,
    });
    nonCompliant3RestApi.root.addMethod('ANY');
    const nonCompliant3Stage = new CfnStage(nonCompliant3, 'rRestStage', {
      restApiId: nonCompliant3RestApi.restApiId,
      stageName: 'foo',
    });
    new CfnWebACLAssociation(nonCompliant3, 'rWebAClAssoc', {
      webAclArn: 'bar',
      resourceArn: `${nonCompliant3Stage.restApiId}/baz`,
    });
    const messages3 = SynthUtils.synthesize(nonCompliant3).messages;
    expect(messages3).toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining('PCI.DSS.321-APIGWAssociatedWithWAF:'),
        }),
      })
    );

    const compliant = new Stack();
    Aspects.of(compliant).add(new PCIDSS321Checks());
    const compliantRestApi = new RestApi(compliant, 'rRestApi', {
      deploy: false,
    });
    compliantRestApi.root.addMethod('ANY');
    new CfnStage(compliant, 'rRestStage', {
      restApiId: compliantRestApi.restApiId,
      stageName: 'foo',
    });
    new CfnWebACLAssociation(compliant, 'rWebAClAssoc', {
      webAclArn: 'bar',
      resourceArn: `${compliantRestApi.restApiId}/stage/foo`,
    });
    const compliantRestApi2 = new RestApi(compliant, 'rRestApi2', {
      deploy: false,
    });
    compliantRestApi2.root.addMethod('ANY');
    const compliantStage2 = new CfnStage(compliant, 'rRestStage2', {
      restApiId: compliantRestApi2.restApiId,
      stageName: 'foo',
    });
    new CfnWebACLAssociation(compliant, 'rWebAClAssoc2', {
      webAclArn: 'bar',
      resourceArn: `${compliantRestApi2.restApiId}/stage/${compliantStage2.stageName}`,
    });
    const compliantRestApi3 = new RestApi(compliant, 'rRestApi3', {
      deploy: false,
    });
    compliantRestApi3.root.addMethod('ANY');
    new CfnStage(compliant, 'rRestStage3', {
      restApiId: 'baz',
      stageName: 'foo',
    });
    new CfnWebACLAssociation(compliant, 'rWebAClAssoc3', {
      webAclArn: 'bar',
      resourceArn: `baz/stage/${compliantStage2.ref}`,
    });
    const compliantRestApi4 = new RestApi(compliant, 'rRestApi4', {
      deploy: false,
    });
    compliantRestApi4.root.addMethod('ANY');
    const compliantStage4 = new CfnStage(compliant, 'rRestStage4', {
      restApiId: 'baz',
      stageName: 'foo',
    });
    new CfnWebACLAssociation(compliant, 'rWebAClAssoc4', {
      webAclArn: 'bar',
      resourceArn: `${compliantStage4.restApiId}/stage/foo`,
    });
    const messages4 = SynthUtils.synthesize(compliant).messages;
    expect(messages4).not.toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining('PCI.DSS.321-APIGWAssociatedWithWAF:'),
        }),
      })
    );
  });

  test('PCI.DSS.321-APIGWCacheEnabledAndEncrypted: - API Gateway stages have caching enabled and encrypted for all methods - (Control ID: 3.4)', () => {
    const nonCompliant = new Stack();
    Aspects.of(nonCompliant).add(new PCIDSS321Checks());
    new RestApi(nonCompliant, 'rRestApi').root.addMethod('ANY');
    const messages = SynthUtils.synthesize(nonCompliant).messages;
    expect(messages).toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining(
            'PCI.DSS.321-APIGWCacheEnabledAndEncrypted:'
          ),
        }),
      })
    );

    const nonCompliant2 = new Stack();
    Aspects.of(nonCompliant2).add(new PCIDSS321Checks());
    new RestApi(nonCompliant2, 'rRestApi', {
      deployOptions: { cachingEnabled: false },
    }).root.addMethod('ANY');
    const messages2 = SynthUtils.synthesize(nonCompliant2).messages;
    expect(messages2).toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining(
            'PCI.DSS.321-APIGWCacheEnabledAndEncrypted:'
          ),
        }),
      })
    );

    const nonCompliant3 = new Stack();
    Aspects.of(nonCompliant3).add(new PCIDSS321Checks());
    new RestApi(nonCompliant3, 'rRestApi', {
      deployOptions: { cacheDataEncrypted: false },
    }).root.addMethod('ANY');
    const messages3 = SynthUtils.synthesize(nonCompliant3).messages;
    expect(messages3).toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining(
            'PCI.DSS.321-APIGWCacheEnabledAndEncrypted:'
          ),
        }),
      })
    );

    const compliant = new Stack();
    Aspects.of(compliant).add(new PCIDSS321Checks());
    new RestApi(compliant, 'rRestApi', {
      deployOptions: { cacheDataEncrypted: true, cachingEnabled: true },
    }).root.addMethod('ANY');
    const messages4 = SynthUtils.synthesize(compliant).messages;
    expect(messages4).not.toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining(
            'PCI.DSS.321-APIGWCacheEnabledAndEncrypted:'
          ),
        }),
      })
    );
  });

  test('PCI.DSS.321-APIGWExecutionLoggingEnabled: - API Gateway stages have logging enabled for all methods - (Control IDs: 10.1, 10.3.1, 10.3.2, 10.3.3, 10.3.4, 10.3.5, 10.3.6, 10.5.4)', () => {
    const nonCompliant = new Stack();
    Aspects.of(nonCompliant).add(new PCIDSS321Checks());
    new RestApi(nonCompliant, 'rRestApi').root.addMethod('ANY');
    const messages = SynthUtils.synthesize(nonCompliant).messages;
    expect(messages).toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining(
            'PCI.DSS.321-APIGWExecutionLoggingEnabled:'
          ),
        }),
      })
    );
    const nonCompliant2 = new Stack();
    Aspects.of(nonCompliant2).add(new PCIDSS321Checks());
    new RestApi(nonCompliant2, 'rRestApi', {
      deployOptions: { loggingLevel: MethodLoggingLevel.OFF },
    }).root.addMethod('ANY');
    const messages2 = SynthUtils.synthesize(nonCompliant2).messages;
    expect(messages2).toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining(
            'PCI.DSS.321-APIGWExecutionLoggingEnabled:'
          ),
        }),
      })
    );

    const compliant = new Stack();
    Aspects.of(compliant).add(new PCIDSS321Checks());
    new RestApi(compliant, 'rRestApi', {
      deployOptions: { loggingLevel: MethodLoggingLevel.ERROR },
    }).root.addMethod('ANY');
    const messages3 = SynthUtils.synthesize(compliant).messages;
    expect(messages3).not.toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining(
            'PCI.DSS.321-APIGWExecutionLoggingEnabled:'
          ),
        }),
      })
    );
  });

  test('PCI.DSS.321-APIGWSSLEnabled: - API Gateway REST API stages are configured with SSL certificates - (Control IDs: 2.3, 4.1, 8.2.1)', () => {
    const nonCompliant = new Stack();
    Aspects.of(nonCompliant).add(new PCIDSS321Checks());
    new RestApi(nonCompliant, 'rRestApi').root.addMethod('ANY');
    const messages = SynthUtils.synthesize(nonCompliant).messages;
    expect(messages).toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining('PCI.DSS.321-APIGWSSLEnabled:'),
        }),
      })
    );
    const compliant = new Stack();
    Aspects.of(compliant).add(new PCIDSS321Checks());
    new RestApi(compliant, 'rRestApi', {
      deployOptions: {
        clientCertificateId: new CfnClientCertificate(
          compliant,
          'rClientCertificate'
        ).attrClientCertificateId,
      },
    }).root.addMethod('ANY');
    const messages2 = SynthUtils.synthesize(compliant).messages;
    expect(messages2).not.toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining('PCI.DSS.321-APIGWSSLEnabled:'),
        }),
      })
    );
  });
});