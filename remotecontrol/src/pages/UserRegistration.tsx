import {
  Grid,
  Card,
  Button,
  CardActions,
  CardContent,
  Typography,
  TextField,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Divider,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import * as api from "../api/api";
import { useEffect, useRef, useState } from "react";
import { NavigateBefore, NavigateNext } from "@mui/icons-material";
import InfoText from "./InfoText";
import { Settings } from "../Settings";
import InfoPopup from "./InfoPopup";

export default function UserRegistration({
  next = () => {},
  back = () => {},
  autoNavigate = true,
}) {
  // TODO make service class for the User interaction
  const [infoMessage, setInfoMessage] = useState("");
  const [infoSeverity, setInfoSeverity] = useState("success");

  const [photoTaken, setPhotoTaken] = useState(false);
  const [videoLoaded] = useState(false);
  const [fullname, setFullname] = useState("John Doe");
  const [email, setEmail] = useState("john@email.com");
  const [interest, setInterest] = useState("dogs");
  const [image, setImage] = useState("");
  const [userCreated, setUserCreated] = useState(false);
  const [inProgress, setInProgress] = useState(false);

  const videoRef: any = useRef();
  const canvasRef: any = useRef();
  const canvasHiddenRef: any = useRef();

  const registerUser = async () => {
    setInProgress(true);
    api
      .createUser({
        email: email,
        fullname: fullname,
        interest: interest,
        image: image,
      })
      .then((response) => {
        console.log("response", response);
        setInProgress(false);
        setInfoSeverity("success");
        Settings.email = email; // So we can delete the user later
        setUserCreated(true);
        if (autoNavigate) {
          setInfoMessage("User created - auto navigated to playing images");
          setTimeout(next, 2000);
        } else {
          setInfoMessage("User created - now click Next");
        }
      })
      .catch((error) => {
        console.log("error: " + error.message);
        setInProgress(false);
        setInfoMessage("Unable to create user. " + error.message);
        setInfoSeverity("error");
      });
  };

  const takePhoto = () => {
    let canvasHidden = canvasHiddenRef.current;
    let canvas = canvasRef.current;
    const ratio = videoRef.current.videoWidth / videoRef.current.videoHeight;

    // Capture image from webcam through canvas. We use two - one for a smaller image to display, one hidden for a larger one to send through API
    // @ts-ignore
    canvas.width = canvas.height * ratio;
    canvas
      .getContext("2d")
      .drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvasHidden.width = canvasHidden.height * ratio;
    canvasHidden
      .getContext("2d")
      .drawImage(
        videoRef.current,
        0,
        0,
        canvasHidden.width,
        canvasHidden.height
      );

    // Get base64 encoded part of image
    let image_data_url = canvasHidden.toDataURL("image/jpeg");
    let n = image_data_url.indexOf("base64,");
    let base64 = image_data_url.substring(n + 7);

    setImage(base64);

    setPhotoTaken(true);
  };

  useEffect(() => {
    // Setup access to web cam
    // @ts-ignore
    let video = videoRef.current;

    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(function (stream) {
          video.srcObject = stream;
        })
        .catch(function (error) {
          console.log("Something went wrong!", error);
        });
    }
  }, [videoLoaded]);

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <InfoText title="Register New User">
            Create a new user with an interest, take a picture and click the
            Register button. Then click Next. After clicking Next, you will be
            recognized with a welcome message and images of interest at the
            display.
          </InfoText>
          <canvas ref={canvasHiddenRef} height="480" hidden></canvas>
          <Card>
            <CardContent sx={{ padding: 1 }}>
              <TextField
                id="fullname"
                label="Full name"
                variant="standard"
                value={fullname}
                fullWidth
                onChange={(e) => setFullname(e.target.value)}
              />
              <TextField
                id="email"
                label="Email"
                variant="standard"
                value={email}
                fullWidth
                onChange={(e) => {
                  setEmail(e.target.value);
                  Settings.email = e.target.value;
                }}
              />
              <Typography variant="subtitle1" component="div">
                Interests
              </Typography>
              <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
                defaultValue="dogs"
                onChange={(e) => setInterest(e.target.value)}
              >
                <FormControlLabel
                  value="cats"
                  control={<Radio />}
                  label="Cats"
                />
                <FormControlLabel
                  value="dogs"
                  control={<Radio />}
                  label="Dogs"
                />
              </RadioGroup>
              <Typography variant="subtitle1" component="div">
                Photo
              </Typography>
              <video autoPlay playsInline ref={videoRef} hidden={true}></video>
              <canvas ref={canvasRef} height="120"></canvas>
            </CardContent>
            <CardActions>
              <Button size="large" onClick={takePhoto} variant="contained">
                Take photo
              </Button>
              <Button
                size="large"
                variant="contained"
                onClick={registerUser}
                disabled={
                  !photoTaken ||
                  fullname.length === 0 ||
                  email.length === 0 ||
                  interest.length === 0
                }
              >
                Register
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Divider></Divider>
        </Grid>
        <Grid item xs={12}>
          <Stack direction="row" justifyContent="space-between">
            <Button size="large" variant="contained" onClick={back}>
              <NavigateBefore /> Back
            </Button>
            <Button
              size="large"
              variant="contained"
              onClick={next}
              disabled={!userCreated}
            >
              Next <NavigateNext />
            </Button>
          </Stack>
        </Grid>
      </Grid>
      <InfoPopup
        severity={infoSeverity}
        message={infoMessage}
        onClose={() => setInfoMessage("")}
      ></InfoPopup>
      <Backdrop open={inProgress} onClick={() => {}}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
