import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

// Shared infrastructure — not part of APPS project (no Project tag applied)
const CERT_ARN = 'arn:aws:acm:us-east-1:979952482911:certificate/a9b9cfbe-3daf-4c06-bd6c-2f52c1ce5bf8';
const HOSTED_ZONE_ID = 'Z03689722459VD8GPC4VM';
const HOSTED_ZONE_NAME = 'tmrs.studio';

export class AppsFrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket — no public access, served exclusively via CloudFront OAC
    const bucket = new s3.Bucket(this, 'apps-s3-frontend', {
      bucketName: 'apps-s3-frontend',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Wildcard cert in us-east-1 (required for CloudFront)
    const certificate = acm.Certificate.fromCertificateArn(
      this, 'WildcardCert', CERT_ARN
    );

    // CloudFront distribution with OAC
    const distribution = new cloudfront.Distribution(this, 'apps-cf-main', {
      comment: 'apps-cf-main',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      domainNames: ['apps.tmrs.studio'],
      certificate,
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // R53 alias records — A (IPv4) and AAAA (IPv6)
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this, 'HostedZone', {
        hostedZoneId: HOSTED_ZONE_ID,
        zoneName: HOSTED_ZONE_NAME,
      }
    );

    new route53.ARecord(this, 'apps-r53-a', {
      zone: hostedZone,
      recordName: 'apps',
      target: route53.RecordTarget.fromAlias(
        new route53targets.CloudFrontTarget(distribution)
      ),
    });

    new route53.AaaaRecord(this, 'apps-r53-aaaa', {
      zone: hostedZone,
      recordName: 'apps',
      target: route53.RecordTarget.fromAlias(
        new route53targets.CloudFrontTarget(distribution)
      ),
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      exportName: 'apps-cf-distribution-id',
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      exportName: 'apps-s3-frontend-name',
    });
  }
}
