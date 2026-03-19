import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import "../Raffle.css";
import victoryAudio from "../assets/mision_imposible.mp3";
import applauseAudio from "../assets/aplausos.mp3";

export default function Raffle() {
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
  
  ;

  useEffect(() => {
    // fetch counts
    const fetchCounts = async () => {
      try {
        const [availableRes, parts] = await Promise.all([
          api.get("/raffle/available-count"),
          api.get("/participants"),
        ]);
        setArtworksCount(availableRes.data.count);
        setParticipantsCount(parts.data.length);
      } catch (err) {
        // ignore
      }
    };
    fetchCounts();
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

  const clearRaffleState = () => {
    try {
      localStorage.removeItem("raffle_preview");
      localStorage.removeItem("raffle_winner");
      localStorage.removeItem("raffle_history");
    } catch (err) {
      // ignore
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
    refreshArtworksCount();
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
      // Refresh artworks count
      await refreshArtworksCount();
    } catch (err) {
      const message = err?.response?.data?.detail || "No artworks available";
      setPreview({ artwork: message });
      setServerError(message);
      console.error("Preview error:", err);
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

    // prevent double calls
    if (revealing) return;

    // require a preview with an id so we reveal the exact artwork shown
    revealCalledRef.current = false;

    if (!preview?.id) {
      setServerError("Please preview an artwork before revealing the winner.");
      return;

    }

    // validate that the artwork is still valid (not already assigned)
    try {
      const isValid = await validateArtwork(preview.id);
      if (!isValid) {
        setServerError("This artwork has already been assigned.");
        return;
      }
    } catch {
      setServerError("Unable to validate artwork.");
      return;
    }

    // Start reveal sequence: play audio + countdown, then call API
    setServerError(null);
    setWinner(null);
    setRevealing(true);


    try {
      // try to use audio duration if available (limit to 15s), otherwise default 15
      const duration = audioRef.current?.duration;
      const start = Number.isFinite(duration) && duration > 0 ? Math.min(15, Math.ceil(duration)) : 15;
      setCountdown(start);

      // play audio
      if (audioRef.current) {
        try {
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
                  const message = res?.data?.detail || "No winner returned";
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
                const message = err?.response?.data?.detail || "Error running raffle";
                setWinner({ error: message });
                setServerError(message + (err?.response?.status ? ` (status ${err.response.status})` : ""));
                console.error("Reveal error:", err);
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
      console.error("Error during reveal start:", err);
      setServerError("Failed to start reveal");
      setRevealing(false);
      setCountdown(null);
    }
  };

  const runTest = async () => {
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
      // show error in preview
      const message = err?.response?.data?.detail || "Test failed";
      setPreview({ artwork: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="raffle-page">
      <main className="raffle-main">
        <div className="raffle-hero">
          <h1 style={{ margin: 0, color: "#004f9e"}}>Raffle — Draw Artworks</h1>
          <p style={{ margin: 0, color: "rgba(2,6,23,0.65)" }}>Generate the next artwork to present, then reveal the winner. Use the test run to simulate the whole raffle.</p>

          <div className="stats">
            <div className="stat">
              <strong>{artworksCount}</strong>
              <div style={{ color: "rgba(2,6,23,0.6)" }}>Artworks</div>
            </div>
            <div className="stat">
              <strong>{participantsCount}</strong>
              <div style={{ color: "rgba(2,6,23,0.6)" }}>Participants</div>
            </div>
          </div>

          <div className="controls">
            <button className="btn secondary" onClick={previewNext} disabled={loading || revealing}>Preview next artwork</button>
            <button className="btn primary" onClick={revealWinner} disabled={loading || !preview?.id || revealing}>{revealing ? "Revealing..." : "Reveal winner"}
  
            </button>
            <button className="btn ghost" onClick={runTest} disabled={loading || revealing}>Test run</button>
          </div>

          <div className="preview">
            <h3>Preview</h3>
            <p>{preview ? preview.artwork : "Press \"Preview next artwork\" to start"}</p>

            {revealing && countdown !== null && (
              <div className="reveal-countdown" style={{ marginTop: ".6rem", fontSize: "1.25rem", fontWeight: 800 }}>
                🔊 Reveal in: <span style={{ marginLeft: ".4rem" }}>{countdown}s</span>
              </div>
            )}

            {serverError && <div style={{ marginTop: ".5rem", color: "#bf2b2b" }}>{serverError}</div>}
          </div>

          {winner && (
            <div className="result-card">
              {winner.error ? (
                <div style={{ color: "#bf2b2b", fontWeight:700 }}>{winner.error}</div>
              ) : (
                <>
                  <div style={{ fontWeight: 800 }}>{winner.artwork}</div>
                  <div style={{ marginTop: ".5rem" }}>Winner: <strong>{winner.winner}</strong></div>
                </>
              )}
            </div>
          )}

          {history && history.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <h3 style={{ marginBottom: ".5rem" }}>History</h3>
              {history.slice(0,6).map((h, i) => (
                <div key={i} style={{ padding: ".4rem 0", borderBottom: "1px solid rgba(2,6,23,0.04)" }}>
                  <div style={{fontWeight:700}}>{h.artwork}</div>
                  <div style={{ color: "rgba(2,6,23,0.6)" }}>{h.winner}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <aside className="sidebar-panel">
        <h3 style={{ marginTop: 0 }}>Raffle Control</h3>
        <p style={{ color: "rgba(2,6,23,0.6)" }}>Use the controls to pick and reveal. The test run executes the raffle for all artworks.</p>

        <div style={{ marginTop: "1rem" }}>
          <button className="btn primary" onClick={() => { previewNext(); }} style={{ width: "100%" }} disabled={loading}>Generate artwork</button>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <button className="btn secondary" onClick={() => { runTest(); }} style={{ width: "100%" }} disabled={loading}>Run test (all)</button>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <button className="btn ghost" onClick={clearRaffleState}>Clear</button>
        </div>
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
            <div className="reveal-caption">Revealing winner…</div>
          </div>
        </div>
      )}
    </div>
  );
}
