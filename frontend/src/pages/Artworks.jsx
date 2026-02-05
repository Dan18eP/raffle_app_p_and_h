import { useEffect, useState } from "react";
import api from "../services/api";
import "../Artworks.css";

export default function Artworks() {
  const [artworks, setArtworks] = useState([]);
  const [awarded, setAwarded] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", artist: "", image: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

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

    useEffect(() => {
      fetchData();
}, []);

  if (loading) return <div>Loading artworks...</div>;

  //CRUD for artworks 

const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setFormData({ ...formData, image: file });
    setImagePreview(URL.createObjectURL(file));
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  const formDataToSend = new FormData();
  formDataToSend.append("name", formData.name);
  formDataToSend.append("artist", formData.artist);
  if (formData.image) formDataToSend.append("image", formData.image);

  try {
    if (editingId) {
      await api.put(`/artworks/${editingId}`, formDataToSend, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data"
        }
      });
      setSuccess("Updated!");
    } else {
      await api.post("/artworks", formDataToSend, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data"
        }
      });
      setSuccess("Created!");
    }
    
    await fetchData();
    setShowModal(false);
    setFormData({ name: "", artist: "", image: null });
    setImagePreview(null);
    setTimeout(() => setSuccess(null), 2000);
  } catch (err) {
    setError(err?.response?.data?.detail || "Error");
  } finally {
    setLoading(false);
  }
};

const handleDelete = async (id) => {
  if (awarded.has(id)) return alert("Can't delete awarded artwork");
  if (!confirm("Delete this artwork?")) return;
  
  try {
    await api.delete(`/artworks/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    await fetchData();
    setSuccess("Deleted!");
    setTimeout(() => setSuccess(null), 2000);
  } catch (err) {
    setError("Error deleting");
  }
};

const openModal = (artwork = null) => {
  if (artwork) {
    setEditingId(artwork.id);
    setFormData({ name: artwork.name, artist: artwork.artist || "", image: null });
    setImagePreview(artwork.image_url || null);
  } else {
    setEditingId(null);
    setFormData({ name: "", artist: "", image: null });
    setImagePreview(null);
  }
  setShowModal(true);
};


  if (loading && artworks.length === 0) return <div style={{padding:"2rem"}}>Loading...</div>;

return (
  <div className="artworks-container">
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem"}}>
      <h2 style={{margin:0}}>Artworks</h2>
      <button className="btn-add" onClick={() => openModal()}>+ Add</button>
    </div>

    {error && <div className="msg error">{error}</div>}
    {success && <div className="msg success">{success}</div>}

    <div className="artworks-grid">
      {artworks.map((a) => {
        const isAwarded = awarded.has(a.id);
        const showImage = hoveredCard === a.id && a.image_url;
        
        return (
          <article 
            key={a.id} 
            className={"artwork-card" + (isAwarded ? " awarded" : "")}
            onMouseEnter={() => setHoveredCard(a.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {showImage && (
              <div className="img-overlay" style={{ pointerEvents: 'none' }}>
                <img src={`http://127.0.0.1:8000${a.image_url}`} alt={a.name} />
              </div>
            )}
            
            <div className="artwork-body">
              <div className="artwork-title">{a.name}</div>
              <div className="artwork-artist">{a.artist}</div>
            </div>
            
            {isAwarded && <div className="artwork-badge">Awarded</div>}
            
            {!isAwarded && (
              <div className={showImage ? "actions actions-down" : "actions"}>
                <button onClick={(e) => { e.stopPropagation(); openModal(a); }}>✏️</button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}>🗑️</button>
              </div>
)}
          </article>
        );
      })}
    </div>

    {showModal && (
      <div className="modal" onClick={() => setShowModal(false)}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <h3>{editingId ? "Edit" : "New"} Artwork</h3>
          <form onSubmit={handleSubmit}>
            <input
              placeholder="Name *"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <input
              placeholder="Artist"
              value={formData.artist}
              onChange={(e) => setFormData({...formData, artist: e.target.value})}
            />
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {imagePreview && (
              <img 
                src={formData.image ? imagePreview : `http://127.0.0.1:8000${imagePreview}`} 
                className="preview" 
                alt="Preview" 
            />
        )}
            
            <div style={{display:"flex", gap:".5rem", marginTop:"1rem"}}>
              <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">{editingId ? "Update" : "Create"}</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);}