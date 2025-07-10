import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class FootballIntelligenceAgentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a secret to store the Anthropic API key
    // This is more secure than environment variables for sensitive data
    const anthropicApiKeySecret = new secretsmanager.Secret(this, 'AnthropicApiKey', {
      description: 'API key for Anthropic Claude',
      secretName: 'football-agent/anthropic-api-key',
      // You'll set the actual value through AWS Console or CLI after deployment
    });

    // Create the Lambda function
    const footballAgentFunction = new lambda.Function(this, 'FootballAgentFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.seconds(30), // Claude API can take a few seconds
      memorySize: 512, // More memory = faster cold starts
      environment: {
        // For now, we'll use environment variable. In production, you'd read from Secrets Manager
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'placeholder-key',
        NODE_ENV: 'production'
      },
      logRetention: logs.RetentionDays.ONE_WEEK, // Keep logs for debugging
      description: 'Processes football queries using Claude AI'
    });

    // Grant the Lambda function permission to read the secret
    anthropicApiKeySecret.grantRead(footballAgentFunction);

    // Create the API Gateway
    const api = new apigateway.RestApi(this, 'FootballAgentApi', {
      restApiName: 'Football Intelligence Agent API',
      description: 'API for football queries powered by Claude AI',
      // Enable CORS for all origins - in production, you'd restrict this
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName: 'prod',
        // Temporarily disable logging to avoid CloudWatch role requirement
        // loggingLevel: apigateway.MethodLoggingLevel.ERROR,
        // dataTraceEnabled: true,
        throttlingBurstLimit: 10, // Prevent abuse
        throttlingRateLimit: 5    // 5 requests per second
      }
    });

    // Create the /ask endpoint
    const askResource = api.root.addResource('ask');
    
    // Add POST method to /ask
    const askMethod = askResource.addMethod('POST', new apigateway.LambdaIntegration(footballAgentFunction, {
      requestTemplates: {
        'application/json': '{ "statusCode": "200" }'
      }
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Origin': true,
        }
      }]
    });

    // Create a usage plan for API key management (optional but recommended)
    const usagePlan = new apigateway.UsagePlan(this, 'FootballAgentUsagePlan', {
      name: 'Basic',
      description: 'Basic usage plan for Football Agent API',
      apiStages: [{
        api: api,
        stage: api.deploymentStage
      }],
      throttle: {
        rateLimit: 10,    // 10 requests per second
        burstLimit: 20    // Allow bursts up to 20 requests
      },
      quota: {
        limit: 1000,      // 1000 requests
        period: apigateway.Period.DAY
      }
    });

    // Create an API key (optional - remove if you want open access)
    const apiKey = new apigateway.ApiKey(this, 'FootballAgentApiKey', {
      description: 'API key for Football Intelligence Agent',
      apiKeyName: 'football-agent-key'
    });

    // Associate the API key with the usage plan
    usagePlan.addApiKey(apiKey);

    // Output the API endpoint URL
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url + 'ask',
      description: 'API Gateway endpoint URL for Football Agent',
      exportName: 'FootballAgentApiEndpoint'
    });

    // Output the API key ID (you'll need to retrieve the actual value from console)
    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID - retrieve actual key value from AWS Console',
      exportName: 'FootballAgentApiKeyId'
    });

    // Output useful information for monitoring
    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: footballAgentFunction.functionName,
      description: 'Name of the Lambda function',
      exportName: 'FootballAgentLambdaName'
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: footballAgentFunction.logGroup.logGroupName,
      description: 'CloudWatch Log Group for debugging',
      exportName: 'FootballAgentLogGroup'
    });
  }
}