import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';


export class ExamSoftUniStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

 // S3 Bucket for file storage

 const bucket = new Bucket(this, 'FileUploadBucket', {
  encryption: BucketEncryption.S3_MANAGED,
  //lifecycleRules: [{ expiration: cdk.Duration.minutes(30) }]
});

// DynamoDB Table for metadata storage
const table = new Table(this, 'FileMetadataTable', {
  partitionKey: { name: 'id', type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST
});

 // SNS Topic for error notifications
 const errorTopic = new Topic(this, 'ErrorTopic1', {
  displayName: 'File Upload Error Notifications'
});

 // Lambda function to process file uploads
 const processFunction = new NodejsFunction(this, 'ProcessFunction', {
  runtime: Runtime.NODEJS_20_X,
  handler: 'handler',
  entry: `${__dirname}/../src/processFunction.ts`,
  environment: {
    BUCKET_NAME: bucket.bucketName,
    TABLE_NAME: table.tableName,
    TOPIC_ARN: errorTopic.topicArn,
    SNS_EMAIL: 'velina.ilieva.siemens@gmail.com'
  }
});

// Grant necessary permissions to the Lambda function
bucket.grantReadWrite(processFunction);
table.grantReadWriteData(processFunction);
errorTopic.grantPublish(processFunction);

processFunction.addToRolePolicy(new PolicyStatement({
  actions: ['sns:SendEmail'],
  resources: ['*']
}));

 // API Gateway to trigger the Lambda function
 const api = new RestApi(this, 'FileUploadApi', {
  restApiName: 'File Upload Service'
});

const uploadResource = api.root.addResource('upload');
uploadResource.addMethod('POST', new LambdaIntegration(processFunction));

}
}
