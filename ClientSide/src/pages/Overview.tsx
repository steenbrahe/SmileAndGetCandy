import { Card, CardContent, Typography } from "@mui/material";

export default function Overview() {
  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h5">Solution Architecture</Typography>
          <img
            src="/images/architecture.drawio.png"
            alt="architecture"
            style={{ width: "100%" }}
          />
        </CardContent>
      </Card>
    </>
  );
}
