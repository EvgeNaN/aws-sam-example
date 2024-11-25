import { APIGatewayProxyEvent, APIGatewayProxyResult, } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "Todos";

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

const getLimit = (event: APIGatewayProxyEvent): number | undefined => {
  if (!event.queryStringParameters?.limit) {
    return void 0;
  }

  return Number.parseInt(event.queryStringParameters?.limit);
}

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const res = await dynamo.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': event.pathParameters.id,
        },
      }),
    );

    return {
      statusCode: res.Items.length === 0 ? 404 : 200,
      body: JSON.stringify(res.Items[0]),
    };
  } catch (err) {
    console.log(err);
    console.log(event);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'some error happened',
      }),
    };
  }
};
