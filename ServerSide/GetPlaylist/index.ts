//import { database } from "../helper/database";
import * as screenService from "../helper/screen";
import * as userService from "../helper/user";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { IoTClient } from "@aws-sdk/client-iot";
import {
  InternalFailureException,
  IoTDataPlaneClient,
  PublishCommand,
  PublishCommandOutput,
} from "@aws-sdk/client-iot-data-plane";
import { Context, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import { resolve } from "path";
import { User, Playlist, Content, Screen } from "../helper/model";

const dynamodb = new DynamoDBClient({ apiVersion: "2012-08-10" });
const iot = new IoTDataPlaneClient({ apiVersion: "2012-08-10" });

/**
 * GetPlaylist Handler function that will be called by API gateway.
 * @param {*} event 
 * Event that contains HTTP request information and more. Body of request contains a json:
 * {screenId:<id>, currentPlaylistId:<id>}

 * @returns 
 * A promise that, when resolved, will return response to API gateway. Structure:
 * {name:<playlist name>,id:<playlistId>,content:{images:[{name:<>, url}]}}
 */
export const handler = async (
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Path: /screen/{id}/playlist

  //
  // Precondition check - make sure the event has an id as part of the path
  //
  console.log("Start");
  const id = event.pathParameters != null ? event.pathParameters["id"] : null;
  if (!id) {
    console.log("No id in path, now returning");
    return new Promise(function (resolve, reject) {
      const response = {
        statusCode: 400,
        body: "No screenId in path",
      };
      resolve(response);
    });
  }

  //
  // Get screen from Screens table to get which user is watching
  //
  const screen = await screenService.getScreen(id);
  console.log("Screen got", screen);
  if (!screen.id) {
    // TODO create the screen instead of below
    console.log("Screen with id:" + id + " does not exist");
    return new Promise(function (resolve, reject) {
      const response = {
        statusCode: 400,
        body: "Screen with id:" + id + " does not exist",
      };
      resolve(response);
    });
  }

  let playlist: Playlist = { title: "", description: "", content: [] };
  //
  // Get information about user from users table
  //
  if (screen.userid) {
    console.log("Getting information about the user from User table");
    const user = await userService.getUser(screen.userid);
    console.log("User response got from dynamodb", user);
    if (!user.email) {
      // Respond with default playlist
      console.log(
        "No user was found in User table with email. User has probably been deleted before screen was updated:" +
          screen.userid
      );
      playlist = getPlaylistForUnknownUser(screen);
    } else {
      console.log(
        "Customer interest is: " + user.interest + " smile:" + screen.smiling
      );
      playlist = getPlaylistForUser(user, screen);
      if (screen.smiling) {
        // TODO find when user was last smiling and check if it is less than 5 minutes - need to store this at the user or screen.
        // User walks in front of screen, smiles, gets gift, continue to stand there - should continue to see same playlist. When user is not there anymore, go back to normal. This means that getPlaylist should know if user was smiling and still is in front of screen.
        // This is first - just show same playlist for user, even if stop smiling. User goes away and come again, and OK to get candy again.
        console.log("User is smiling, now sending IOT message");
        // Send message to IOT topic - the dispenser will listen at a topic with the screen id
        // Topic: dispenser/<screen.id>
        const command = new PublishCommand(
          { topic: "signage/smile-and-get-candy/screen/" + screen.id } //payload:'{smiling:true}'}
        );

        try {
          const resp: PublishCommandOutput = await iot.send(command);
          console.log("IOT message sent. ");
        } catch (error) {
          console.error("Unable to send IOT message");
          console.error(error);
        }
      }
    }
  } else if (screen.minAge != -1) {
    // TODO introduce another attribute isUserWatching
    // Make playlist based on user apperance.
    playlist = getPlaylistForUnknownUser(screen);
  } else {
    // No user is watching - default playlist
    playlist = getPlaylistWithoutUser();
  }

  return new Promise(function (resolve, reject) {
    const response = {
      statusCode: 200,
      body: JSON.stringify(playlist),
    };
    resolve(response);
  });
};

function getPlaylistForUser(user: User, screen: Screen): Playlist {
  const path = "images/" + user.interest + "/" + user.interest;
  const description = screen.smiling
    ? "Good to see you are smiling, here you got yourself a nice surprise :-)"
    : "Good to see you again and hope you will get a nice day. Here you can enjoy some " +
      user.interest +
      " pictures";
  const content: Array<any> = [
    {
      type: "image",
      imageUrl: path + "1.jpg",
    },
    {
      type: "image",
      imageUrl: path + "2.jpg",
    },
    {
      type: "image",
      imageUrl: path + "3.jpg",
    },
  ];
  if (screen.smiling) {
    content.unshift({
      type: "image",
      imageUrl: "images/happy/happy1.jpg",
    });
  }

  return {
    title: "Hey " + user.fullname,
    description: description,
    content: content,
  };
}
function getPlaylistForUnknownUser(screen: Screen) {
  // Based on Screen only
  if (screen.smiling) {
    return {
      title: "Happy day - you are smiling",
      description: "",
      content: [
        {
          type: "image",
          imageUrl: "images/happy/happy1.jpg",
        },
        {
          type: "image",
          imageUrl: "images/happy/happy2.jpg",
        },
        {
          type: "image",
          imageUrl: "images/happy/happy3.jpg",
        },
      ],
    };
  } else if (screen.beard) {
    return {
      title: "A world of beards",
      description: "",
      content: [
        {
          type: "image",
          imageUrl: "images/beard/beard1.jpg",
        },
        {
          type: "image",
          imageUrl: "images/beard/beard2.jpg",
        },
        {
          type: "image",
          imageUrl: "images/beard/beard3.jpg",
        },
      ],
    };
  } else if (screen.glasses) {
    return {
      title: "You see so much more with glasses",
      description: "",
      content: [
        {
          type: "image",
          imageUrl: "images/glasses/glasses1.jpg",
        },
        {
          type: "image",
          imageUrl: "images/glasses/glasses2.jpg",
        },
        {
          type: "image",
          imageUrl: "images/glasses/glasses3.jpg",
        },
      ],
    };
  } else {
    return getDefaultPlaylist();
  }
}

function getPlaylistWithoutUser(): Playlist {
  return {
    title: "Images from New York",
    description: "Probably there is noone watching these images",
    content: [
      {
        type: "image",
        imageUrl: "images/newyork/ny1.jpg",
      },
      {
        type: "image",
        imageUrl: "images/newyork/ny2.jpg",
      },
      {
        type: "image",
        imageUrl: "images/newyork/ny3.jpg",
      },
    ],
  };
}

function getDefaultPlaylist(): Playlist {
  return {
    title: "The Universe is amazing",
    description: "You should look into the sky at night to experience it",
    content: [
      {
        type: "image",
        imageUrl: "images/universe/universe1.jpg",
      },
      {
        type: "image",
        imageUrl: "images/universe/universe2.jpg",
      },
      {
        type: "image",
        imageUrl: "images/universe/universe3.jpg",
      },
    ],
  };
}
