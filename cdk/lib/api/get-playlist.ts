import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apigw from "@aws-cdk/aws-apigatewayv2-alpha";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { Construct } from "constructs";
import { SignageInfra } from "../signage-infra";

/**
 * High level construct to create CloudFront/ S3 / API gateway/ Lambda / CloudFront
 */
export class GetPlaylist extends Construct {
  private infra: SignageInfra;

  constructor(scope: Construct, id: string, infra: SignageInfra) {
    super(scope, id);
    this.infra = infra;
    //
    // defines an AWS Lambda resource
    //
    const lambdaGetPlaylist = new lambda.Function(this, "GetPlaylistFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("../ServerSide/build/GetPlaylist"),
      handler: "index.handler",
    });
    infra.dynamoDbPlaylistTable.grantReadData(lambdaGetPlaylist);
    infra.dynamoDbScreenTable.grantReadData(lambdaGetPlaylist);
    infra.dynamoDbUserTable.grantReadData(lambdaGetPlaylist);

    lambdaGetPlaylist.addPermission;

    // 👇 create a policy statement
    const iotTopicPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["iot:Publish"],
      resources: [
        `arn:aws:iot:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:topic/signage/smile-and-get-candy/*`,
      ],
    });

    // 👇 add the policy to the Function's role
    lambdaGetPlaylist.role?.attachInlinePolicy(
      new iam.Policy(this, "iot-topic-policy", {
        statements: [iotTopicPolicy],
      })
    );

    const integration = new LambdaProxyIntegration({
      handler: lambdaGetPlaylist,
    });

    // TODO should we use /screen/{id}/playlist (REST) or just /getplaylist/{screenid}?
    this.infra.addRoute(
      "/screen/{id}/playlist",
      [apigw.HttpMethod.GET],
      integration
    );
  }
}
