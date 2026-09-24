import { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

const SESSION_KEY = "veltra-auth";

export default function App() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true"
  );

  function handleLogin() {
    sessionStorage.setItem(SESSION_KEY, "true");
    setAuthed(true);
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  }

  return authed ? (
    <Dashboard onLogout={handleLogout} />
  ) : (
    <Login onLogin={handleLogin} />
  );
}
