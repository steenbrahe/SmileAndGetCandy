
import { dynamodb , DYNAMODB_USER_TABLE } from "./database";
import {  GetItemCommand, PutItemCommand ,DeleteItemCommand} from "@aws-sdk/client-dynamodb";
import { consoleLog, LOGGING_LEVEL} from "../helper/logging";
import { User } from "./model";

export const getUser  = async(email:string): Promise<User>  =>{
    consoleLog ("getuser", "DEBUG", "Begin ..");
    const params = {
        TableName: 'User',
        Key: {
            email:{S: email}
        },
        ProjectionExpression: "fullname,email,faceid,interest,created,updated",
    };
    const command = new GetItemCommand(params);
    const response = await dynamodb.send(command);
    const item = response.Item;
    consoleLog("getUser ", "DEBUG", JSON.stringify(response))
    const user : User= {
        fullname: item?(item.fullname.S || ''):'',
        email: item?(item.email.S || ''):'',
        interest: item?(item.interest.S || ''):'',
        faceid: item?(item.faceid.S || ''):'',
        created: item?(item.created.S || ''):'',
        updated: item?(item.updated.S || ''):'',
    }
    return user;
}

export const updateUser = async(
    fullname: string,
    email: string,
    interest: string,
    faceid: string) :  Promise<User> => {
    consoleLog("Updating User ","DEBUG", "Fullname:"+fullname+",faceid:"+faceid+" interest:"+interest);
    var current = await getUser(email);
    consoleLog("Updating User >>","DEBUG", JSON.stringify(current));
    var currentDate = new Date().toISOString();
    if(!current.created){
        current.created = currentDate;
    }
    consoleLog("Updating User >>2","DEBUG","");
    current.fullname = fullname;
    current.email = email;
    current.interest = interest;
    current.faceid = faceid;
    current.updated = currentDate;
    consoleLog(" User >>3","DEBUG",JSON.stringify(current));
    const params = {
        TableName: DYNAMODB_USER_TABLE,
        Item:{
            fullname: {S: current.fullname},
            email: {S: current.email},
            interest: {S: current.interest},
            faceid: {S: current.faceid},
            created: {S: current.created},
            updated:{S: current.updated}
        }
    }
    consoleLog(" User >>4","DEBUG",JSON.stringify(params));
    const command = new PutItemCommand(params);
    const response = await dynamodb.send(command);
    consoleLog('Response got from PutItemCommand');
    consoleLog(" User >>5","DEBUG",JSON.stringify(response));
    return current;
}


export const deleteUser = async(email: string) :  Promise<User> => {
    consoleLog("Delete User ","DEBUG", "email:"+email);
    var current = await getUser(email);
    if(!current.email){
        consoleLog('User does not exist');
        return current;
    }
    consoleLog("Delete User >>","DEBUG", JSON.stringify(current));    
    const params = {
        TableName: DYNAMODB_USER_TABLE,
        Key:{
            email: {S: current.email},
        }
    }
    const command = new DeleteItemCommand(params);
    const response = await dynamodb.send(command);
    consoleLog(" Delete >>4","DEBUG",JSON.stringify(response));
    return current;
}