import { useEffect, useState } from "react";
import api from "../services/api";
import "../Artworks.css";

export default function Artworks() {
  const [artworks, setArtworks] = useState([]);
  const [awarded, setAwarded] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [artsRes, awardedRes] = await Promise.all([
          api.get("/artworks"),
          api.get("/raffle/awarded", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
        ]);

        setArtworks(artsRes.data || []);
        setAwarded(new Set(awardedRes.data?.awarded || []));
      } catch (err) {
        console.error("Error fetching artworks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading artworks...</div>;

  return (
    <div className="artworks-container">
      <h2>Artworks</h2>
      <div className="artworks-grid">
        {artworks.map((a) => {
          const isAwarded = awarded.has(a.id);
          return (
            <article key={a.id} className={"artwork-card" + (isAwarded ? " awarded" : "") }>
              <div className="artwork-body">
                <div className="artwork-title">{a.name}</div>
                <div className="artwork-artist">{a.artist}</div>
              </div>
              {isAwarded && <div className="artwork-badge">Awarded</div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}