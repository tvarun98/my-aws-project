import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class MyAwsProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const dynamoTable = new dynamodb.Table(this, 'DynamoTable', {
      partitionKey: { name: 'ID', type: dynamodb.AttributeType.STRING },
      tableName: 'UserPasswords',
    });

    // Lambda Function
    const lambdaFunction = new lambda.Function(this, 'MyLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('service/lambda'),
      environment: {
        DYNAMODB_TABLE: dynamoTable.tableName,
      },
    });

    // Grant permissions to Lambda
    dynamoTable.grantReadData(lambdaFunction);

    // API Gateway
    const api = new apigateway.RestApi(this, 'MyApi', {
      restApiName: 'LambdaDynamoApi',
      description: 'API to fetch passwords from DynamoDB',
    });

    const getPassword = api.root.addResource('{userID}');
    getPassword.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunction));
    
    
    new cdk.CfnOutput(this, 'MyApiEndpointUrl', {
      value: api.url,
      description: 'The endpoint of the original API Gateway',
      exportName: 'MyApiEndpointUrl' // add exportName here
    });
  }
}
