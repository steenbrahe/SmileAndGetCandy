import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { RouterProvider } from "react-router-dom";
import { router } from "./Routes";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
// React.StrictMode is used to prevent unnecessary re-renders of the UI, but will render components twice in DEV
root.render(
  //<React.StrictMode>
  <RouterProvider router={router} />
  //</React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
