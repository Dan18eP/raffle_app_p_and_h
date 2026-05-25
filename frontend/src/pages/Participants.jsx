import { useState, useEffect } from "react";
import api from "../services/api";
import "../Participants.css";

export default function Participants() {
  // State variables
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    ticket_numbers: "" // New field for comma-separated tickets
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load participants from server
  const fetchParticipants = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/participants");
      // El backend ahora devuelve participantes con una relación de 'tickets'
      setParticipants(res.data);
    } catch (err) {
      console.error("Error loading participants:", err);
      setError("Error al cargar los participantes");
    } finally {
      setLoading(false);
    }
  };

  // Create or update participant
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      let participantId = editingId;
      if (editingId) {
        // Update name
        await api.put(`/participants/${editingId}`, { full_name: formData.full_name });
      } else {
        // Create new participant
        const res = await api.post("/participants", { full_name: formData.full_name });
        participantId = res.data.id;
      }

      // Handle new tickets if any
      const newTicketNumbers = formData.ticket_numbers
        .split(",")
        .map(n => n.trim())
        .filter(n => n !== "");

      if (newTicketNumbers.length > 0) {
        try {
          await api.post("/tickets/bulk", {
            participant_id: participantId,
            ticket_numbers: newTicketNumbers
          });
        } catch (tErr) {
          console.error("Error saving tickets:", tErr);
          // Extract specific error details if available
          const detail = tErr?.response?.data?.detail;
          // If it's a list of existing tickets, it will be in the detail string
          setError(`Participante guardado, pero error en boletas: ${detail || "Error desconocido"}`);
          // Re-fetch participants but DO NOT close the modal so user can fix the tickets
          await fetchParticipants();
          setLoading(false);
          return;
        }
      }
      
      setSuccess(editingId ? "Participante actualizado" : "Participante y boletas creados con éxito");
      
      // Refresh list
      await fetchParticipants();
      handleCloseModal();
      
      // Clear success message after 3s
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving participant:", err);
      setError(err?.response?.data?.detail || "Error al guardar participante");
    } finally {
      setLoading(false);
    }
  };

  // delete participant
  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este participante?")) return;
    
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/participants/${id}`);
      setSuccess("Participante eliminado");
      await fetchParticipants();
      
      // Clear success message after 3s
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error deleting participant:", err);
      setError("Error al eliminar participante");
    } finally {
      setLoading(false);
    }
  };

  // Open modal for creating new participant
  const handleCreate = () => {
    setEditingId(null);
    setFormData({ full_name: "", ticket_numbers: "", current_tickets: [] });
    setShowModal(true);
    setError(null);
  };

  // Open modal for editing participant
  const handleEdit = (participant) => {
    setEditingId(participant.id);
    setFormData({
      full_name: participant.full_name,
      ticket_numbers: "", // Always start empty for new tickets
      current_tickets: participant.tickets || [] // Store existing tickets for display
    });
    setShowModal(true);
    setError(null);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ full_name: "", ticket_numbers: "" });
    setError(null);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleToggleTicket = async (ticketId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.patch(`/tickets/${ticketId}/toggle-status`);
      // Update local state for current tickets in modal
      setFormData(prev => ({
        ...prev,
        current_tickets: prev.current_tickets.map(t => 
          t.id === ticketId ? res.data : t
        )
      }));
      // Update main participants list
      await fetchParticipants();
    } catch (err) {
      console.error("Error toggling ticket:", err);
      setError(err?.response?.data?.detail || "Error al cambiar estado de boleta");
    } finally {
      setLoading(false);
    }
  };

  // Upload file
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    
    const formDataUpload = new FormData();
    formDataUpload.append("file", uploadFile);
    
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/participants/upload", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const summary = `Procesado con éxito: ${res.data.participants_created || 0} nuevos, ${res.data.participants_reused || 0} fusionados. ${res.data.tickets_created || 0} boletas añadidas.`;
      setSuccess(summary);
      setUploadFile(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
      
      await fetchParticipants();
      
      // Clean success message after 5s
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Error uploading file:", err);
      setError(err?.response?.data?.detail || "Error al subir el archivo");
    } finally {
      setLoading(false);
    }
  };

    // Filter participants based on search query
  const filtered = participants.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q)
    );
  });

  // Paginate filtered results
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // load participants on component mount
  useEffect(() => {
    fetchParticipants();
  }, []);

  return (
    <div className="participants-page">
      <div className="participants-header">
        <div>
          <h1>Gestión de participantes</h1>
          <p className="subtitle">Gestiona todos los participantes del sorteo</p>
        </div>
        
        <div className="header-actions">
          <button className="btn primary" onClick={handleCreate} disabled={loading}>
            <span className="btn-icon">+</span> Añadir Participante
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="message error">
          <span className="message-icon">⚠️</span>
          {error}
          <button className="message-close" onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {success && (
        <div className="message success">
          <span className="message-icon">✓</span>
          {success}
          <button className="message-close" onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Upload Section */}
      <div className="upload-section">
        <div className="upload-header">
          <h3>Carga Masiva</h3>
          <p>Sube participantes desde un archivo CSV o Excel. El sistema fusionará nombres repetidos y agregará sus boletas.</p>
        </div>
        <form onSubmit={handleFileUpload} className="upload-form">
          <div className="file-input-wrapper">
            <input
              type="file"
              id="file-upload"
              accept=".csv,.xls,.xlsx"
              onChange={(e) => setUploadFile(e.target.files[0])}
              disabled={loading}
            />
            <label htmlFor="file-upload" className="file-input-label">
              {uploadFile ? uploadFile.name : "Elegir archivo..."}
            </label>
          </div>
          <button 
            type="submit" 
            className="btn secondary"
            disabled={!uploadFile || loading}
          >
            {loading ? "Subiendo..." : "Subir Archivo"}
          </button>
        </form>
      </div>

      {/* Stats + Search */}
      <div className="participants-toolbar">
        <div className="stat-card">
          <div className="stat-value">{participants.length}</div>
          <div className="stat-label">Total Participantes</div>
        </div>

        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={handleSearchChange}
          />
          {search && (
            <button className="search-clear" onClick={() => { setSearch(""); setCurrentPage(1); }}>✕</button>
          )}
        </div>
      </div>


      {/* Table */}
      <div className="participants-table-container">
        {loading && participants.length === 0 && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando participantes...</p>
          </div>
        )}
        
        {!loading && participants.length === 0 && (

          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Aún no hay participantes</h3>
            <p>Añade tu primer participante o sube un archivo para comenzar</p>
            <button className="btn primary" onClick={handleCreate}>
              Añadir primer participante
            </button>
          </div>
        )}

        {!loading && participants.length > 0 && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>Sin resultados</h3>
            <p>No se encontraron participantes con "{search}"</p>
            <button className="btn ghost" onClick={() => { setSearch(""); setCurrentPage(1); }}>Limpiar búsqueda</button>
          </div>
        )}
        
        {participants.length > 0 && filtered.length > 0 && (
          <>
            <table className="participants-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Completo</th>
                  <th>Boletas</th>
                  <th>Fecha Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
            <tbody>
              {paginated.map((p) => (
                <tr key={p.id}>
                  <td className="id-cell">{p.id}</td>
                  <td className="name-cell">{p.full_name}</td>
                  <td className="tickets-cell-table">
                    <div className="table-tickets-container">
                      {p.tickets && p.tickets.length > 0 ? (
                        p.tickets.slice(0, 5).map(t => (
                          <span key={t.id} className={`ticket-badge-small ${t.status}`}>
                            {t.ticket_number}
                          </span>
                        ))
                      ) : (
                        <span className="no-tickets">Sin boletas</span>
                      )}
                      {p.tickets && p.tickets.length > 5 && (
                        <span className="more-tickets">+{p.tickets.length - 5}</span>
                      )}
                    </div>
                  </td>
                  <td className="date-cell">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button 
                      className="btn-icon edit"
                      onClick={() => handleEdit(p)}
                      disabled={loading}
                      title="Editar participante"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button 
                      className="btn-icon delete"
                      onClick={() => handleDelete(p.id)}
                      disabled={loading}
                      title="Eliminar participante"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                ← Anterior
              </button>

              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        className={`pagination-btn${currentPage === p ? " active" : ""}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>

              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "Editar Participante" : "Nuevo Participante"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="full_name">Nombre Completo *</label>
                <input
                  id="full_name"
                  type="text"
                  required
                  placeholder="Ingrese nombre y apellido"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  disabled={loading}
                />
              </div>

              {/* Current Tickets (only in edit mode) */}
              {editingId && formData.current_tickets && formData.current_tickets.length > 0 && (
                <div className="form-group">
                  <label>Boletas actuales (clic para habilitar/deshabilitar):</label>
                  <div className="current-tickets-list">
                    {formData.current_tickets.map(t => (
                      <button 
                        key={t.id} 
                        type="button"
                        className={`ticket-badge ${t.status}`}
                        onClick={() => t.status !== 'winner' && handleToggleTicket(t.id)}
                        disabled={loading || t.status === 'winner'}
                        title={t.status === 'winner' ? "Ganadora (bloqueada)" : (t.status === 'eligible' ? "Deshabilitar participación" : "Habilitar participación")}
                        style={{ cursor: t.status === 'winner' ? 'not-allowed' : 'pointer', border: 'none' }}
                      >
                        {t.ticket_number}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="ticket_numbers">
                  {editingId ? "Añadir más boletas" : "Boletas iniciales"} (separadas por coma)
                </label>
                <input
                  id="ticket_numbers"
                  type="text"
                  placeholder="Ej: 101, 102, 103"
                  value={formData.ticket_numbers}
                  onChange={(e) => setFormData({...formData, ticket_numbers: e.target.value})}
                  disabled={loading}
                />
                <p className="field-hint">Ingrese números únicos para este participante.</p>
              </div>

              {/* Error message inside modal for tickets duplicates */}
              {error && error.includes("boletas") && (
                <div className="modal-error-message">
                  {error}
                </div>
              )}
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn ghost" 
                  onClick={handleCloseModal}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn primary" 
                  disabled={loading}
                >
                  {loading ? "Guardando..." : (editingId ? "Actualizar" : "Crear")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
