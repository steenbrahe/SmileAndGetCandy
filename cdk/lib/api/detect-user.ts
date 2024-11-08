import { Construct } from "constructs";
import { SignageInfra } from "../signage-infra";
import * as apigw from "@aws-cdk/aws-apigatewayv2-alpha";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { LambdaProxyIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

/**
 * High level construct to create CloudFront/ S3 / API gateway/ Lambda / CloudFront
 */
export class DetectUser extends Construct {
  private infra: SignageInfra;

  constructor(scope: Construct, id: string, infra: SignageInfra) {
    super(scope, id);
    this.infra = infra;
    //
    // defines an AWS Lambda resource
    //
    const lambdaFaceDetect = new lambda.Function(this, "DetectUserFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("../ServerSide/build/DetectUser"),
      handler: "index.handler",
    });
    infra.dynamoDbScreenTable.grantReadWriteData(lambdaFaceDetect);
    infra.dynamoDbUserTable.grantReadData(lambdaFaceDetect);

    // Setup access to rekognition:DetectFaces in role
    // 👇 create a policy statement
    const detectRekognitionPolicy = new PolicyStatement({
      actions: ["rekognition:DetectFaces", "rekognition:SearchFacesByImage"],
      resources: ["*"],
    });

    // 👇 add the policy to the Function's role
    lambdaFaceDetect.role?.attachInlinePolicy(
      new Policy(this, "detect-reckognition-policy", {
        statements: [detectRekognitionPolicy],
      })
    );

    const faceDetectIntegration = new LambdaProxyIntegration({
      handler: lambdaFaceDetect,
    });

    this.infra.addRoute(
      "/screen/{id}/detectuser",
      [apigw.HttpMethod.POST],
      faceDetectIntegration
    );
  }
}
