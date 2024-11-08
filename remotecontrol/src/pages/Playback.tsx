import { Button, Divider, Grid, Stack } from "@mui/material";
import Camera from "./Camera";
import { Settings } from "../Settings";
import { Cake, NavigateBefore, NavigateNext } from "@mui/icons-material";
import { mqttClient } from "../utils/MQTTClient";
import { useState } from "react";
import InfoPopup from "./InfoPopup";

const topic = `signage/smile-and-get-candy/screen/${Settings.screenId}`;

export default function Playback({
  next = () => {},
  back = () => {},
  showCandyButton = true,
}) {
  const [infoMessage, setInfoMessage] = useState("");

  function cheat() {
    if (mqttClient.isConnected) {
      mqttClient.publish(topic, "cheating");
      setInfoMessage("Candy sent :-)");
    } else {
      setInfoMessage("Unable to send candy. MQTT client not connected");
    }
  }

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Camera
            hide={!Settings.cameraEnabled}
            autocapture={Settings.cameraEnabled}
          ></Camera>
        </Grid>
        <Grid item xs={12}>
          <Divider></Divider>
        </Grid>
        <Grid item xs={12}>
          <Stack direction="row" spacing={4} justifyContent="space-between">
            <Button size="large" variant="contained" onClick={back}>
              <NavigateBefore /> Back
            </Button>
            {showCandyButton ? (
              <Button size="large" variant="contained" onClick={cheat}>
                <Cake /> Cheat
              </Button>
            ) : null}

            <Button size="large" variant="contained" onClick={next}>
              Next <NavigateNext />
            </Button>
          </Stack>
        </Grid>
      </Grid>
      <InfoPopup
        message={infoMessage}
        onClose={() => setInfoMessage("")}
      ></InfoPopup>
    </>
  );
}
