#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { SignageStack  } from '../lib/signage-stack';

const app = new App();

//
// Stack that builds API gateway, Lambda, CloudFront, S3 and uploads code and files
// Used to produce complete stack in development environment without CI/CD pipeline
//
new SignageStack(app, 'SignageCustomStack');




