import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { APIGatewayProxyHandler } from "aws-lambda";

const s3Client = new S3Client({});
const dynamoDBClient = new DynamoDBClient({});
const snsClient = new SNSClient({});

export const handler: APIGatewayProxyHandler = async (event: { body: string; }) => {
    const allowedExtensions = ['.pdf', '.jpg', '.png'];
    const file = JSON.parse(event.body).file;
    const fileExtension = file.name.split('.').pop();

    if (!allowedExtensions.includes(fileExtension)) {
        // Send error notification
        await snsClient.send(new PublishCommand({
            TopicArn: process.env.TOPIC_ARN,
            Message: `Invalid file extension: ${fileExtension}`
        }));
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid file extension' })
        };
    }

    // Upload file to S3
    const s3Params = {
        Bucket: process.env.BUCKET_NAME,
        Key: file.name,
        Body: Buffer.from(file.content, 'base64')
    };
    await s3Client.send(new PutObjectCommand(s3Params));

    // Store metadata in DynamoDB
    const metadata = {
        id: { S: new Date().toISOString() },
        fileSize: { N: file.size.toString() },
        fileExtension: { S: fileExtension },
        uploadDate: { S: new Date().toISOString() }
    };
    await dynamoDBClient.send(new PutItemCommand({
        TableName: process.env.TABLE_NAME,
        Item: metadata
    }));

    // Send notification with file metadata
    await snsClient.send(new PublishCommand({
        TopicArn: process.env.TOPIC_ARN,
        Message: `File uploaded: ${JSON.stringify(metadata)}`
    }));

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'File uploaded successfully' })
    };
};