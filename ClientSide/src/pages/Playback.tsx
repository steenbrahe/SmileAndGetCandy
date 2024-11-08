import { Grid, Paper, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import Carousel from "react-material-ui-carousel";
import { Settings } from "../Settings";
import * as api from "../api/api";
import Editor from "react-simple-code-editor";
import Camera from "./Camera";

export default function Playback({
  playbackTitle = "sdf",
  showResponse = false,
  imageHeight = 700,
}: any) {
  const [title, setTitle] = useState(Settings.playlist.title);
  const [description, setDescription] = useState(Settings.playlist.description);
  const [serverResponse, setServerResponse] = useState("");
  const [captureTime, setCaptureTime] = useState("");
  const [items, setItems] = useState(Settings.playlist.items);

  const titleRef: any = useRef();
  const descriptionRef: any = useRef();
  let unloaded = false; // Used for stopping the async recursive function which cannot see the statechange

  useEffect(() => {
    // Wait 5 sec before next image capture
    console.log("New items loaded, Now waiting 6 sec before capturing again");
    setTimeout(updatePlaylist, 6000);
    return () => {
      // actions to be performed when component unmounts
      unloaded = true;
    };
  }, [items]);

  /**
   * Execute REST API get playlist back for specific screen
   **/
  async function updatePlaylist() {
    // TODO make try/catch around and show error
    const data = await api.getPlaylist();

    // Update image URLs from response playlist
    console.log("*** Response body:", data);
    setServerResponse(JSON.stringify(data, null, 2));
    // @ts-ignore
    const time = new Date();
    setCaptureTime(time.toUTCString());

    if (data.title != title || data.description != description) {
      setTitle(data.title);
      setDescription(data.description);
      Settings.playlist.title = data.title;
      Settings.playlist.description = data.description;
      const newItems = [];
      for (let i in data.content) {
        newItems.push({ src: data.content[i].imageUrl });
      }
      Settings.playlist.items = newItems;
      setItems(newItems);
      console.log("Images updated");
    } else if (!unloaded) {
      // Wait 5 sec before playlist is asked again
      console.log("Same title, Now waiting 6 sec before getting playlis again");
      setTimeout(updatePlaylist, 6000);
    }
  }

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <Typography variant="h5" ref={titleRef}>
            {title}
          </Typography>
          <Typography variant="h6" ref={descriptionRef} paddingTop={4}>
            {description}
          </Typography>
        </Grid>
        <Grid item xs={9}>
          <Carousel
            height={imageHeight}
            autoPlay={true}
            stopAutoPlayOnHover={false}
            duration={4000}
            indicators={false}
          >
            {items.map((item: any, i: number) => (
              <Paper key={i}>
                <img
                  src={item.src}
                  height={imageHeight}
                  alt="imageslides"
                  style={{ maxWidth: "100%" }}
                />
              </Paper>
            ))}
          </Carousel>
        </Grid>
        <Grid item xs={3}></Grid>
        <Grid item xs={9} hidden={!showResponse}>
          <Typography variant="body2">Request time: {captureTime}</Typography>
          <Typography variant="body2">
            Server Response for GET /screen/&#123;screenId&#125;/playlist:
          </Typography>
          <Editor
            value={serverResponse}
            onValueChange={(code) => {}}
            highlight={(code) => {
              return code;
            }}
            padding={5}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 10,
            }}
          ></Editor>
        </Grid>
        <Grid item xs={3}>
          <Camera autocapture={true} hide={true} />
        </Grid>
      </Grid>
    </>
  );
}
