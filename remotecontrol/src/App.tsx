import React, { SyntheticEvent, useState } from "react";
import "./App.css";
import {
  AppBar,
  Backdrop,
  Box,
  CircularProgress,
  Tab,
  Tabs,
  ThemeProvider,
  useTheme,
} from "@mui/material";
import {
  AppRegistration,
  ConnectedTv,
  LiveHelp,
  PrecisionManufacturing,
  Terminal,
} from "@mui/icons-material";
import { Settings } from "./Settings";
import { mqttClient } from "./utils/MQTTClient";
import UserRegistration from "./pages/UserRegistration";
import Playback from "./pages/Playback";
import Guide from "./pages/Guide";
import Technical from "./pages/Technical";
import InfoText from "./pages/InfoText";
import InfoPopup from "./pages/InfoPopup";
import * as api from "./api/api";

const topic = `signage/smile-and-get-candy/remotecontrol/screen/${Settings.screenId}`;
const topicCandy = `signage/smile-and-get-candy/screen/${Settings.screenId}`;

function App() {
  const theme = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cameraType, setCameraType] = useState("mobile");
  const [started, setStarted] = useState(Settings.isStarted);
  const [infoMessage, setInfoMessage] = useState("");
  const [inProgress, setInProgress] = useState(false);
  const [autoNavigate, setAutoNavigate] = useState(true);

  interface TabPanelProps {
    children?: React.ReactNode;
    dir?: string;
    index: number;
    value: number;
  }

  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`full-width-tabpanel-${index}`}
        aria-labelledby={`full-width-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
      </div>
    );
  }

  function a11yProps(index: number) {
    return {
      id: `full-width-tab-${index}`,
      "aria-controls": `full-width-tabpanel-${index}`,
    };
  }

  function sendMessage(message: string) {
    console.log("Publishing message:" + message);
    mqttClient.publish(topic, message);
  }

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log("index:" + newValue);
    setSelectedIndex(newValue);
    switch (newValue) {
      case 0:
        sendMessage("architecture");
        break;
      case 1:
        sendMessage("playback");
        break;
      case 2:
        // Register
        break;
      case 3:
        sendMessage("playbackdispenser");
        break;
      case 4:
        sendMessage("technical");
        break;

      default:
        break;
    }
  };

  function next() {
    console.log("next called");
    handleChange({} as SyntheticEvent, selectedIndex + 1);
  }
  function back() {
    console.log("next called");
    handleChange({} as SyntheticEvent, selectedIndex - 1);
  }

  const messageRecieved: any = (message: string) => {
    // Play music
    console.log("Message received, now playing music.");
    var audio = new Audio("candyrecording.m4a");
    audio.play();
  };

  function startDemo() {
    console.log("startdemo called");
    setInProgress(true);

    mqttClient.connect().then(() => {
      Settings.cameraEnabled = cameraType == "mobile";
      Settings.isStarted = true;
      setStarted(true);

      if (Settings.cameraEnabled) {
        sendMessage("camera-disable");
      } else {
        sendMessage("camera-enable");
      }
      sendMessage("collapse"); // Collaps the menu
      sendMessage("architecture"); // Show the Architecture page
      mqttClient.subscribe(topicCandy, messageRecieved);
      setInProgress(false);

      if (autoNavigate) {
        handleChange({} as React.SyntheticEvent, 1);
        setInfoMessage("Demo started - Auto navigated to playing images");
      } else {
        setInfoMessage("Demo started - click Next");
      }
    });
  }
  function endDemo() {
    console.log("enddemo called");
    setStarted(false);
    Settings.cameraEnabled = cameraType == "mobile";
    Settings.isStarted = false;
    handleChange({} as SyntheticEvent, 0);
    if (mqttClient.isConnected) {
      sendMessage("restart");
      mqttClient.disconnect();
    }

    if (Settings.email.length > 0) {
      api
        .deleteUser(Settings.email)
        .then((response) => {
          Settings.email = "";
          console.log("User deleted:" + response.email);
          setInfoMessage("Demo ended - user deleted");
        })
        .catch((error) => {
          console.log("error: " + error.message);
          setInfoMessage("error: " + error.message);
        });
    } else {
      setInfoMessage("Demo ended");
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Box>
        <AppBar position="static">
          <Tabs
            value={selectedIndex}
            onChange={handleChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant="scrollable"
            aria-label="full width tabs example"
          >
            <Tab icon={<LiveHelp />} label="Guide" {...a11yProps(0)} />
            <Tab icon={<ConnectedTv />} label="Images" {...a11yProps(1)} />
            <Tab
              icon={<AppRegistration />}
              label="New User"
              {...a11yProps(2)}
            />
            <Tab
              icon={<PrecisionManufacturing />}
              label="Candy"
              {...a11yProps(3)}
            />
            <Tab icon={<Terminal />} label="Tech" {...a11yProps(4)} />
          </Tabs>
        </AppBar>

        <TabPanel value={selectedIndex} index={0} dir={theme.direction}>
          <Guide next={next} startDemo={startDemo} endDemo={endDemo}></Guide>
        </TabPanel>
        <TabPanel value={selectedIndex} index={1} dir={theme.direction}>
          <InfoText title="Show Changing Images">
            Images are now shown at the display. Explain that the camera is
            taking pictures, it is analysed, and images change based on user
            wearing glasses, having a beard or smiling.
          </InfoText>

          <Playback next={next} back={back} showCandyButton={false} />
        </TabPanel>
        <TabPanel value={selectedIndex} index={2} dir={theme.direction}>
          <UserRegistration next={next} back={back} />
        </TabPanel>
        <TabPanel value={selectedIndex} index={3} dir={theme.direction}>
          <InfoText title="User smiles and gets candy">
            Images are shown again. Make sure you are recognized and see a
            welcome message and images of cats or dogs. Then starts to smile for
            5 seconds. You should see a smiling image and a congratulations
            message and the Candy dispenser should be activated. You can cheat
            and get candy anyway by clicking the Cheat button. Use this if you
            are not recognized.
          </InfoText>
          <Playback next={next} back={back} />
        </TabPanel>
        <TabPanel value={selectedIndex} index={4} dir={theme.direction}>
          <Technical back={back} endDemo={endDemo} />
        </TabPanel>
        <InfoPopup
          message={infoMessage}
          onClose={() => setInfoMessage("")}
        ></InfoPopup>
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={inProgress}
          onClick={() => {}}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Box>
    </ThemeProvider>
  );
}

export default App;
