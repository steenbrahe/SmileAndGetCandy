
import { Rekognition } from "aws-sdk";
import { consoleLog, LOGGING_LEVEL} from "../helper/logging";
import { updateUser, deleteUser} from "../helper/user"
import { Context, APIGatewayProxyCallback, APIGatewayEvent } from 'aws-lambda';
import { COLLECTION_ID } from "helper/environment";

import { RekognitionClient, IndexFacesCommand, IndexFacesRequest,DeleteFacesCommand, DeleteFacesRequest } from "@aws-sdk/client-rekognition";
const rekognition= new RekognitionClient({apiVersion: "2012-08-10"});

/**
 * DeleteUser Handler function that will be called by API gateway.
 * @param event 
 * @param context 
 * @param callback 
 * @returns 
 */
export const handler = async (event: APIGatewayEvent, context: Context, callback: APIGatewayProxyCallback) => {
    consoleLog(" Event is ","INFO", JSON.stringify(event));
    var body = JSON.parse(event?.body);
    consoleLog(" EventBody is","INFO", JSON.stringify(body));
    if(!body || !body?.email ){
        consoleLog('No body in request, now returning');
        callback(null, {
            statusCode: 403,
            body: JSON.stringify({
                message: "Invalid data sent. Missing email",
            }),
        });   
    }
    var email = body?.email;
    var user =  await deleteUser( email);
    if(!user.email){
        callback(null, {
            statusCode: 400,
            body: JSON.stringify({
                message: "User with email:"+email+" does not exist" 
            }),
        });
        return;
    }
    if(user.faceid){
        deleteIndex(user.faceid);
    }
    console.log('User deleted from table and Rekognition index')
    callback(null, {
        statusCode: 200,
        body: JSON.stringify(user),
    });
}


const deleteIndex = function(faceid: string) {

    const input : DeleteFacesRequest = {
        FaceIds: [faceid],
        CollectionId:COLLECTION_ID
    };
    const command = new DeleteFacesCommand(input);
    const response = rekognition.send(command);
    consoleLog(" Face is deöete from index ", "INFO", JSON.stringify(response))
    return response;
}