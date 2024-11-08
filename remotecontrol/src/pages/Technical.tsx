import { NavigateBefore } from "@mui/icons-material";
import { Grid, Stack, Button, Divider } from "@mui/material";
import InfoText from "./InfoText";

export default function Technical({ back = () => {}, endDemo = () => {} }) {
  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <InfoText title="Discuss technical details">
            At this page you can talk about the REST API calls that are made by
            the playback function and the camera, and how the candy dispenser is
            subscribing to an IOT Topic. You can show the architecture diagram
            by navigate back to the Guide tap. Click the End Demo button when
            you are ready with the demo. It will automatically delete the user
            you created.
          </InfoText>
        </Grid>
        <Grid item xs={12}>
          <Divider></Divider>
        </Grid>
        <Grid item xs={12}>
          <Stack direction="row" justifyContent="space-between">
            <Button size="large" variant="contained" onClick={back}>
              <NavigateBefore /> Back
            </Button>
            <Button size="large" variant="contained" onClick={endDemo}>
              End Demo
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}
