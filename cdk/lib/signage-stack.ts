// Deploys the files to the S3 buncket - by first changing the url for the API gateway in the code.
import * as cdk from 'aws-cdk-lib';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { SignageSite } from './signage-site';
import { SignageInfra } from './signage-infra';
import { IOTInfra } from './iot';



/**
 * Stack that creates the SignageSite from highlevel construct and then deploys web client to
 * created S3 bucket
 */
export class SignageStack extends cdk.Stack {
  private signageSite: SignageSite;
  private signageInfra: SignageInfra;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //
    //
    // Create infrastructure and get api URL, distribution ID and bucketII
    //
    this.signageInfra = new SignageInfra(this, 'SignageInfra');

    // Create handlers for the SignateSite
    this.signageSite = new SignageSite(this, 'SignageSite', this.signageInfra);

    new IOTInfra(this, 'IOTInfra');

  }
}