import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_iot as iot } from 'aws-cdk-lib';
import * as fs from 'fs';
import * as path from 'path';
import { IdentityPool } from '@aws-cdk/aws-cognito-identitypool-alpha';
import { Effect, Policy, PolicyStatement, PolicyStatementProps } from 'aws-cdk-lib/aws-iam';


/**
 * High level construct to create CloudFront/ S3 / API gateway/ CloudFront
 */
export class IOTInfra extends Construct {
    // Create IOT THing and certificate and Policy for certificate. 
    constructor(scope: Construct, id: string) {
        super(scope, id);

        const iotCoreThing = new iot.CfnThing(this, 'CandyDispenser', /* all optional props */  {
            thingName: 'CandyDispenserThing',
        });
        
        const iotCoreThingCertificate = new iot.CfnCertificate(
            this,
            'IotCoreThingCertificate',
            {
              status: 'ACTIVE',
              certificateSigningRequest: fs.readFileSync(
                path.resolve("dist-iot/device.csr"),
                "utf8"
              ),
            },
          );

        // Output the certificate id so we can retrieve the certificate afterwards
        new cdk.CfnOutput(this, 'IOT_CERTIFICATE_PEM', { value : iotCoreThingCertificate.attrId || ''});


        // Restrictive policy to IOT
        const iotPolicyDocument = {
          Version: '2012-10-17',
          Statement: [
            {
                Effect: "Allow",
                Action: ["iot:Receive", "iot:Publish"],
                Resource: [`arn:aws:iot:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:topic/signage/smile-and-get-candy/*`]
            },
            {
                Effect: 'Allow',
                Action: ['iot:Subscribe'],
                Resource: [`arn:aws:iot:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:topicfilter/signage/smile-and-get-candy/*`],
            },
            {
                Effect: 'Allow',
                Action: ['iot:Connect'],
                Resource: [`arn:aws:iot:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:client/CandyDispenser`],
            }
          ],
        };
        const iotPolicy = new iot.CfnPolicy(this, 'Policy', {
            policyName: 'Raspberry_Pi_Policy',
            policyDocument: iotPolicyDocument
          });
    
        // connect thing and certificate
        const policyPrincipalAttachment = new iot.CfnPolicyPrincipalAttachment(
            this,
            'PolicyPrincipalAttachment',
            {
              policyName: iotPolicy.policyName || 'PolicyPrincipalAttachment',
              principal: iotCoreThingCertificate.attrArn,
            },
          );
        
        // connect policy and certificate
        const thingPrincipalAttachment = new iot.CfnThingPrincipalAttachment(
            this,
            'ThingPrincipalAttachment',
            {
              thingName: iotCoreThing.thingName || 'ThingPrincipalAttachment',
              principal: iotCoreThingCertificate.attrArn,
            },
          );


        // Create Cognito Identity pool with guest access to the IOT topic - for giving access to browser to simulate IOT device
        const identityPool = new IdentityPool(this, 'SmileAndGetCandyIndentityPool',{allowUnauthenticatedIdentities:true});
        
        // Define an IAM Policy for IoT Core - for giving access to the IOT topic - for giving access to browser to simulate IOT device
        const policyStatementProps1: PolicyStatementProps = {
          effect: iotPolicyDocument.Statement[0].Effect as Effect,
          actions: iotPolicyDocument.Statement[0].Action,
          resources: iotPolicyDocument.Statement[0].Resource};
        const policyStatementProps2: PolicyStatementProps = {
          effect: iotPolicyDocument.Statement[1].Effect as Effect,
          actions: iotPolicyDocument.Statement[1].Action,
          resources: iotPolicyDocument.Statement[1].Resource};
        const policyStatementProps3: PolicyStatementProps = {
          effect: iotPolicyDocument.Statement[2].Effect as Effect,
          actions: iotPolicyDocument.Statement[2].Action,
          resources: [`arn:aws:iot:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:client/`+"${iot:ClientId}"]};
        const policyStatementProps4: PolicyStatementProps = {
          effect: Effect.ALLOW,
          actions: ["cognito-identity:GetCredentialsForIdentity"],
          resources: ["*"]
        }

        const p1 = new Policy(this, "IOT");
        p1.addStatements(new PolicyStatement(policyStatementProps1), new PolicyStatement(policyStatementProps2), new PolicyStatement(policyStatementProps3));
        const p2 = new Policy(this, "Unauthenticated");
        p2.addStatements(new PolicyStatement(policyStatementProps4));
        identityPool.unauthenticatedRole.attachInlinePolicy(p1);
        identityPool.unauthenticatedRole.attachInlinePolicy(p2);
        

        // Output the Identity Pool ID so we can retrieve the Identity Pool ID later
        new cdk.CfnOutput(this, 'COGNITO_IDENTITY_POOL_ID', { value : identityPool.identityPoolId || ''});

    }
    
}