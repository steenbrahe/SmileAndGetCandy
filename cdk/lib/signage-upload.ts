// Deploys the files to the S3 buncket - by first changing the url for the API gateway in the code.
import * as cdk from 'aws-cdk-lib';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { SignageInfra } from './signage-infra';
import { Construct } from 'constructs';

export class SignageUpload extends cdk.Stack {
  constructor(scope: Construct, id: string, infra: SignageInfra, props?: cdk.StackProps) {
    super(scope, id, props);

    //
    // Deploy site contents to S3 bucket, and invalidates the files in the cloudfront distribution
    //
    const distribution = infra.distribution;
    new s3deploy.BucketDeployment(this, 'DeployWithInvalidation', {
        sources: [s3deploy.Source.asset('../ClientSide')],
        destinationBucket: infra.bucket,
        distribution,
        distributionPaths: ['/*'],
      });
  }
}