import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import "../Raffle.css";
import victoryAudio from "../assets/mision_imposible.mp3";
import applauseAudio from "../assets/aplausos.mp3";

export default function Raffle() {
  const [isProductionMode, setIsProductionMode] = useState(() => {
    try {
      const saved = localStorage.getItem("raffle_mode");
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleModeChange = (e) => {
      setIsProductionMode(e.detail);
    };
    window.addEventListener("raffle_mode_change", handleModeChange);
    return () => window.removeEventListener("raffle_mode_change", handleModeChange);
  }, []);

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null); // {id, artwork}
  const [winner, setWinner] = useState(null);
  const [history, setHistory] = useState([]);
  const [artworksCount, setArtworksCount] = useState(0);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Reveal/audio state
  const [countdown, setCountdown] = useState(null); // seconds remaining
  const [revealing, setRevealing] = useState(false);
  const audioRef = useRef(null);
  const applauseRef = useRef(null); // for applause audio
  const intervalRef = useRef(null);

  // Play a short synthesized applause (fallback if no applause file). Uses WebAudio API and schedules a few noise bursts.
  const playApplause = () => {
    if (!applauseRef.current) return;

    const audio = applauseRef.current;

    audio.currentTime = 0;
    audio.play();

    // disable after 3s
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 3000);
  };
   
  // Function to refresh artworks count from server
  const refreshArtworksCount = async () => {
    try {
      const res = await api.get("/raffle/available-count");
      setArtworksCount(res.data.count);
    } catch (err) {
      console.warn("Failed to refresh artworks count:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get("/raffle/history");
      setHistory(res.data);
    } catch (err) {
      console.warn("Failed to fetch history:", err);
    }
  };

  useEffect(() => {
    // fetch counts
    const fetchData = async () => {
      try {
        const [availableRes, parts] = await Promise.all([
          api.get("/raffle/available-count"),
          api.get("/participants"),
        ]);
        setArtworksCount(availableRes.data.count);
        setParticipantsCount(parts.data.length);
        await fetchHistory();
      } catch (err) {
        // ignore
      }
    };
    fetchData();
  }, []);

  // Rehydrate raffle UI state from localStorage so preview/winner/history survive reloads
  useEffect(() => {
    try {
      const p = localStorage.getItem("raffle_preview");
      const w = localStorage.getItem("raffle_winner");
      const h = localStorage.getItem("raffle_history");
      if (p) setPreview(JSON.parse(p));
      if (w) setWinner(JSON.parse(w));
      if (h) setHistory(JSON.parse(h));
    } catch (err) {
      // ignore parse errors
      console.warn("Failed to rehydrate raffle state:", err);
    }
  }, []);

  // Setup audio element
  useEffect(() => {
    audioRef.current = new Audio(victoryAudio);
    if (audioRef.current) audioRef.current.preload = "auto";

    return () => {
      // cleanup audio and any running timer
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      } catch (err) {
        /* ignore */
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Persist preview
  useEffect(() => {
    try {
      if (preview) localStorage.setItem("raffle_preview", JSON.stringify(preview));
      else localStorage.removeItem("raffle_preview");
    } catch (err) {
      // ignore
    }
  }, [preview]);

  // Persist winner
  useEffect(() => {
    try {
      if (winner) localStorage.setItem("raffle_winner", JSON.stringify(winner));
      else localStorage.removeItem("raffle_winner");
    } catch (err) {
      // ignore
    }
  }, [winner]);

  // Persist history
  useEffect(() => {
    try {
      if (history && history.length > 0) localStorage.setItem("raffle_history", JSON.stringify(history));
      else localStorage.removeItem("raffle_history");
    } catch (err) {
      // ignore
    }
  }, [history]);

  const clearRaffleState = async () => {
    if (!confirm("¿Estás seguro de que deseas limpiar el estado del sorteo? Esto borrará el ganador actual y el historial visible en esta sesión.")) return;
    
    setLoading(true);
    try {
      // 1. Resetear el servidor (base de datos)
      await api.post("/raffle/reset", null, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      // 2. Limpiar local storage
      localStorage.removeItem("raffle_preview");
      localStorage.removeItem("raffle_winner");
      localStorage.removeItem("raffle_history");
    } catch (err) {
      console.error("Error al resetear sorteo:", err);
      setServerError("Error al intentar resetear el sorteo en el servidor");
    }

    // stop any audio and timer
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch (err) {
      // ignore
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setCountdown(null);
    setRevealing(false);
    setPreview(null);
    setWinner(null);
    setHistory([]);
    setServerError(null);

    // refresh artworks count
    await refreshArtworksCount();
    setLoading(false);
  };

  const previewNext = async () => {
    setLoading(true);
    setPreview(null);
    setWinner(null);
    setServerError(null);

    try {
      const res = await api.get("/raffle/next", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setPreview(res.data);
      // Actualizar contador de obras
      await refreshArtworksCount();
    } catch (err) {
      const message = err?.response?.data?.detail || "No hay obras disponibles";
      setServerError(message);
      console.error("Error en previsualización:", err);
    } finally {
      setLoading(false);
    }
  };

  const validateArtwork = async (artworkId) => {
      const res = await api.get(`/raffle/validate/${artworkId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return res.data.valid;
    };

  const revealCalledRef = useRef(false);

  const revealWinner = async () => {

    // evitar llamadas dobles
    if (revealing) return;

    revealCalledRef.current = false;

    if (!preview?.id) {
      setServerError("Por favor, previsualice una obra antes de revelar al ganador.");
      return;
    }

    // validar que la obra siga disponible
    try {
      const isValid = await validateArtwork(preview.id);
      if (!isValid) {
        setServerError("Esta obra ya ha sido asignada.");
        return;
      }
    } catch {
      setServerError("No se pudo validar la obra.");
      return;
    }

    // Iniciar secuencia: audio + cuenta regresiva, luego llamar a la API
    setServerError(null);
    setWinner(null);
    setRevealing(true);


    try {
      // Contador fijado en 10s para mejor ritmo en vivo
      const start = 5;
      setCountdown(start);

      // reproducir audio
      if (audioRef.current) {
        try {
          audioRef.current.playbackRate = 1.35; // Acelerar un poco para aumentar tensión
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
        } catch (err) {
          // autoplay might be blocked; still run countdown
          console.warn("Audio play failed:", err);
        }
      }

      // start timer
      intervalRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c === null) return c;
          if (c <= 1) {
            // end countdown
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }

            // stop audio
            try {
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
              }
            } catch (err) {
              // ignore
            }


            // HARD LOCK: prevent double execution
            if (revealCalledRef.current) return null;
            revealCalledRef.current = true;


            // call API to reveal winner
            (async () => {
              setLoading(true);
              try {
                const body = { artwork_id: preview.id };
                const res = await api.post("/raffle/run", body, {
                  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });

                if (!res?.data || res.data?.detail) {
                  const message = res?.data?.detail || "No se obtuvo un ganador";
                  setServerError(message);
                  setWinner({ error: message });
                } else {
                  setWinner(res.data);

                  //avoid duplicates in history
                  setHistory((h) => {
                    const exists = h.some(
                      (item) =>
                        item.artwork === res.data.artwork &&
                        item.winner === res.data.winner
                    );

                    if (exists) return h;

                    return [res.data, ...h];
                  });

                  // confetti
                  setShowConfetti(true);
                  setTimeout(() => setShowConfetti(false), 2600);

                  // immediate applause 
                  playApplause();
                  // Refresh artworks count from server
                  await refreshArtworksCount();
                }
              } catch (err) {
                const message = err?.response?.data?.detail || "Error al ejecutar el sorteo";
                setWinner({ error: message });
                setServerError(message + (err?.response?.status ? ` (estado ${err.response.status})` : ""));
                console.error("Error en revelación:", err);
              } finally {
                setLoading(false);
                setCountdown(null);
                setRevealing(false);
              }
            })();

            return null;
          }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error al iniciar la revelación:", err);
      setServerError("Fallo al iniciar la revelación");
      setRevealing(false);
      setCountdown(null);
    }
  };

  const runTest = async () => {
    if (!confirm("¿Estás seguro de ejecutar el simulacro completo? Esto asignará ganadores a todas las obras disponibles automáticamente.")) return;

    setLoading(true);
    try {
      const res = await api.post("/raffle/test", null, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      // show small summary
      setHistory(res.data.results || []);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2600);

      // refresh artworks count
      refreshArtworksCount();

    } catch (err) {
      const message = err?.response?.data?.detail || "Error en el simulacro";
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="raffle-page">
      <main className="raffle-main">
        <div className="raffle-hero">
          <h1 style={{ margin: 0, color: "#004f9e"}}>Sorteo — Arte para Educar 2026</h1>
          <p style={{ margin: 0, color: "rgba(2,6,23,0.65)" }}>Genera la siguiente obra a presentar, luego revela al ganador.</p>

          <div className="stats">
            <div className="stat">
              <strong>{artworksCount}</strong>
              <div style={{ color: "rgba(2,6,23,0.6)" }}>Obras</div>
            </div>
            <div className="stat">
              <strong>{participantsCount}</strong>
              <div style={{ color: "rgba(2,6,23,0.6)" }}>Participantes</div>
            </div>
          </div>

          <div className="controls">
            <button className="btn secondary" onClick={previewNext} disabled={loading || revealing}>Siguiente obra</button>
            <button className="btn primary" onClick={revealWinner} disabled={loading || !preview?.id || revealing}>{revealing ? "Revelando..." : "Revelar ganador"}
  
            </button>
            {!isProductionMode && (
              <button className="btn ghost" onClick={runTest} disabled={loading || revealing}>Simulacro</button>
            )}
          </div>

          <div className="preview">
            <h3>Sorteo {history.length + 1}</h3>
            {preview ? (
              <div style={{ textAlign: "center" }}>
                {preview.artist && (
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary)" }}>
                    {preview.artist}
                  </div>
                )}
                <div style={{ fontSize: "1.1rem", opacity: 0.7, marginTop: preview.artist ? "0.2rem" : "0" }}>
                  {preview.artwork || preview.name}
                </div>
              </div>
            ) : (
              <p>Presiona "Siguiente obra" para comenzar</p>
            )}

            {revealing && countdown !== null && (
              <div className="reveal-countdown" style={{ marginTop: ".6rem", fontSize: "1.25rem", fontWeight: 800 }}>
                🔊 Revelación en: <span style={{ marginLeft: ".4rem" }}>{countdown}s</span>
              </div>
            )}

            {serverError && <div style={{ marginTop: ".5rem", color: "#bf2b2b" }}>{serverError}</div>}
          </div>

          {winner && (
            <div className="winner-modal-overlay">
              <div className="winner-modal-content">
                {winner.error ? (
                  <div style={{ padding: "1rem" }}>
                    <div style={{ color: "#bf2b2b", fontWeight: 700, marginBottom: "1.5rem" }}>{winner.error}</div>
                    <button className="btn ghost" onClick={() => setWinner(null)} style={{ width: "100%" }}>
                      Cerrar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="winner-modal-label">¡Tenemos un ganador!</div>
                    <div className="winner-ticket-number">{winner.ticket_number}</div>
                    <div className="winner-name">{winner.winner}</div>
                    <div className="winner-artwork-title">
                       <div style={{ color: "var(--primary)", fontWeight: 800, fontSize: "1.2rem" }}>
                         {winner.artist}
                       </div>
                       <div style={{ opacity: 0.6, fontSize: "1rem", marginTop: "0.2rem" }}>
                         {winner.artwork}
                       </div>
                    </div>
                    <button className="btn primary" onClick={() => { setWinner(null); setPreview(null); }} style={{ width: "100%", padding: "1rem" }}>
                      Continuar Sorteo
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {history && history.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <h3 style={{ marginBottom: ".5rem" }}>Historial de Sorteos</h3>
              {history.map((h, i) => (
                <div key={i} style={{ padding: ".6rem 0", borderBottom: "1px solid rgba(2,6,23,0.04)" }}>
                  <div style={{fontWeight:700}}>
                    Sorteo {history.length - i} — {h.artist} — {h.artwork_name}
                  </div>
                  <div style={{ color: "rgba(2,6,23,0.6)", fontSize: "0.9rem" }}>
                    Ganador: <strong>{h.winner_full_name}</strong> (Boleta: {h.ticket_number})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <aside className="sidebar-panel">
        <h3 style={{ marginTop: 0 }}>Obra a sortear</h3>
        
        <div className="raffle-image-container" style={{ 
          background: "rgba(0,0,0,0.03)", 
          borderRadius: "12px", 
          minHeight: "240px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.05)",
          marginBottom: "1.5rem"
        }}>
          {preview?.image_url ? (
            <img src={preview.image_url} alt="Obra" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <span style={{ color: "rgba(0,0,0,0.2)", fontWeight: 600 }}>Esperando obra...</span>
          )}
        </div>

        {!isProductionMode && (
          <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <button className="btn secondary" onClick={runTest} style={{ width: "100%", marginBottom: "0.5rem" }} disabled={loading}>Ejecutar simulacro (todo)</button>
            <button className="btn ghost" onClick={clearRaffleState} style={{ width: "100%" }}>Limpiar / Reset</button>
          </div>
        )}
      </aside>

      {showConfetti && (
        <div className="confetti" aria-hidden>
          {Array.from({ length: 28 }).map((_, i) => {
            const left = Math.random() * 100;
            const bg = ["#ffd24a", "#ff6b6b", "#6be4ff", "#7bf29d"][Math.floor(Math.random() * 4)];
            const delay = Math.random() * 0.6;
            const style = { left: `${left}%`, background: bg, top: `-10%`, animationDelay: `${delay}s` };
            return <span key={i} className="confetti-piece" style={style} />;
          })}
        </div>
      )}

      <audio
        ref={applauseRef}
        src={applauseAudio}
        preload="auto"
      />


      {/* Centered popup for large countdown during reveal */}
      {revealing && countdown !== null && (
        <div className="reveal-modal" role="dialog" aria-live="polite">
          <div className="reveal-popup">
            <div className="reveal-countdown-large">{countdown}</div>
            <div className="reveal-caption">Revelando ganador…</div>
          </div>
        </div>
      )}
    </div>
  );
}
