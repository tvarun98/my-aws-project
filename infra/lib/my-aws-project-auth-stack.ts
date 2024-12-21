import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { CfnOutput } from 'aws-cdk-lib';

export class MyAwsProjectAuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Import the existing API URL from the other stack.
    // You can reference by stack name and output name:
    const originalApiEndpoint = cdk.Fn.importValue('MyApiEndpointUrl'); 
    // If importValue doesn’t work directly, you can get this URL from parameters or SSM. 
    // For simplicity, we assume cross-stack reference via importValue after modifying the original stack.

    // Create Cognito User Pool
    const userPool = new cognito.UserPool(this, 'MyUserPool', {
      selfSignUpEnabled: false,
      userVerification: {
        emailSubject: 'Verify your email for our service',
        emailBody: 'Hello {username}, thanks for signing up! Your verification code is {####}.',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      signInAliases: { email: true },
    });

    // Create a User Pool Client
    const userPoolClient = userPool.addClient('MyUserPoolClient', {
      generateSecret: false,
    });

    // Create the Proxy Lambda
    const proxyLambda = new lambda.Function(this, 'ProxyLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('service/proxy-lambda'),
      environment: {
        ORIGINAL_API_URL: originalApiEndpoint,  // Pass original API URL as env var
      },
    });

    // Grant Lambda permission to call the old API if needed (HTTP calls don't need IAM, just ensure no VPC blocking)
    // If old API is public, no extra IAM needed.

    // Create the new API Gateway with Cognito Authorizer
    const api = new apigateway.RestApi(this, 'AuthApi', {
      restApiName: 'AuthProtectedApi',
      description: 'API protected by Cognito that proxies to original API',
    });

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // Resource: /{userID}
    const userResource = api.root.addResource('{userID}');
    userResource.addMethod('GET', new apigateway.LambdaIntegration(proxyLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Output the new API Endpoint
    new CfnOutput(this, 'AuthApiUrl', {
      value: api.url,
      description: 'The endpoint of the new auth-protected API',
    });

    // Export user pool info for client setup if needed
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
  }
}
