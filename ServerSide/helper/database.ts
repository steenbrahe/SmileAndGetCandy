
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
export const DYNAMODB_USER_TABLE = process.env.DYNAMODB_USER_TABLE || "";
export const dynamodb = new DynamoDBClient({apiVersion: "2012-08-10"});

  



