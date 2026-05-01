import { createContext, useReducer, useEffect, useCallback } from "react";

const BASE = process.env.REACT_APP_API_URL;

export const AuthContext = createContext(null);

const initialState = { user: null, token: null, isLoading: true, isAuthenticated: false };

const reducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      return { ...state, user: action.user, token: action.token, isAuthenticated: true, isLoading: false };
    case "LOGOUT":
      return { ...initialState, isLoading: false };
    case "SET_LOADING":
      return { ...state, isLoading: action.value };
    default:
      return state;
  }
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // ── Verify token on app start ───────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { dispatch({ type: "LOGOUT" }); return; }

    fetch(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) dispatch({ type: "LOGIN", user: json.user, token });
        else { localStorage.removeItem("token"); dispatch({ type: "LOGOUT" }); }
      })
      .catch(() => { localStorage.removeItem("token"); dispatch({ type: "LOGOUT" }); });
  }, []);

  const login = useCallback(async (email, password, role) => {
    const res  = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Login failed");
    localStorage.setItem("token", json.token);
    dispatch({ type: "LOGIN", user: json.user, token: json.token });
    return json.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
