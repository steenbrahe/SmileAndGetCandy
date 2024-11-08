import { Settings } from "./Settings";
import { mqttClient } from "./utils/MQTTClient";

const topic = `signage/smile-and-get-candy/remotecontrol/screen/${Settings.screenId}`;
const INACTIVITY_TIME = 240000; // 4 minutes

/**
 * Class to subscribe to events from MQTT and control the behavior of the app
 */
export class RemoteControl {
  navigate: any;
  setSelectionIndex: any;
  setOpen: any;
  time: number;

  constructor(navigate: any, setSelectionIndex: any, setOpen: any) {
    this.navigate = navigate;
    this.setSelectionIndex = setSelectionIndex;
    this.setOpen = setOpen;
    this.time = new Date().getTime();

    // make timer that will reset to QR page in case of inactivity after 3 minutes - when no messages have been received
    setTimeout(this.checkInactivity, 60000);
  }

  private checkInactivity: any = () => {
    const delta = new Date().getTime() - this.time;
    console.log("Checking for inactivity. Last activity since ms: " + delta);
    if (delta > INACTIVITY_TIME) {
      console.log(
        "There has been no activity for some time, therefore restarting to original page"
      );
      this.restart();
    }
    setTimeout(this.checkInactivity, 60000);
  };

  private restart() {
    console.log("restarting demo");
    this.time = new Date().getTime();
    Settings.cameraEnabled = true;
    this.setOpen(true);
    this.navigate("/");
    this.setSelectionIndex(0);
  }

  private messageRecieved: any = (message: string) => {
    this.time = new Date().getTime();
    console.log("Message recieved: " + message);
    if (message == "playback") {
      this.navigate("/playback");
      this.setSelectionIndex(1);
    } else if (message == "playbackdispenser") {
      this.navigate("/playbackdispenser");
      this.setSelectionIndex(2);
    } else if (message == "technical") {
      this.navigate("/combined");
      this.setSelectionIndex(4);
    } else if (message == "architecture") {
      this.navigate("/overview");
      this.setSelectionIndex(0);
    } else if (message == "expand") {
      this.setOpen(true);
    } else if (message == "collapse") {
      this.setOpen(false);
    } else if (message == "camera-disable") {
      Settings.cameraEnabled = false;
    } else if (message == "camera-enable") {
      Settings.cameraEnabled = true;
    } else if (message == "restart") {
      this.restart();
    } else {
      this.navigate("/overview");
      this.setSelectionIndex(0);
    }
  };

  async listen() {
    console.log("Subscribing to MQTT topic for remote control");
    mqttClient.subscribe(topic, this.messageRecieved);
  }
}
