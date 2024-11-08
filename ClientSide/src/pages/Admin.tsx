import {
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useState } from "react";
import { Settings } from "../Settings";
import { CheckBox } from "@mui/icons-material";

export default function Admin() {
  const [screenId, setScreenId] = useState(Settings.screenId);
  const [cameraEnabled, setCameraEnabled] = useState(Settings.cameraEnabled);

  const screenIdChange = (e: any) => {
    setScreenId(e.target.value);
    console.log("screenId:" + e.target.value);
    Settings.screenId = e.target.value;
  };

  const cameraEnabledChanged = (e: any) => {
    setCameraEnabled(!cameraEnabled);
    Settings.cameraEnabled = !cameraEnabled;
  };

  return (
    <>
      <Typography variant="h4">Settings</Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Card>
            <CardActionArea>
              <CardContent>
                <TextField
                  id="screenId"
                  onChange={screenIdChange}
                  label="Screen ID"
                  variant="standard"
                  value={screenId}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={cameraEnabled}
                      onChange={cameraEnabledChanged}
                    />
                  }
                  label="Use Browser Camera"
                />
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
