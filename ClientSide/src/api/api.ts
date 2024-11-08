import { Settings } from "../Settings";

async function sendRequest(url: string, method: string, body: any) {
  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  let requestOptions: RequestInit = {
    method: method,
    headers: headers,
    redirect: "follow",
    body: body,
  };

  let response;
  try {
    response = await fetch(url, requestOptions);
  } catch (err) {
    return `error ${response}`;
  }

  if (response.status === 403 || response.status === 401) {
    const text = await response.json();
    throw new Error(text.message);
  }

  if (response.status !== 200) {
    const text = await response.json();
    throw new Error(text.message);
  }

  return await response.json();
}

/**
 * Execute HTTP POST request and receive response with playlist containing images to show
 */
export async function getPlaylist() {
  const url = `${process.env.REACT_APP_API_END_POINT}/screen/${Settings.screenId}/playlist`;
  console.log("Sending HTTP GET request to: " + url);
  return await sendRequest(url, "GET", null);
}

/**
 * Execute HTTP POST request and receive response with playlist containing images to show
 */
export async function detectUser(request: any) {
  //
  const url = `${process.env.REACT_APP_API_END_POINT}/screen/${Settings.screenId}/detectuser`;
  console.log("Sending HTTP POST request to: " + url);
  console.log("Request body:", request);
  let raw = JSON.stringify(request);
  return await sendRequest(url, "POST", raw);
}

/**
 * Creates a new user
 */
export async function createUser(user: any) {
  const url = `${process.env.REACT_APP_API_END_POINT}/user/create`;
  let raw = JSON.stringify(user);
  return await sendRequest(url, "POST", raw);
}

/**
 * Deletes a new user
 */
export async function deleteUser(email: string) {
  const url = `${process.env.REACT_APP_API_END_POINT}/user/delete`;
  return await sendRequest(url, "DELETE", JSON.stringify({ email: email }));
}
