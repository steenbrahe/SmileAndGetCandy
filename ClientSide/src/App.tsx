import * as React from "react";
import { styled, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { RemoteControl } from "./RemoteControl";
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
} from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import {
  AccountTree,
  AppRegistration,
  CameraFront,
  ConnectedTv,
  Dashboard,
  PrecisionManufacturing,
  Settings,
  Terminal,
} from "@mui/icons-material";
import { useEffect, useState } from "react";

const drawerWidth: number = 240;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: "border-box",
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

export default function App() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const toggleDrawer = () => {
    setOpen(!open);
  };

  useEffect(() => {
    console.log("App component being created, now creating remotecontrol");
    const remoteControl = new RemoteControl(
      navigate,
      setSelectedIndex,
      setOpen
    );
    remoteControl.listen();
  }, []);

  const MainMenu = [
    {
      Icon: <AccountTree />,
      Text: "Architecture",
      Link: "/overview",
    },
    {
      Icon: <ConnectedTv />,
      Text: "Playback",
      Link: "/playback",
    },
    {
      Icon: <PrecisionManufacturing />,
      Text: "Playback & Dispenser",
      Link: "/playbackdispenser",
    },
    {
      Icon: <AppRegistration />,
      Text: "User Registration",
      Link: "/register",
    },
    {
      Icon: <Terminal />,
      Text: "Technical Dashboard",
      Link: "/combined",
    },
  ];
  const SecondaryMenu = [
    {
      Icon: <Settings />,
      Text: "Settings",
      Link: "/admin",
    },
    {
      Icon: <CameraFront />,
      Text: "Camera",
      Link: "/camera",
    },
    {
      Icon: <PrecisionManufacturing />,
      Text: "Candy Dispenser",
      Link: "/dispenser",
    },
  ];

  function createMenuItem(item: any, index: number) {
    return (
      <ListItem key={item.Text} disablePadding sx={{ display: "block" }}>
        <ListItemButton
          selected={selectedIndex === index}
          onClick={() => {
            setSelectedIndex(index);
            navigate(item.Link);
          }}
          sx={{
            minHeight: 48,
            px: 2.5,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: open ? 2 : "auto",
            }}
          >
            {item.Icon}
          </ListItemIcon>
          <ListItemText sx={{ opacity: open ? 1 : 0 }}>
            <Typography variant="body2">{item.Text}</Typography>
          </ListItemText>
        </ListItemButton>
      </ListItem>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: "24px", // keep right padding when drawer closed
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: "36px",
                ...(open && { display: "none" }),
              }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              component="h1"
              variant="h6"
              color="inherit"
              onClick={() => navigate("/")}
              noWrap
              sx={{ flexGrow: 1 }}
            >
              Smile and Get Candy
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              px: [1],
            }}
          >
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <List component="nav">
            {MainMenu.map((item, index) => createMenuItem(item, index))}
          </List>
          <Divider></Divider>
          <List component="nav">
            {SecondaryMenu.map((item, index) =>
              createMenuItem(item, index + MainMenu.length)
            )}
          </List>
        </Drawer>
        <Box
          component="main"
          p={3}
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[100]
                : theme.palette.grey[900],
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        >
          <Toolbar />

          <Outlet />
        </Box>
      </Box>
    </ThemeProvider>
  );
}
