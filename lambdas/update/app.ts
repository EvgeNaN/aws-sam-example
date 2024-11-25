import { APIGatewayProxyEvent, APIGatewayProxyResult, } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, } from "@aws-sdk/lib-dynamodb";

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

const prepareUpdateParameters = (body: any): {
    expressionString: string,
    expressionValues: { [key: string]: string | boolean },
  } => {
  const keys: string[] = Object.keys(body);

  const expressionString: string = keys.map((key: string) => `${key} = :${key}`).join(',');

  const expressionValues: { [key: string]: string | boolean } = keys.reduce((res: { [key: string]: string | boolean }, key: string) => {
    res[`:${key}`] = body[key];

    return res;
  }, {});

  return {
    expressionString,
    expressionValues,
  };
};

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body);

    const { expressionString, expressionValues } = prepareUpdateParameters(body);

    await dynamo.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          id: event.pathParameters.id,
        },
        UpdateExpression: `set ${expressionString}`,
        ExpressionAttributeValues: expressionValues,
      }),
    );
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Success' }),
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
