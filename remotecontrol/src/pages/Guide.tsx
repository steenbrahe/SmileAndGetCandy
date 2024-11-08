import {
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Stack,
  Typography,
  Divider,
} from "@mui/material";
import { Settings } from "../Settings";
import { useEffect, useState } from "react";
import { mqttClient } from "../utils/MQTTClient";
import { NavigateNext } from "@mui/icons-material";
import InfoText from "./InfoText";

export default function Guide({
  next = () => {},
  startDemo = () => {},
  endDemo = () => {},
  autoNavigate = true,
  updateAutoNavigate = () => {},
}) {
  const [cameraType, setCameraType] = useState(
    Settings.cameraEnabled ? "mobile" : "web"
  );
  const [started, setStarted] = useState(Settings.isStarted);

  function start() {
    startDemo();
    setStarted(true);
  }

  function end() {
    endDemo();
    setStarted(false);
  }

  const handleCameraChange = (
    event: React.MouseEvent<HTMLElement>,
    newCamera: string
  ) => {
    if (newCamera !== null) {
      setCameraType(newCamera);
    }
  };

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <InfoText title="Start Demo here">
            You can use this app to control the smile and get candy web site.
            Start by clicking the Start Demo button, then follow the
            instructions and click the Next buttons to continue the demo. By
            default you should use the mobile camera for the demo.
          </InfoText>
        </Grid>
        <Grid item xs={12}>
          <Typography>Camera to use for monitoring customer</Typography>
          <ToggleButtonGroup
            color="primary"
            value={cameraType}
            disabled={started}
            exclusive
            onChange={handleCameraChange}
            aria-label="Platform"
          >
            <ToggleButton value="mobile">Mobile camera</ToggleButton>
            <ToggleButton value="web">Web site camera</ToggleButton>
          </ToggleButtonGroup>
        </Grid>
        <Grid item xs={12}>
          <Divider></Divider>
        </Grid>
        <Grid item xs={12}>
          <Stack direction="row" spacing={4}>
            <Button
              size="large"
              variant="contained"
              onClick={start}
              disabled={started}
            >
              Start Demo
            </Button>
            <Button
              size="large"
              variant="contained"
              onClick={end}
              disabled={!started}
            >
              End Demo
            </Button>
            <Button
              size="large"
              variant="contained"
              onClick={next}
              disabled={!started}
            >
              Next <NavigateNext />
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}
