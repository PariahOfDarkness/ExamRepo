import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ExamSoftUniStack} from '../lib/exam_soft_uni-stack';

test('S3 Bucket Created', () => {
  const app = new cdk.App();
  const stack = new ExamSoftUniStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::S3::Bucket', {});
});

test('DynamoDB Table Created', () => {
  const app = new cdk.App();
  const stack = new ExamSoftUniStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    BillingMode: 'PAY_PER_REQUEST'
  });
});

test('SNS Topic Created', () => {
  const app = new cdk.App();
  const stack = new ExamSoftUniStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::SNS::Topic', {});
});
