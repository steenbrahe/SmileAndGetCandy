import { Snackbar, Alert, AlertColor } from "@mui/material";
import { useEffect, useState } from "react";
/**
 *
 */
export default function InfoPopup({
  message = "",
  severity = "success",
  onClose = () => {},
}) {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  useEffect(() => {
    if (message.length > 0) {
      console.log("setting open");
      setSnackbarOpen(true);
    }
  }, [message]);

  const handleClose = () => {
    setSnackbarOpen(false);
    onClose();
  };

  return (
    <>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        open={snackbarOpen}
        onClose={handleClose}
        autoHideDuration={3000}
        message="Note archived"
      >
        <Alert
          onClose={handleClose}
          severity={severity as AlertColor}
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </>
  );
}
