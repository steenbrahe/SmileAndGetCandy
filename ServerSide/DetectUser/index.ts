import { DynamoDBClient, PutItemCommand, PutItemCommandInput ,QueryCommandInput, QueryCommand, QueryCommandOutput} from "@aws-sdk/client-dynamodb";
import { RekognitionClient, DetectFacesCommand, DetectFacesRequest, SearchFacesByImageCommand, SearchFacesByImageCommandInput } from "@aws-sdk/client-rekognition"; 
import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { FaceDetail } from "aws-sdk/clients/rekognition";

const client = new RekognitionClient({apiVersion: "2012-08-10"});
const dynamodb = new DynamoDBClient({apiVersion: "2012-08-10"});

/**
 * DetectUser Handler function that will be called by API gateway.
 * Will detect a user from an image - either as known user - or as unknown user.
 * It will update the Screens table with a userid
 * @param {*} event 
 * 
 * @returns 
 * A promise that, when resolved, will return response to API gateway. Structure:
 * {name:<playlist name>,id:<playlistId>,content:{images:[{name:<>, url}]}}
 */
export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    // Path: /screen/{id}/detectuser
    
    //
    // Precondition check - make sure the event has a body with JSON and containing an image property
    //
    console.log("Start");
    const id = event.pathParameters!=null?event.pathParameters['id']:null;
    if(!id){
        console.log('No id in path, now returning')
        return new Promise(function(resolve, reject) {
            const response={
                statusCode: 400,
                body: "No screenId in path"
            }
            resolve(response) ;     
        });
    }
    const body = event.body?JSON.parse(event.body):null
    if(!body || !body.image){
        console.log('No body in request, now returning')
        return new Promise(function(resolve, reject) {
            resolve({
                statusCode: 400,
                body: "No image in the body"
            }) ;     
        });   
    }
    const image = body.image;
    let resp = {
        statusCode: 200,
        body:'',
    };
    // @ts-ignore
    let face : FaceDetail = null;
    let userid = ''; // unknown user
    
    //
    // Detect user expressions
    //
    console.log("Sending request to DetectFaces");
    const input : DetectFacesRequest = {
        Image: {
            Bytes: Buffer.from(body.image,'base64')
        },
        Attributes: ["ALL", "DEFAULT"]          
    };
    const command = new DetectFacesCommand(input);
    const response = await client.send(command);
    console.log("Got response from DetectFaces");
    if(!response.FaceDetails || response.FaceDetails.length==0){
        // No details
        console.log('no people detected in image');
        resp.body = JSON.stringify({
            message:'No people detected in image'
        });
    }else{
        console.log('before setting face');
        face = response.FaceDetails[0];
        console.log(face);
        
        //
        // Search for user using SearchFacesByImage
        // 
        console.log('Calling SearchFacesByImageCommandInput to see if the user is a known user')
        const searchInput : SearchFacesByImageCommandInput = {
            CollectionId:"SmileAndCandy",
            Image: {
                Bytes: Buffer.from(body.image,'base64')
            },                  
        };
        const searchCommand = new SearchFacesByImageCommand(searchInput);
        const searchResponse = await client.send(searchCommand);
        console.log("Response from SearchFacesByImageCommandInput",searchResponse);
        const faceid = (searchResponse.FaceMatches && searchResponse.FaceMatches.length>0)?searchResponse.FaceMatches[0].Face?.FaceId:null;
        console.log("faceid:"+faceid);
        
        //
        // If match - Find user by faceId
        //
        if(faceid){
            const input : QueryCommandInput= {
                TableName: "User", //TABLE_NAME
                IndexName: "faceid",
                KeyConditionExpression:"faceid = :faceid",
                ExpressionAttributeValues: {
                    ":faceid": { S: faceid }
                },
                ProjectionExpression: "fullname,email",
              };
            const command = new QueryCommand(input);
            const response : QueryCommandOutput = await dynamodb.send(command);
            console.log('User response got from dynamodb')
            if(response.Items && response.Items[0]){
                console.log("Found user for faceid, now setting the userid", response.Items[0]);
                userid = response.Items[0].email.S || '';                
            }
        }
        resp.body = JSON.stringify({
            userid:userid,
            minAge:face.AgeRange?.Low,
            maxAge:face.AgeRange?.High,
            smile:face.Smile?.Value,
        });
    }

    //
    // Update Screens table with userId|null and user expressions (smile, beard, glasses, gender, age)
    //
    const known = false;
    console.log('Setting up input to DDB for Screen')
    const inputDb:PutItemCommandInput = {
        TableName: "Screen",
        Item:{
            userid: {S:userid},
            id: {S:id},
            smiling: {BOOL: face?(face.Smile?.Value || false):false},
            beard:   {BOOL: face?(face.Beard?.Value || false):false},
            glasses: {BOOL: face?(face.Eyeglasses?.Value || false):false},
            minAge: {N:face?(face.AgeRange?.Low?.toString() || '-1'):'-1'},
            maxAge: {N:face?(face.AgeRange?.High?.toString() || '-1'):'-1'}
        }
    };

    const commandDb = new PutItemCommand(inputDb);
    console.log('Sending request', input);
    const responseDb = await dynamodb.send(commandDb);
    console.log('response got from dynamodb')
    console.log(responseDb)
    
    return new Promise(function(resolve, reject) {
        resolve(resp);
    });
}