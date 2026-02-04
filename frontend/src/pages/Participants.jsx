import { useState, useEffect } from "react";
import api from "../services/api";
import "../Participants.css";

export default function Participants() {
  // State variables
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    document_id: "",
    tickets: 0,
    email: ""
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
      setParticipants(res.data);
    } catch (err) {
      console.error("Error loading participants:", err);
      setError("Failed to load participants");
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
      if (editingId) {
        // Update
        await api.put(`/participants/${editingId}`, formData);
        setSuccess("Participant updated successfully");
      } else {
        // Create
        await api.post("/participants", formData);
        setSuccess("Participant created successfully");
      }
      
      // Refresh list
      await fetchParticipants();
      handleCloseModal();
      
      // Clear success message after 3s
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving participant:", err);
      setError(err?.response?.data?.detail || "Error saving participant");
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
      setSuccess("Participant deleted successfully");
      await fetchParticipants();
      
      // Clear success message after 3s
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error deleting participant:", err);
      setError("Error deleting participant");
    } finally {
      setLoading(false);
    }
  };

  // Open modal for creating new participant
  const handleCreate = () => {
    setEditingId(null);
    setFormData({ first_name: "", last_name: "", document_id: "", tickets: 0, email: "" });
    setShowModal(true);
    setError(null);
  };

  // Open modal for editing participant
  const handleEdit = (participant) => {
    setEditingId(participant.id);
    setFormData({
      first_name: participant.first_name,
      last_name: participant.last_name,
      document_id: participant.document_id,
      tickets: participant.tickets || 0,
      email: participant.email || ""
    });
    setShowModal(true);
    setError(null);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ first_name: "", last_name: "", document_id: "", tickets: 0, email: "" });
    setError(null);
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
      
      setSuccess(`Successfully uploaded: ${res.data.created || 0} participants`);
      setUploadFile(null);
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
      
      await fetchParticipants();
      
      // Clean success message after 3s
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error uploading file:", err);
      setError(err?.response?.data?.detail || "Error uploading file");
    } finally {
      setLoading(false);
    }
  };

  // load participants on component mount
  useEffect(() => {
    fetchParticipants();
  }, []);

  return (
    <div className="participants-page">
      <div className="participants-header">
        <div>
          <h1>Participants Management</h1>
          <p className="subtitle">Manage all participants for the raffle event</p>
        </div>
        
        <div className="header-actions">
          <button className="btn primary" onClick={handleCreate} disabled={loading}>
            <span className="btn-icon">+</span> Add Participant
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
          <h3>Bulk Upload</h3>
          <p>Upload participants from CSV or Excel file</p>
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
              {uploadFile ? uploadFile.name : "Choose file..."}
            </label>
          </div>
          <button 
            type="submit" 
            className="btn secondary"
            disabled={!uploadFile || loading}
          >
            {loading ? "Uploading..." : "Upload File"}
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="participants-stats">
        <div className="stat-card">
          <div className="stat-value">{participants.length}</div>
          <div className="stat-label">Total Participants</div>
        </div>
      </div>

      {/* Table */}
      <div className="participants-table-container">
        {loading && participants.length === 0 && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading participants...</p>
          </div>
        )}
        
        {!loading && participants.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No participants yet</h3>
            <p>Add your first participant or upload a file to get started</p>
            <button className="btn primary" onClick={handleCreate}>
              Add First Participant
            </button>
          </div>
        )}
        
        {participants.length > 0 && (
          <table className="participants-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Document ID</th>
                <th>Tickets</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id}>
                  <td className="id-cell">{p.id}</td>
                  <td className="name-cell">{p.first_name}</td>
                  <td className="name-cell">{p.last_name}</td>
                  <td className="document-cell">{p.document_id}</td>
                  <td className="tickets-cell">{p.tickets}</td>
                  <td className="email-cell">{p.email || <span className="empty-value">—</span>}</td>
                  <td className="actions-cell">
                    <button 
                      className="btn-icon edit"
                      onClick={() => handleEdit(p)}
                      disabled={loading}
                      title="Edit participant"
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
                      title="Delete participant"
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
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? "Edit Participant" : "New Participant"}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="first_name">First Name *</label>
                <input
                  id="first_name"
                  type="text"
                  required
                  placeholder="Enter first name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="last_name">Last Name *</label>
                <input
                  id="last_name"
                  type="text"
                  required
                  placeholder="Enter last name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="document_id">Document ID *</label>
                <input
                  id="document_id"
                  type="text"
                  required
                  placeholder="Enter document/ID number"
                  value={formData.document_id}
                  onChange={(e) => setFormData({...formData, document_id: e.target.value})}
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="tickets">Tickets</label>
                <input
                  id="tickets"
                  type="number"
                  min="0"
                  placeholder="Number of tickets"
                  value={formData.tickets}
                  onChange={(e) => setFormData({...formData, tickets: parseInt(e.target.value) || 0})}
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="participant@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={loading}
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn ghost" 
                  onClick={handleCloseModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn primary" 
                  disabled={loading}
                >
                  {loading ? "Saving..." : (editingId ? "Update" : "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}