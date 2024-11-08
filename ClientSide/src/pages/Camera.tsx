import {
  Button,
  Card,
  CardActions,
  CardContent,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import Editor from "react-simple-code-editor";
import * as api from "../api/api";
import { Settings } from "../Settings";

export default function Camera({
  autocapture = false,
  hidevideo,
  hide,
  capturetitle = "Captured Image",
}: any) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [captureTime, setCaptureTime] = useState("");
  const [serverResponse, setServerResponse] = useState("");
  const [autoCapture, setAutoCapture] = useState(autocapture);
  const [hideVideo] = useState(hidevideo);

  const canvasRef: any = useRef();
  const videoRef: any = useRef();
  let unloaded = false; // Used for stopping the async recursive function whicah cannot see the statechange

  useEffect(() => {}, []);

  useEffect(() => {
    console.log("autoCapture changed to: " + autoCapture);
    if (autoCapture && videoLoaded) {
      capture();
    }
    return () => {
      // actions to be performed when component unmounts
      console.log("unloaded is set to true");
      unloaded = true;
    };
  }, [autoCapture]);

  useEffect(() => {
    // Setup access to web cam
    // @ts-ignore
    let video = videoRef.current;
    console.log("videoLoaded changed to: " + videoLoaded);
    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(function (stream) {
          video.srcObject = stream;
          console.log("videostream is set");
          setVideoLoaded(true);
          if (autoCapture) {
            capture();
          }
        })
        .catch(function (error) {
          console.log("Something went wrong!", error);
        });
    }
  }, []);

  /**
   * Captures a screenshot, gets content to be shown, and customizes the playing
   **/
  const capture = async () => {
    if (unloaded) {
      return;
    }
    if (!Settings.cameraEnabled) {
      console.log("Camera disabled");
      setTimeout(capture, 4000);
      return;
    }
    console.log("*************************************************");
    console.log("Capturing webcam image and sending to Rekognition");
    console.log("autocapture:" + autoCapture);
    // @ts-ignore
    let canvas = canvasRef.current;
    if (canvas == null) {
      return;
    }
    // Capture image from webcam through canvas
    // @ts-ignore
    canvas
      .getContext("2d")
      .drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Get base64 encoded part of image
    let image_data_url = canvas.toDataURL("image/jpeg");
    let n = image_data_url.indexOf("base64,");
    let base64 = image_data_url.substring(n + 7);

    let detectUserRequest = {
      image: base64,
    };

    // Call the detect user API
    const data = await api.detectUser(detectUserRequest);
    console.log("Detected user", data);
    setServerResponse(JSON.stringify(data, null, 2));

    if (autoCapture && !unloaded) {
      console.log("Autocapture is on, we call capture again in 4 sec");
      setTimeout(capture, 4000);
    }
    // @ts-ignore
    const time = new Date();
    setCaptureTime(time.toUTCString());
  };

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={6} hidden={hideVideo || hide}>
          <Card>
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                Video Camera
              </Typography>
              <video autoPlay ref={videoRef} width="100%"></video>
            </CardContent>
            <CardActions>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={capture}>
                  Capture
                </Button>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoCapture}
                      onChange={() => {
                        console.log(autoCapture);
                        setAutoCapture(!autoCapture);
                      }}
                    />
                  }
                  label="Auto capture"
                />
              </Stack>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={hideVideo ? 12 : 6} hidden={hide}>
          <Card>
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                {capturetitle}
              </Typography>
              <canvas ref={canvasRef} width="360" height="240"></canvas>
              <Typography variant="body2">
                Capture time: {captureTime}
              </Typography>

              <Typography variant="body2">
                Server Response for POST
                /screen/&#123;screenId&#125;/detectuser:
              </Typography>
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
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
