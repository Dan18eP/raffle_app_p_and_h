import { useState } from "react";
import api from "../services/api";
import "../Login.css";
import logo from "../assets/logopandh.jpg";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState("");
  const [touched, setTouched] = useState({ username: false, password: false });

  const validate = () => {
    const errors = {};
    if (!username.trim()) errors.username = "El usuario es requerido";
    if (!password) errors.password = "La contraseña es requerida";
    return errors;
  };

  const errors = validate();
  const isValid = Object.keys(errors).length === 0;

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!isValid) return setTouched({ username: true, password: true });

    try {
      const form = new URLSearchParams();
      form.append("username", username);
      form.append("password", password);

      const res = await api.post("/login", form);

      localStorage.setItem("token", res.data.access_token);
      window.location.href = "/dashboard";
    } catch (err) {
      setServerError("Credenciales inválidas");
    }
  };

  return (
    <div className="login-page">
      <aside className="login-hero" aria-hidden>
        <div className="hero-content">
          <h1>Bienvenidos al sorteo de obras de arte de la Fundación Peace and Hope for the Children of Colombia</h1>
          <p>Gracias por su participación y colaboración — De la mano de ustedes, muchos jóvenes han emprendido el viaje de sus sueños. Por una Colombia transformada por la educación.</p>
        </div>
      </aside>

      <section className="login-panel">
        <div className="login-card" role="main" aria-labelledby="login-title">
          <div className="login-top">
            <img src={logo} alt="Peace & Hope" className="login-logo" />
            <div>
              <h2 id="login-title">Admin Login</h2>
              <div style={{fontSize:'.95rem', color:'rgba(2,6,23,0.6)'}}>Accede con tus credenciales</div>
            </div>
          </div>

          {serverError && <div className="server-error" role="alert">{serverError}</div>}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <span className="input-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" stroke="rgba(2,6,23,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 21v-1c0-2.761-2.239-5-5-5H9c-2.761 0-5 2.239-5 5v1" stroke="rgba(2,6,23,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input
                aria-label="username"
                aria-invalid={!!errors.username}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => handleBlur("username")}
                placeholder="Usuario"
                type="text"
                autoComplete="username"
              />
              {touched.username && errors.username && <div className="field-error">{errors.username}</div>}
            </div>

            <div className="input-group">
              <span className="input-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="rgba(2,6,23,0.6)" strokeWidth="1.5" fill="none"/>
                  <path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="rgba(2,6,23,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <input
                aria-label="password"
                aria-invalid={!!errors.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                placeholder="Contraseña"
                type="password"
                autoComplete="current-password"
              />
              {touched.password && errors.password && <div className="field-error">{errors.password}</div>}
            </div>

            <div className="remember-row">
              <label style={{display:'flex',alignItems:'center',gap:'.5rem'}}><input type="checkbox" /> Remember me</label>
            </div>

            <button type="submit" disabled={!isValid}>Ingresar</button>
          </form>

          <div className="login-footer">
            <div>Peace & Hope for the Children of Colombia</div>
            <div style={{fontWeight:700, color:'rgba(2,6,23,0.75)'}}>v1.0.0</div>
          </div>
        </div>
      </section>
    </div>
  );
}
