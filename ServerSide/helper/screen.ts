import { dynamodb } from "./database";
import { Screen } from "./model";
import {  GetItemCommand, PutItemCommand ,DeleteItemCommand} from "@aws-sdk/client-dynamodb";

export const getScreen = async(id:string) : Promise<Screen> =>{
    const inputScreen = {
        TableName: "Screen", //TABLE_NAME
        Key: {
          id: { S: id },
        },
        ProjectionExpression: "userid, smiling, beard, glasses, minAge, maxAge",
      };
    const commandScreen = new GetItemCommand(inputScreen);
    const responseScreen = await dynamodb.send(commandScreen);
    console.log('Screen response got from dynamodb')
    console.log(responseScreen.Item)
    if(!responseScreen.Item ){
        // TODO respond with default playlist
        console.log('Screen is not defined, returning simple object');
        const screen : Screen = {
            id:id,
            userid  : '',
            smiling : false,
            beard : false,
            glasses : false,
            minAge : -1 ,
            maxAge : -1,            
        } 
        return screen;
    }else{
        const screen : Screen = {
            id:id,
            userid  : responseScreen.Item.userid.S || '',
            smiling : responseScreen.Item.smiling.BOOL || false,
            beard : responseScreen.Item.beard.BOOL || false,
            glasses : responseScreen.Item.glasses.BOOL || false,
            minAge : parseInt(responseScreen.Item.minAge.N || '-1') ,
            maxAge : parseInt(responseScreen.Item.maxAge.N || '-1'),
        } 
        return screen;
    }
}