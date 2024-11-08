import { Typography, Grid, Card, CardContent } from "@mui/material";
import Playback from "./Playback";
import Camera from "./Camera";
import UserRegistration from "./UserRegistration";
import Overview from "./Overview";
import CandyDispenser from "./CandyDispenser";
import { Settings } from "../Settings";

export default function Combined() {
  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={Settings.cameraEnabled ? 7 : 5}>
          <Card>
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                Playback
              </Typography>

              <Playback showResponse={true} imageHeight={300} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={Settings.cameraEnabled ? 5 : 7}>
          <Grid paddingBottom={2} hidden={Settings.cameraEnabled}>
            <Overview />
          </Grid>
          <Grid paddingBottom={2} hidden={!Settings.cameraEnabled}>
            <Camera autocapture={true} hidevideo={true} capturetitle="Camera" />
          </Grid>
          <Grid hidden={!Settings.cameraEnabled}>
            <CandyDispenser />
          </Grid>
        </Grid>
        <Grid item xs={6}></Grid>
        <Grid item xs={12} hidden={!Settings.cameraEnabled}>
          <Overview />
        </Grid>
      </Grid>
    </>
  );
}
