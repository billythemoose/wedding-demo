import { App, Tags } from 'aws-cdk-lib';
import { WeddingDemoStack } from '../lib/wedding-demo-stack.ts';

/** Returns a required environment variable, failing fast if it's missing. */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Copy infra/.env.example to infra/.env and fill it in.`);
  }
  return value;
}

const app = new App();

// No account is set, so the template refers to the account as AWS::AccountId and
// never contains the ID itself. The certificate for CloudFront must be in us-east-1.
new WeddingDemoStack(app, 'WeddingDemoStack', {
  env: { region: 'us-east-1' },
  domainName: requireEnv('DOMAIN_NAME'),
  hostedZoneId: requireEnv('HOSTED_ZONE_ID'),
  subdomain: requireEnv('SUBDOMAIN'),
});

// Lets the deploy script (and the console) tell demo resources from the portfolio's.
Tags.of(app).add('project', 'wedding-demo');
