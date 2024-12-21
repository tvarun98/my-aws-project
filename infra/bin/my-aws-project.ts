#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MyAwsProjectAuthStack } from '../lib/my-aws-project-auth-stack';
import { MyAwsProjectStack } from '../lib/my-aws-project-stack';

const app = new cdk.App();
// Instantiate your original stack
new MyAwsProjectStack(app, 'MyAwsProjectStack');

// Instantiate your new auth stack
new MyAwsProjectAuthStack(app, 'MyAwsProjectAuthStack');