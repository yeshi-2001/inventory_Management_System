const BASE      = process.env.REACT_APP_API_URL;
const ANALYTICS = process.env.REACT_APP_ANALYTICS_URL;

const getToken = () => localStorage.getItem("token");

const handle = async (res) => {
  const json = await res.json();
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }
  if (!json.success) throw new Error(json.error || "Request failed");
  return json.data;
};

const headers = (extra = {}) => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

export const api = {
  get:    (path)        => fetch(`${BASE}${path}`, { headers: headers() }).then(handle),
  post:   (path, body)  => fetch(`${BASE}${path}`, { method: "POST",   headers: headers(), body: JSON.stringify(body) }).then(handle),
  put:    (path, body)  => fetch(`${BASE}${path}`, { method: "PUT",    headers: headers(), body: JSON.stringify(body) }).then(handle),
  delete: (path)        => fetch(`${BASE}${path}`, { method: "DELETE", headers: headers() }).then(handle),
};

export const getAnalytics = (inventory) =>
  fetch(`${ANALYTICS}/analytics/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inventory),
  }).then(handle);
