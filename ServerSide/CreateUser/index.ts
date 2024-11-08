
import { Rekognition } from "aws-sdk";
import { consoleLog, LOGGING_LEVEL} from "../helper/logging";
import { updateUser} from "../helper/user"
import { Context, APIGatewayProxyCallback, APIGatewayEvent } from 'aws-lambda';
import { COLLECTION_ID } from "helper/environment";

import { RekognitionClient, IndexFacesCommand, IndexFacesRequest, IndexFacesResponse } from "@aws-sdk/client-rekognition";
const rekognition= new RekognitionClient({apiVersion: "2012-08-10"});

/** 
 * CreateUser Handler function that will be called by API gateway.
*/
export const handler = async (event: APIGatewayEvent, context: Context, callback: APIGatewayProxyCallback) => {
    consoleLog(" Event is ","INFO", JSON.stringify(event));
    var body = JSON.parse(event?.body!);
    consoleLog(" EventBody is","INFO", JSON.stringify(body));
    if(!body || !body?.image || !body?.email || !body?.interest){
        consoleLog('No image or email or interest in request, now returning');
        callback(null, {
            statusCode: 403,
            body: JSON.stringify({
                message: "Invalid data sent. Missing fullname or email or image or interest",
            }),
        });   
    }
    var name = body?.fullname;
    var email = body?.email;
    var interest = body?.interest;

    //create user into dynamo db.
  
    var imageBytes = Buffer.from(body?.image,'base64')
    consoleLog(" Calling createIndex","INFO","...");
    //check call back
    var faceid= await createIndex(name, imageBytes);
    consoleLog(" Face is indexed ", "INFO", JSON.stringify(faceid))
    var user =  await updateUser(name, email, interest, faceid);
    callback(null, {
        statusCode: 200,
        body: JSON.stringify(user),
    });
}
    


const createIndex = async function(name: string, image:Buffer):Promise<string> {

    const input : IndexFacesRequest = {
        Image: {
            Bytes: image
        },
        CollectionId:COLLECTION_ID
    };
    const command = new IndexFacesCommand(input);
    const response = await rekognition.send(command);
    consoleLog("createIndex: ", "INFO", JSON.stringify(response))
    return response?.FaceRecords[0]?.Face?.FaceId||""
}




