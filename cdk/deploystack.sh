#!/bin/bash

###############
# Run this script to deploy the stack to AWS. It will 
#  - compile Typescript for lambda functions
#  - create the stack, 
#  - Prepare and download IOT certificates
#  - Generate code for the IOT candy dispenser that is ready to execute, including certificates and URLS
#  - Build the react webfront, including setting the correct URLs for API calls to API gateway and upload to S3
###############

# Note! You need to run cdk bootstrap first if you have not used the cdk cli before

# First time executed, start by running npm install for installing cdk dependencies
if [ ! -d node_modules ]
then
    npm install
fi

# Prepare IOT cert
# Generate private key for iot
# TODO check first if file exists
mkdir dist-iot
if [ ! -f dist-iot/privatekey.pem.key ]
then
	echo "Creating privatekey.pem.key and device.csr (certificate request file)"
    openssl genrsa -out dist-iot/privatekey.pem.key 2048
    openssl req -new -subj "/O=SmileAndGetCandy/CN=AWS IoT Certificate" -key dist-iot/privatekey.pem.key -out dist-iot/device.csr
fi

# Compile ServerSide Typescript
cd ../ServerSide
if [ ! -d node_modules ]
then
    npm install
fi
npm run build
cd ../cdk

# Deploy stack
echo "Deploying stack"
cdk deploy SignageCustomStack --require-approval never

# Get URL from output from stack
# --If jq is installed, this command is better to get e.g. the url: 
#   aws cloudformation describe-stacks --stack-name SignageCustomStack --query "Stacks[0].Outputs[]" --output json  | jq -r '.[] | select(.OutputKey | contains("APIGATEWAYURL")) | .OutputValue' 
echo "Getting Stack ids and URL from CloudFormation"
url=`aws cloudformation describe-stacks --stack-name SignageCustomStack --query "Stacks[0].Outputs[?contains(OutputKey,'SIGNAGEAPIGATEWAYURL')].OutputValue" --output text` 
bucket=`aws cloudformation describe-stacks --stack-name SignageCustomStack --query "Stacks[0].Outputs[?contains(OutputKey,'BUCKETNAME')].OutputValue" --output text` 
bucket_remote=`aws cloudformation describe-stacks --stack-name SignageCustomStack --query "Stacks[0].Outputs[?contains(OutputKey,'BUCKETREMOTECONTROLNAME')].OutputValue" --output text`
cloudfrontId=`aws cloudformation describe-stacks --stack-name SignageCustomStack --query "Stacks[0].Outputs[?contains(OutputKey,'CLOUDFRONTDISTRIBUTIONID')].OutputValue" --output text` 
cloudfrontRemoteControlId=`aws cloudformation describe-stacks --stack-name SignageCustomStack --query "Stacks[0].Outputs[?contains(OutputKey,'CLOUDFRONTREMOTECONTROLDISTRIBUTIONID')].OutputValue" --output text` 
cloudfrontURL=`aws cloudformation describe-stacks --stack-name SignageCustomStack --query "Stacks[0].Outputs[?contains(OutputKey,'CLOUDFRONTDOMAINNAME')].OutputValue" --output text` 
cloudfrontRemoteControlURL=`aws cloudformation describe-stacks --stack-name SignageCustomStack --query "Stacks[0].Outputs[?contains(OutputKey,'CLOUDFRONTREMOTECONTROLDOMAINNAME')].OutputValue" --output text` 
certificateId=`aws cloudformation describe-stacks --stack-name SignageCustomStack --query "Stacks[0].Outputs[?contains(OutputKey,'IOTCERTIFICATEPEM')].OutputValue" --output text` 
cognito_identity_id=`aws cloudformation describe-stacks --stack-name SignageCustomStack --query "Stacks[0].Outputs[?contains(OutputKey,'COGNITOIDENTITYPOOLID')].OutputValue" --output text` 
# Using below command that finds the region based on also enviroment variables which aws configure get region does not
aws_region=`aws ec2 describe-availability-zones --output text --query 'AvailabilityZones[0].[RegionName]'`
echo "URL is $url"
echo "Bucket is $bucket"
echo "Bucket remotecontrol is $bucket_remote"
echo "cloudfrontId is $cloudfrontId"
echo "cloudfrontURL is $cloudfrontURL"
echo "certificateId is $certificateId"
echo "cognito_identity_id is $cognito_identity_id"
echo "REGION is $aws_region"

# Copy all files to IOT dist folder
# generate dispenser.sh and put into iot folder. IOT Endpoint must be retrieved for ATS for TLS to work!
cp ../IOT/* dist-iot/
iot_endpoint=`aws iot describe-endpoint --endpoint-type "iot:Data-ATS" --query endpointAddress --output text`
echo "python3 dispenser.py --endpoint $iot_endpoint --ca_file Amazon-root-CA-1.pem --cert device.pem.crt --key privatekey.pem.key --client_id CandyDispenser --topic signage/smile-and-get-candy/screen/5" 
echo "python3 dispenser.py --endpoint $iot_endpoint --ca_file Amazon-root-CA-1.pem --cert device.pem.crt --key privatekey.pem.key --client_id CandyDispenser --topic signage/smile-and-get-candy/screen/5" > dist-iot/dispenser.sh
chmod +x dist-iot/dispenser.sh
echo "python3 camera.py --endpoint $url --screen_id 5" > dist-iot/camera.sh
chmod +x dist-iot/camera.sh
chmod +x dist-iot/install.sh

# Get device certificate (printf command necessary to unescape the newline characters)
aws iot describe-certificate --certificate-id $certificateId --query certificateDescription.certificatePem | xargs printf "%b\n" > dist-iot/device.pem.crt

# Download root Amazon certificate
# see more at https://github.com/aws-samples/aws-iot-device-management-workshop/blob/master/bin/create-root-ca-bundle.sh
wget -O - https://www.amazontrust.com/repository/AmazonRootCA1.pem > dist-iot/Amazon-root-CA-1.pem

# Build and copy web site to distribution folder
echo "Building web site app..."
rm -r dist
mkdir dist
cd ../ClientSide
# change the API endpoint in the .env file
echo "REACT_APP_API_END_POINT = $url" > .env
# Add the IOT endpoint to the browser client environment variables file
echo "REACT_APP_AWS_REGION = $aws_region" >> .env
echo "REACT_APP_AWS_IOT_ENDPOINT = $iot_endpoint" >> .env
echo "REACT_APP_AWS_COGNITO_IDENTITY_POOL_ID = $cognito_identity_id" >> .env
echo "REACT_APP_CLOUDFRONT_ENDPOINT = $cloudfrontURL" >> .env
echo "REACT_APP_CLOUDFRONT_REMOTECONTROL_ENDPOINT = $cloudfrontRemoteControlURL" >> .env

# run client build
if [ ! -d node_modules ]
then
    npm install
fi
npm run build
cd ../cdk
cp -r ../ClientSide/build/* dist/

# Build and copy remotecontrol web site to distribution folder
echo "Building remotecontrol app..."
cd ../remotecontrol
cp ../ClientSide/.env .
# run client build
if [ ! -d node_modules ]
then
    npm install
fi
npm run build
cd ../cdk
mkdir dist-remotecontrol
cp -r ../remotecontrol/build/* dist-remotecontrol

# Upload to S3 buckets
echo "Uploading client files to S3 bucket"
aws s3 cp ./dist s3://$bucket --recursive
echo "Uploading remotecontrol files to S3 bucket"
aws s3 cp ./dist-remotecontrol s3://$bucket_remote --recursive

# Create cloudfront invalidation
# --paths "/static/js/*"
echo "Creating a CloudFront invalidation of index.html" 
aws cloudfront create-invalidation \
    --distribution-id $cloudfrontId \
    --paths "/index.html" \
    --no-cli-pager

aws cloudfront create-invalidation \
    --distribution-id $cloudfrontRemoteControlId \
    --paths "/index.html" \
    --no-cli-pager

echo "Cleaning up"
rm -r dist
rm -r dist-remotecontrol

# Add a demo screen to dynamodb
echo "Adding demo screen with id=5 to dynamodb table"
aws dynamodb put-item --table-name Screen --item '{"id":{"S":"5"},"userid":{"S":""},"smiling":{"BOOL":false},"beard":{"BOOL":false},"glasses":{"BOOL":false},"maxAge":{"N":"0"},"minAge":{"N":"0"}}'

#echo "update apigateway for CORS"
#aws apigatewayv2 update-api --api-id bfs2bsx5p7 --cors-configuration AllowOrigins="*"

echo "Visit this URL to see webpage: $cloudfrontURL"
open $cloudfrontURL