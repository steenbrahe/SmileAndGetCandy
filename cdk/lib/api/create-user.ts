import { Construct } from "constructs";
import { SignageInfra } from "../signage-infra";
import { HttpMethod } from "@aws-cdk/aws-apigatewayv2-alpha";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as cdk from "aws-cdk-lib";
/**
 * High level construct to create CloudFront/ S3 / API gateway/ Lambda / CloudFront
 */
export class CreateUser extends Construct {
  private infra: SignageInfra;

  constructor(scope: Construct, id: string, infra: SignageInfra) {
    super(scope, id);
    this.infra = infra;

    //
    // defines an AWS Lambda resource
    //
    const lambdaCreateUser = new lambda.Function(this, "CreateUser", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../ServerSide/build/CreateUser"),
      //pass environment values??
      environment: {
        DYNAMODB_USER_TABLE: this.infra.dynamoDbUserTable.tableName,
        BUCKET_NAME: this.infra.bucket.bucketName,
        COLLECTION_ID: this.infra.COLLOECTION_ID,
        LOGGING_LEVEL: "DEBUG",
      },
    });

    //grat create user lambda to write data to dynamo db table
    this.infra.dynamoDbUserTable.grantReadWriteData(lambdaCreateUser);
    this.infra.bucket.grantDelete(lambdaCreateUser);
    this.infra.bucket.grantReadWrite(lambdaCreateUser);

    // Setup access to rekognition:DetectFaces in role
    // 👇 create a policy statement
    const rekognitionIndexingPolicy = new PolicyStatement({
      actions: ["rekognition:IndexFaces"],
      resources: ["*"],
    });

    // 👇 add the policy to the Function's role
    lambdaCreateUser.role?.attachInlinePolicy(
      new Policy(this, "index-reckognition-policy", {
        statements: [rekognitionIndexingPolicy],
      })
    );

    const createUserIntegration = new LambdaProxyIntegration({
      handler: lambdaCreateUser,
    });

    this.infra.addRoute(
      "/user/create",
      [HttpMethod.POST],
      createUserIntegration
    );
    new cdk.CfnOutput(this, "API_GATEWAY_URL for createuser", {
      value: `https://${this.infra.httpApi.httpApiId}.execute-api.${cdk.Aws.REGION}.amazonaws.com/user/create`,
    });
  }
}
