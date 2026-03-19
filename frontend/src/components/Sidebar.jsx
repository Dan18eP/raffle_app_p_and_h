import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../Sidebar.css";
import logo from "../assets/logopandh.jpg";

export default function Sidebar() {

  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("session_expired");
    localStorage.removeItem("session_expired_message");
    navigate("/");
  };

    return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {collapsed ? (
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          ) : (
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          )}
        </svg>
      </button>

      <div className="brand">
        <img src={logo} alt="Peace & Hope" className="brand-logo" />
        {!collapsed && <h3 className="brand-title">Peace & Hope</h3>}
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
        >
          <span className="icon" aria-hidden>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
              <path d="M3 12L12 3l9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 10v11h14V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          {!collapsed && <span className="label">Inicio</span>}
        </NavLink>

        <NavLink
          to="/dashboard/raffle"
          className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
        >
          <span className="icon" aria-hidden>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M3 8h3l2-3h8l2 3h3v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </span>
          {!collapsed && <span className="label">Sorteo</span>}
        </NavLink>

        <NavLink
          to="/dashboard/participants"
          className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
        >
          <span className="icon" aria-hidden>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" fill="none"/>
              <path d="M23 20v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </span>
          {!collapsed && <span className="label">Participantes</span>}
        </NavLink>

        <NavLink
          to="/dashboard/artworks"
          className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
        >
          <span className="icon" aria-hidden>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
              <path d="M8 14l2.5-3 3.5 4 2.5-3 2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="9" cy="9" r="1" fill="currentColor"/>
            </svg>
          </span>
          {!collapsed && <span className="label">Obras</span>}
        </NavLink>

        <NavLink
          to="/dashboard/admin"
          className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
        >
          <span className="icon" aria-hidden>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.07a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.3 18.88l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 2 14.6H2a2 2 0 1 1 0-4h.07a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L3.2 6.1A2 2 0 1 1 6 3.33l.06.06a1.65 1.65 0 0 0 1.82.33A1.65 1.65 0 0 0 9.5 3H10a2 2 0 1 1 4 0h.07c.34 0 .67.12.92.35a1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 19.7 6.1l-.06.06a1.65 1.65 0 0 0-.33 1.82c.23.5.6.92 1.07 1.2H22a2 2 0 1 1 0 4h-.07a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
            </svg>
          </span>
          {!collapsed && <span className="label">Admin</span>}
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
          {/* Ícono de logout */}
          <span className="icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </span>
          {!collapsed && <span className="label">Cerrar sesión</span>}
        </button>
        {!collapsed && <span className="sidebar-version">v0.9.0</span>}
      </div>
    </aside>
  );
}