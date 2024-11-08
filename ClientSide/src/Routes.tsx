import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Playback from "./pages/Playback";
import Camera from "./pages/Camera";
import Admin from "./pages/Admin";
import UserRegistration from "./pages/UserRegistration";
import Overview from "./pages/Overview";
import Combined from "./pages/Combined";
import CandyDispenser from "./pages/CandyDispenser";
import PlaybackDispenser from "./pages/PlaybackDispenser";
import Guide from "./pages/Guide";
export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "",
        element: <Guide />,
      },
      {
        path: "overview",
        element: <Overview />,
      },
      {
        path: "admin",
        element: <Admin />,
      },
      {
        path: "playback",
        element: <Playback />,
      },
      {
        path: "camera",
        element: <Camera />,
      },
      {
        path: "register",
        element: <UserRegistration />,
      },
      {
        path: "combined",
        element: <Combined />,
      },
      {
        path: "dispenser",
        element: <CandyDispenser />,
      },
      {
        path: "playbackdispenser",
        element: <PlaybackDispenser />,
      },
    ],
  },
]);
