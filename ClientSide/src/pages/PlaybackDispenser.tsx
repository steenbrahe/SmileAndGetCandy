import { Card, CardContent, Grid, Typography } from "@mui/material";
import Playback from "./Playback";
import CandyDispenser from "./CandyDispenser";
import Camera from "./Camera";

export default function PlaybackDispenser() {
  return (
    <>
      <>
        <Grid container spacing={2}>
          <Grid item xs={7}>
            <Card>
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  Playback
                </Typography>

                <Playback />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={5}>
            <Grid>
              <CandyDispenser />
            </Grid>
          </Grid>
          <Grid item xs={6}>
            <Camera autocapture={true} hide={true} />
          </Grid>
        </Grid>
      </>
    </>
  );
}
