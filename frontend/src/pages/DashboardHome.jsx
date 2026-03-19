import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../DashboardHome.css";

const StatCard = ({ label, value, loading }) => (
  <div className="stat-card">
    <span className="stat-card__label">{label}</span>
    <span className="stat-card__value">
      {loading ? <span className="stat-card__skeleton" /> : value}
    </span>
  </div>
);

const QuickLink = ({ label, to, icon }) => {
  const navigate = useNavigate();
  return (
    <button className="quick-link" onClick={() => navigate(to)}>
      <span className="quick-link__icon">{icon}</span>
      <span className="quick-link__label">{label}</span>
    </button>
  );
};

export default function DashboardHome() {
  const [stats, setStats] = useState({
    artworks: null,
    participants: null,
    awarded: null,
    available: null,
    admins: null,
  });
  const [lastResult, setLastResult] = useState(undefined); // undefined = cargando, null = sin resultados
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [artworks, participants, awarded, available, admins, last] = await Promise.allSettled([
          api.get("/artworks/count"),
          api.get("/participants/count"),
          api.get("/raffle/awarded"),
          api.get("/raffle/available-count"),
          api.get("/admins/"),
          api.get("/raffle/last-result"),
        ]);

        setStats({
          artworks: artworks.status === "fulfilled" ? artworks.value.data.count : "—",
          participants: participants.status === "fulfilled" ? participants.value.data.count : "—",
          awarded: awarded.status === "fulfilled" ? awarded.value.data.awarded.length : "—",
          available: available.status === "fulfilled" ? available.value.data.count : "—",
          admins: admins.status === "fulfilled" ? admins.value.data.length : "—",
        });

        setLastResult(
          last.status === "fulfilled" ? last.value.data.result : null
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="dashboard-home">
      <h1 className="dashboard-home__title">Panel de control</h1>

      {/* ── ESTADÍSTICAS ── */}
      <section className="dashboard-home__section">
        <h2 className="dashboard-home__section-title">Resumen</h2>
        <div className="stat-grid">
          <StatCard label="Total de obras" value={stats.artworks} loading={loading} />
          <StatCard label="Participantes" value={stats.participants} loading={loading} />
          <StatCard
            label="Obras sorteadas"
            value={
              stats.awarded !== null && stats.artworks !== null
                ? `${stats.awarded} de ${stats.artworks}`
                : "—"
            }
            loading={loading}
          />
          <StatCard label="Obras disponibles" value={stats.available} loading={loading} />
          <StatCard label="Administradores" value={stats.admins} loading={loading} />
        </div>
      </section>

      {/* ── ÚLTIMO RESULTADO ── */}
      <section className="dashboard-home__section">
        <h2 className="dashboard-home__section-title">Último resultado del sorteo</h2>
        {lastResult === undefined || loading ? (
          <div className="last-result last-result--loading">Cargando...</div>
        ) : lastResult === null ? (
          <div className="last-result last-result--empty">
            &nbsp; Aún no se ha realizado ningún sorteo.
          </div>
        ) : (
          <div className="last-result">
            <div className="last-result__row">
              <span className="last-result__key">🏆 Ganador</span>
              <span className="last-result__val">{lastResult.participant}</span>
            </div>
            <div className="last-result__row">
              <span className="last-result__key">🎨 Obra</span>
              <span className="last-result__val">{lastResult.artwork}</span>
            </div>
            <div className="last-result__row">
              <span className="last-result__key">✏️ Artista</span>
              <span className="last-result__val">{lastResult.artist}</span>
            </div>
            <div className="last-result__row">
              <span className="last-result__key">📅 Fecha</span>
              <span className="last-result__val">{lastResult.won_at}</span>
            </div>
          </div>
        )}
      </section>

      {/* ── ACCESOS RÁPIDOS ── */}
      <section className="dashboard-home__section">
        <h2 className="dashboard-home__section-title">Accesos rápidos</h2>
        <div className="quick-links">
          <QuickLink label="Sorteo" to="/dashboard/raffle" icon="🎰" />
          <QuickLink label="Participantes" to="/dashboard/participants" icon="👥" />
          <QuickLink label="Obras" to="/dashboard/artworks" icon="🎨" />
          <QuickLink label="Admins" to="/dashboard/admin" icon="👤" />
        </div>
      </section>
    </div>
  );
}
