import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as apigw from "@aws-cdk/aws-apigatewayv2-alpha";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { Construct } from "constructs";
import { CfnCollection } from "aws-cdk-lib/aws-rekognition";
import { aws_dynamodb } from "aws-cdk-lib";

/**
 * High level construct to create CloudFront/ S3 / API gateway/ CloudFront
 */
export class SignageInfra extends Construct {
  public httpApi: apigw.HttpApi;
  public bucket: s3.Bucket;
  public distribution: cloudfront.Distribution;

  public dynamoDbUserTable: aws_dynamodb.Table;
  public dynamoDbPlaylistTable: aws_dynamodb.Table;
  public dynamoDbScreenTable: aws_dynamodb.Table;

  public rekogniton: CfnCollection;
  public COLLOECTION_ID: string = "SmileAndCandy";

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.dynamoDbUserTable = new aws_dynamodb.Table(this, "User", {
      tableName: "User",
      partitionKey: { name: "email", type: aws_dynamodb.AttributeType.STRING },
    });

    // Add secondary global index to be able to query on faceid
    this.dynamoDbUserTable.addGlobalSecondaryIndex({
      indexName: "faceid",
      partitionKey: { name: "faceid", type: aws_dynamodb.AttributeType.STRING },
      projectionType: aws_dynamodb.ProjectionType.ALL,
    });

    // Attributes: content (which is a json document describing URLs to the images to be shown)
    this.dynamoDbPlaylistTable = new aws_dynamodb.Table(this, "Playlist", {
      tableName: "Playlist",
      partitionKey: { name: "id", type: aws_dynamodb.AttributeType.STRING },
    });

    // Attributes: userId, smiling, beard, glasses, gender, minAge,maxAge
    this.dynamoDbScreenTable = new aws_dynamodb.Table(this, "Screen", {
      tableName: "Screen",
      partitionKey: { name: "id", type: aws_dynamodb.AttributeType.STRING },
    });

    //
    // Defines an API Gateway REST API resource backed by our "FaceDetection" function.
    //
    this.httpApi = new apigw.HttpApi(this, "SmileAndGetCandy", {
      disableExecuteApiEndpoint: false,

      corsPreflight: {
        allowHeaders: ["Content-Type"],
        allowMethods: [
          apigw.CorsHttpMethod.OPTIONS,
          apigw.CorsHttpMethod.POST,
          apigw.CorsHttpMethod.GET,
          apigw.CorsHttpMethod.DELETE,
        ],
        allowOrigins: ["*"],
      },
    });

    new cdk.CfnOutput(this, "SIGNAGE_API_GATEWAY_URL", {
      value: `https://${this.httpApi.httpApiId}.execute-api.${cdk.Aws.REGION}.amazonaws.com`,
    });

    //
    // Define S3 bucket for web site
    //
    this.bucket = new s3.Bucket(this, "SignageWebSiteBucket", {
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      /**
       * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
       */
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      /**
       * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
       * setting will enable full cleanup of the demo.
       */
      //autoDeleteObjects: true, // NOT recommended for production code
    });
    new cdk.CfnOutput(this, "BUCKET_NAME", { value: this.bucket.bucketName });

    //
    // Define S3 bucket for remote control
    //
    const remote_bucket = new s3.Bucket(this, "SignageRemoteControlBucket", {
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      /**
       * The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
       * the new bucket, and it will remain in your account until manually deleted. By setting the policy to
       * DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
       */
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      /**
       * For sample purposes only, if you create an S3 bucket then populate it, stack destruction fails.  This
       * setting will enable full cleanup of the demo.
       */
      //autoDeleteObjects: true, // NOT recommended for production code
    });
    new cdk.CfnOutput(this, "BUCKET_REMOTE_CONTROL_NAME", {
      value: remote_bucket.bucketName,
    });

    //
    // Define Remote Control CloudFront Distribution (only because using two origins seems to not work)
    //
    const distribution_remotecontrol = new cloudfront.Distribution(
      this,
      "SignageRemoteControlDistribution",
      {
        defaultRootObject: "index.html",
        defaultBehavior: {
          origin: new origins.S3Origin(remote_bucket),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        },
      }
    );
    new cdk.CfnOutput(this, "CLOUDFRONT_REMOTECONTROL_DISTRIBUTION_ID", {
      value: distribution_remotecontrol.distributionId,
    });
    new cdk.CfnOutput(this, "CLOUDFRONT_REMOTECONTROL_DOMAIN_NAME", {
      value: `https://${distribution_remotecontrol.domainName}`,
    });

    //
    // Define CloudFront Distribution
    //
    // TODO cleanup by removing the additional behaviors that do not work
    this.distribution = new cloudfront.Distribution(
      this,
      "SignageDistribution",
      {
        defaultRootObject: "index.html",
        defaultBehavior: {
          origin: new origins.S3Origin(this.bucket),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        },
        additionalBehaviors: {
          "remote/*": {
            origin: new origins.S3Origin(remote_bucket),
            allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          },
        },
      }
    );
    new cdk.CfnOutput(this, "CLOUDFRONT_DISTRIBUTION_ID", {
      value: this.distribution.distributionId,
    });
    new cdk.CfnOutput(this, "CLOUDFRONT_DOMAIN_NAME", {
      value: `https://${this.distribution.domainName}`,
    });

    new CfnCollection(this, "RekognitionCollection", {
      collectionId: this.COLLOECTION_ID,
    });
  }

  public addRoute(
    path: string,
    methods: [apigw.HttpMethod],
    integration: LambdaProxyIntegration
  ) {
    this.httpApi.addRoutes({
      path: path,
      methods: methods,
      integration: integration,
    });
  }
}
