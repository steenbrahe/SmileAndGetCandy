import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import Editor from "react-simple-code-editor";
import { Settings } from "../Settings";
import { mqttClient } from "../utils/MQTTClient";

export default function CandyDispenser() {
  // Example: https://github.com/aws/aws-iot-device-sdk-js-v2/blob/main/samples/browser/react_sample/README.md
  const [serverResponse] = useState("");
  const dispenserRef: any = useRef();
  const videoRef: any = useRef();
  const topic = `signage/smile-and-get-candy/screen/${Settings.screenId}`;

  const publish = async () => {
    mqttClient.publish(topic, "From webapp");
  };

  const messageRecieved = (message: string) => {
    videoRef.current.play();
    setTimeout(() => {
      if (videoRef.current) videoRef.current.currentTime = 0;
    }, 7000);
    var audio = new Audio("candyrecording.m4a");
    audio.play();
  };

  useEffect(() => {
    console.log("From useeffect");
    mqttClient.subscribe(topic, messageRecieved);
    return () => {
      console.log("Unsubscribing from MQTT topic");
      mqttClient.unsubscribe(topic);
    };
  });

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h5" pb={1}>
            Candy Dispenser
          </Typography>
          <video ref={videoRef} src="dispenser.mov" width={400}></video>
          <Editor
            value={serverResponse}
            onValueChange={(code) => {}}
            highlight={(code) => {
              return code;
            }}
            padding={5}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 12,
            }}
          ></Editor>
        </CardContent>
        <CardActions>
          <Button onClick={publish}>Publish message to MQTT topic</Button>
        </CardActions>
      </Card>
    </>
  );
}
