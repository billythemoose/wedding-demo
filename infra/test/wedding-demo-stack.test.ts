import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { WeddingDemoStack } from '../lib/wedding-demo-stack.ts';

const SITE_DOMAIN = 'wedding.example.com';

/** Synthesizes the stack with made-up settings; the imported zone needs no AWS calls. */
function synth(): Template {
  const app = new App();
  const stack = new WeddingDemoStack(app, 'TestStack', {
    env: { region: 'us-east-1' },
    domainName: 'example.com',
    hostedZoneId: 'Z000TEST',
    subdomain: 'wedding',
  });
  return Template.fromStack(stack);
}

describe('WeddingDemoStack', () => {
  const template = synth();

  it('has none of the production backend or shared portfolio resources', () => {
    for (const type of [
      'AWS::CloudFront::Function',
      'AWS::WAFv2::WebACL',
      'AWS::DynamoDB::Table',
      'AWS::ApiGateway::RestApi',
      'AWS::IAM::OIDCProvider',
      'AWS::Route53::HostedZone',
    ]) {
      template.resourceCountIs(type, 0);
    }
  });

  it('has its own certificate for the subdomain', () => {
    template.resourceCountIs('AWS::CertificateManager::Certificate', 1);
    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      DomainName: SITE_DOMAIN,
    });
  });

  it('adds only an A and an AAAA alias record for the subdomain', () => {
    const records = Object.values(template.findResources('AWS::Route53::RecordSet'));
    const summary = records
      .map((record) => `${record['Properties']['Type']} ${record['Properties']['Name']}`)
      .sort();
    assert.deepEqual(summary, [`A ${SITE_DOMAIN}.`, `AAAA ${SITE_DOMAIN}.`]);
  });

  it('blocks all public access to the bucket', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it('falls back to index.html for 403 and 404', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        Aliases: [SITE_DOMAIN],
        CustomErrorResponses: Match.arrayWith([403, 404].map((code) => Match.objectLike({
          ErrorCode: code,
          ResponseCode: 200,
          ResponsePagePath: '/index.html',
        }))),
      }),
    });
  });

  it('does not import values from any other stack', () => {
    assert.ok(!JSON.stringify(template.toJSON()).includes('Fn::ImportValue'));
  });
});
