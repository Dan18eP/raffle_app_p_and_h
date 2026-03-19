import { useEffect, useState } from "react";
import api from "../services/api";
import "../Artworks.css";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const parseError = (err) => {
  const detail = err.response?.data?.detail;
  if (!detail) return "Error inesperado.";
  if (Array.isArray(detail)) return detail.map((d) => `${d.loc?.at(-1)}: ${d.msg}`).join(" | ");
  return detail;
};

export default function Artworks() {
  const [artworks, setArtworks] = useState([]);
  const [awarded, setAwarded] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [detailArtwork, setDetailArtwork] = useState(null);
  const [formData, setFormData] = useState({ name: "", artist: "", image: null, remove_image: false });
  const [editingId, setEditingId] = useState(null);
  const [editingArtwork, setEditingArtwork] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

const fetchData = async () => {
      setLoading(true);
      try {
        const [artsRes, awardedRes] = await Promise.all([
          api.get("/artworks"),
          api.get("/raffle/awarded"),
        ]);

        setArtworks(artsRes.data || []);
        setAwarded(new Set(awardedRes.data?.awarded || []));
      } catch (err) {
        console.error("Error fetching artworks:", err);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchData();
}, []);



  //CRUD for artworks 

const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setFormData({ ...formData, image: file, remove_image: false });
    setImagePreview(URL.createObjectURL(file));
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  const fd = new FormData();
  fd.append("name", formData.name);
  fd.append("artist", formData.artist);
  if (formData.image) fd.append("image", formData.image);
  if (editingId) fd.append("remove_image", formData.remove_image);

  try {
    if (editingId) {
      await api.put(`/artworks/${editingId}`, fd);
      setSuccess("Obra actualizada.");
    } else {
      await api.post("/artworks", fd);
      setSuccess("Obra creada.");
    }
    await fetchData();
    closeEditModal();
    setTimeout(() => setSuccess(null), 3000);
  } catch (err) {
    setError(parseError(err));
  } finally {
    setLoading(false);
  }
};


const handleDelete = async (id) => {
  if (awarded.has(id)) {
    setError("No puedes eliminar una obra ya sorteada.");
    return;
  }
  if (!confirm("¿Eliminar esta obra?")) return;
  try {
    await api.delete(`/artworks/${id}`);
    setDetailArtwork(null);
    await fetchData();
    setSuccess("Obra eliminada.");
    setTimeout(() => setSuccess(null), 3000);
  } catch (err) {
    setError(parseError(err));
  }
};



const openEditModal = (artwork = null) => {
  if (artwork) {
    setEditingArtwork(artwork); 
    setEditingId(artwork.id);
    setFormData({ name: artwork.name, artist: artwork.artist || "", image: null, remove_image: false });
    setImagePreview(artwork.image_url ? `${BASE_URL}${artwork.image_url}` : null);
  } else {
    setEditingArtwork(null); 
    setEditingId(null);
    setFormData({ name: "", artist: "", image: null, remove_image: false });
    setImagePreview(null);
  }
  
  setShowEditModal(true);
  setDetailArtwork(null);
};

const closeEditModal = () => {
  setShowEditModal(false);
  setEditingId(null);
  setEditingArtwork(null); 
  setFormData({ name: "", artist: "", image: null, remove_image: false });
  setImagePreview(null);
  setError(null);
};

  if (loading && artworks.length === 0) return <div style={{padding:"2rem"}}>Loading...</div>;

  console.log("editingArtwork:", editingArtwork, "editingId:", editingId);

return (
  <div className="artworks-container">
    <div className="artworks-header">
      <h1>Obras de Arte</h1>
      <button className="btn-add" onClick={() => openEditModal()}>+ Agregar</button>
    </div>

    {error && <div className="msg msg--error">{error}</div>}
    {success && <div className="msg msg--success">{success}</div>}

    {/* ── GRID ── */}
    <div className="artworks-grid">
      {artworks.map((a) => {
        const isAwarded = awarded.has(a.id);
        return (
          <article
            key={a.id}
            className={`artwork-card${isAwarded ? " awarded" : ""}`}
            onClick={() => setDetailArtwork(a)}
          >
            {a.image_url ? (
              <div className="artwork-thumb">
                <img src={`${BASE_URL}${a.image_url}`} alt={a.name} />
              </div>
            ) : (
              <div className="artwork-thumb-placeholder" />
            )}

            <div className="artwork-body">
              <div className="artwork-title">{a.name}</div>
              <div className="artwork-artist">{a.artist}</div>
            </div>
            {isAwarded && <div className="artwork-badge">Sorteada</div>}
          </article>
        );
      })}
    </div>

    {/* ── DETAIL MODAL ── */}
    {detailArtwork && (
      <div className="modal" onClick={() => setDetailArtwork(null)}>
        <div className="modal-box modal-box--detail" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setDetailArtwork(null)}>✕</button>

          {detailArtwork.image_url ? (
            <img src={`${BASE_URL}${detailArtwork.image_url}`} className="detail-image" alt={detailArtwork.name} />
          ) : (
            <div className="detail-no-image">Sin imagen</div>
          )}

          <div className="detail-info">
            <h2 className="detail-title">{detailArtwork.name}</h2>
            <p className="detail-artist">{detailArtwork.artist}</p>
            {awarded.has(detailArtwork.id) && (
              <span className="artwork-badge artwork-badge--detail">Sorteada</span>
            )}
          </div>

          {!awarded.has(detailArtwork.id) && (
            <div className="detail-actions">
              <button className="btn-edit" onClick={() => openEditModal(detailArtwork)}>✏️ Editar</button>
              <button className="btn-delete" onClick={() => handleDelete(detailArtwork.id)}>🗑️ Eliminar</button>
            </div>
          )}
        </div>
      </div>
    )}

    {/* ── EDIT / CREATE MODE ── */}
    {showEditModal && (
      <div className="modal" onClick={closeEditModal}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={closeEditModal}>✕</button>
          <h3>{editingId ? "Editar obra" : "Nueva obra"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre *</label>
              <input
                placeholder="Nombre de la obra"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Artista</label>
              <input
                placeholder="Nombre del artista"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>{editingId ? "Reemplazar imagen" : "Imagen"}</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </div>


            {imagePreview && !formData.remove_image && (
              <img src={imagePreview} className="preview" alt="Preview" />
            )}

            {/* Only when editing an existing image and no new image has been selected */}
            {editingId && editingArtwork?.image_url && !formData.image && (
              <div className="form-group form-group--checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.remove_image}
                    onChange={(e) => {
                      setFormData({ ...formData, remove_image: e.target.checked });
                      if (e.target.checked) setImagePreview(null);
                      else setImagePreview(`${BASE_URL}${editingArtwork.image_url}`);
                    }}
                  />
                  {" "}Eliminar imagen actual
                </label>
              </div>
            )}

            {error && <p className="msg msg--error">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={closeEditModal}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);}
