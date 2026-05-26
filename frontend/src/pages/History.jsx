import { useState, useEffect } from "react";
import api from "../services/api";
import "../Participants.css"; // Reusing table styles

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/raffle/history/");
      setHistory(res.data);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Error al cargar el historial de sorteos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="participants-page"> {/* Reusing page container */}
      <div className="participants-header">
        <div>
          <h1>Historial de Sorteos</h1>
          <p className="subtitle">Consulta todos los ganadores y obras adjudicadas</p>
        </div>
        <div className="header-actions">
          <button className="btn secondary" onClick={fetchHistory} disabled={loading}>
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>
      </div>

      {error && (
        <div className="message error">
          <span className="message-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="participants-table-container">
        {loading && history.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Obteniendo historial...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <h3>Aún no hay resultados</h3>
            <p>Los resultados aparecerán aquí una vez que se realicen los sorteos.</p>
          </div>
        ) : (
          <table className="participants-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Obra de Arte</th>
                <th>Ganador</th>
                <th>Nro. Boleta</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, idx) => (
                <tr key={item.raffle_id}>
                  <td className="date-cell">
                    {new Date(item.drawn_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
                  </td>
                  <td className="name-cell">
                    <div style={{ fontWeight: 700, color: "var(--primary)" }}>{item.artist}</div>
                    <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>{item.artwork_name}</div>
                  </td>
                  <td className="name-cell">
                    {item.winner_full_name}
                  </td>
                  <td>
                    <span className="ticket-badge-small winner">
                      {item.ticket_number}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
