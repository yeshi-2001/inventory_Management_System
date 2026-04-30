const BASE = process.env.REACT_APP_API_URL;
const ANALYTICS = process.env.REACT_APP_ANALYTICS_URL;

const handle = async (res) => {
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Request failed");
  return json.data;
};

export const api = {
  get: (path) => fetch(`${BASE}${path}`).then(handle),
  post: (path, body) =>
    fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),
  put: (path, body) =>
    fetch(`${BASE}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handle),
  delete: (path) => fetch(`${BASE}${path}`, { method: "DELETE" }).then(handle),
};

export const getAnalytics = (inventory) =>
  fetch(`${ANALYTICS}/analytics/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inventory),
  }).then(handle);
