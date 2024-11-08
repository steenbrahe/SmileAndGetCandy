import { Card, CardContent, Typography } from "@mui/material";
import QRCode from "react-qr-code";

export default function Guide() {
  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h5">How to run the demo</Typography>
          <Typography variant="body2" mb={2}>
            Scan the below QR code from a mobile device in order to remotely
            control the demo. <br></br>
            Follow the instructions on the mobile device. <br></br>
            The demo can also be run directly from this browser if there is
            access to a camera, a keyboard and a mouse
          </Typography>

          <QRCode
            value={process.env.REACT_APP_CLOUDFRONT_REMOTECONTROL_ENDPOINT!}
          />
        </CardContent>
      </Card>
    </>
  );
}
