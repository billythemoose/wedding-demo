import { CfnOutput, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import type { StackProps } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import type { Construct } from 'constructs';

/** Settings for {@link WeddingDemoStack}. */
export interface WeddingDemoStackProps extends StackProps {
  /** The bare domain of the existing hosted zone (shared with the portfolio). */
  readonly domainName: string;
  /** ID of the existing hosted zone. It is imported, never created or deleted. */
  readonly hostedZoneId: string;
  /** The demo is served at `<subdomain>.<domainName>`. */
  readonly subdomain: string;
}

/**
 * Hosts the static demo app: a private S3 bucket behind CloudFront, with its own
 * certificate and alias records under the existing hosted zone.
 */
export class WeddingDemoStack extends Stack {
  constructor(scope: Construct, id: string, props: WeddingDemoStackProps) {
    super(scope, id, props);

    const siteDomain = `${props.subdomain}.${props.domainName}`;

    // Imported, not created: this stack never owns or deletes the zone.
    const zone = route53.PublicHostedZone.fromPublicHostedZoneAttributes(this, 'Zone', {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.domainName,
    });

    // Its own certificate, so the demo and the portfolio never depend on each other.
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: siteDomain,
      validation: acm.CertificateValidation.fromDns(zone),
    });

    const bucket = new s3.Bucket(this, 'SiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Single-page app: unknown paths (403 from S3 with OAC, or 404) serve index.html.
    const spaFallback: cloudfront.ErrorResponse[] = [403, 404].map((httpStatus) => ({
      httpStatus,
      responseHttpStatus: 200,
      responsePagePath: '/index.html',
      ttl: Duration.seconds(10),
    }));

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      domainNames: [siteDomain],
      certificate,
      defaultRootObject: 'index.html',
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      errorResponses: spaFallback,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
        compress: true,
      },
    });

    const target = route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution));
    new route53.ARecord(this, 'SiteA', { zone, recordName: siteDomain, target });
    new route53.AaaaRecord(this, 'SiteAaaa', { zone, recordName: siteDomain, target });

    new CfnOutput(this, 'DemoUrl', { value: `https://${siteDomain}` });
    new CfnOutput(this, 'BucketName', { value: bucket.bucketName });
    new CfnOutput(this, 'DistributionId', { value: distribution.distributionId });
  }
}
