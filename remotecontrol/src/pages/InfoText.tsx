import { Info, ExpandMore, ExpandLess } from "@mui/icons-material";
import { IconButton, Collapse, Paper, Typography, Stack } from "@mui/material";

import { useState } from "react";

export default function InfoText({ children, title = "" }: any) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <>
      <IconButton
        onClick={() => setInfoOpen(!infoOpen)}
        aria-label="expand"
        size="small"
        sx={{ padding: 0 }}
      >
        <Stack direction="row" justifyContent="space-between" spacing={3}>
          <Typography>{title}</Typography>
          <Stack direction="row">
            <Info />
            {!infoOpen ? <ExpandMore /> : <ExpandLess />}
          </Stack>
        </Stack>
      </IconButton>

      <Collapse in={infoOpen}>
        <Paper sx={{ padding: 1, marginBottom: 1 }}>
          <Typography>{children}</Typography>
        </Paper>
      </Collapse>
    </>
  );
}
