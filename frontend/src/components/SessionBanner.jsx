import { useEffect, useState } from "react";
import "./SessionBanner.css";

export default function SessionBanner() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const msg = localStorage.getItem("session_expired_message");
    const flag = localStorage.getItem("session_expired");
    if (flag) {
      setMessage(msg || "Your session has expired. Please log in again.");
      setVisible(true);
      // clear the flag so it does not show repeatedly
      // keep message around until dismissed
      localStorage.removeItem("session_expired");
    }
  }, []);

  const close = () => {
    setVisible(false);
    localStorage.removeItem("session_expired_message");
  };

  if (!visible) return null;

  return (
    <div className="session-banner" role="status" aria-live="polite">
      <div className="session-banner-inner">
        <div className="session-icon">🔒</div>
        <div className="session-text">
          <div className="session-title">Session expired</div>
          <div className="session-sub">{message}</div>
        </div>
        <button className="session-close" onClick={close} aria-label="Close">✕</button>
      </div>
    </div>
  );
}
