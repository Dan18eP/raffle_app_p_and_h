import { useState } from "react";
import api from "../services/api";
import "../Login.css";
import logo from "../assets/logopandh.jpg";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const form = new URLSearchParams();
      form.append("username", username);
      form.append("password", password);

      const res = await api.post("/login", form);

      localStorage.setItem("token", res.data.access_token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Credenciales inválidas");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src={logo} alt="Peace & Hope" className="login-logo" />

        <h2>Admin Login</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="error">{error}</p>}

          <button type="submit">Ingresar</button>
        </form>
      </div>
    </div>
  );
}
