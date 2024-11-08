import {
  Grid,
  Card,
  Button,
  CardActions,
  CardContent,
  Typography,
  Alert,
  IconButton,
  TextField,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import * as api from "../api/api";
import { useEffect, useRef, useState } from "react";

export default function UserRegistration() {
  // TODO make service class for the User interaction
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [photoTaken, setPhotoTaken] = useState(false);
  const [videoLoaded] = useState(false);
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("dogs");
  const [image, setImage] = useState("");

  const videoRef: any = useRef();
  const canvasRef: any = useRef();

  const registerUser = async () => {
    setErrorMsg("");
    setInfoMsg("");
    api
      .createUser({
        email: email,
        fullname: fullname,
        interest: interest,
        image: image,
      })
      .then((response) => {
        console.log("response", response);
        setInfoMsg("User created successfully");
      })
      .catch((error) => {
        console.log("error: " + error.message);
        setErrorMsg(error.message);
      });
  };

  const deleteUser = async () => {
    setErrorMsg("");
    setInfoMsg("");
    api
      .deleteUser(email)
      .then((response) => {
        console.log("response", response);
        setInfoMsg("User successfully deleted");
      })
      .catch((error) => {
        console.log("error: " + error.message);
        setErrorMsg(error.message);
      });
  };

  const takePhoto = () => {
    let canvas = canvasRef.current;
    // Capture image from webcam through canvas
    // @ts-ignore
    canvas
      .getContext("2d")
      .drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Get base64 encoded part of image
    let image_data_url = canvas.toDataURL("image/jpeg");
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
        <Grid
          item
          xs={12}
          hidden={errorMsg.length === 0 && infoMsg.length === 0}
        >
          <Alert
            severity={errorMsg.length === 0 ? "info" : "error"}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setErrorMsg("");
                  setInfoMsg("");
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            {errorMsg || infoMsg}
          </Alert>
        </Grid>
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                Register User
              </Typography>
              <TextField
                id="fullname"
                label="Full name"
                variant="standard"
                fullWidth
                onChange={(e) => setFullname(e.target.value)}
              />
              <TextField
                id="email"
                label="Email"
                variant="standard"
                fullWidth
                onChange={(e) => setEmail(e.target.value)}
              />
              <Typography gutterBottom variant="h6" component="div">
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
              <Typography gutterBottom variant="h6" component="div">
                Photo
              </Typography>
              <video autoPlay ref={videoRef} width="240" hidden={true}></video>
              <canvas ref={canvasRef} width="240" height="180"></canvas>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={takePhoto}>
                Take photo
              </Button>
              <Button
                size="small"
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
        <Grid item xs={6}>
          <Card>
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                Delete User
              </Typography>

              <TextField
                id="emailDelete"
                label="Email"
                variant="standard"
                fullWidth
                onChange={(e) => setEmail(e.target.value)}
              />
            </CardContent>
            <CardActions>
              <Button
                size="small"
                onClick={deleteUser}
                disabled={email.length === 0}
              >
                Delete
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
