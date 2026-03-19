import { useState, useEffect } from "react";
import api from "../services/api";
import "../Admin.css";


const parseError = (err) => {
  const detail = err.response?.data?.detail;
  if (!detail) return "Error inesperado.";
  if (Array.isArray(detail)) {
    return detail.map((d) => `${d.loc?.at(-1)}: ${d.msg}`).join(" | ");
  }
  return detail;
};


export default function Admin() {
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  // Create admin
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    email: "",
    password: "",
    is_active: true,
  });
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Change password
  const [pwdData, setPwdData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  // Delete admin
  const [deleteError, setDeleteError] = useState("");

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const res = await api.get("/admins/");
      setAdmins(res.data);
    } catch {
      // el interceptor de api.js maneja el 401
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    setCreateLoading(true);
    try {
      await api.post("/admins/", newAdmin);
      setCreateSuccess("Admin creado exitosamente.");
      setNewAdmin({ username: "", email: "", password: "", is_active: true });
      fetchAdmins();
    } catch (err) {
      setCreateError(parseError(err));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (pwdData.new_password !== pwdData.confirm_password) {
      setPwdError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setPwdLoading(true);
    try {
      await api.patch("/admins/me/password", {
        current_password: pwdData.current_password,
        new_password: pwdData.new_password,
      });
      setPwdSuccess("Contraseña actualizada correctamente.");
      setPwdData({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setPwdError(parseError(err));
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    setDeleteError("");
    const confirmed = window.confirm("¿Seguro que deseas eliminar este admin?");
    if (!confirmed) return;
    try {
      await api.delete(`/admins/${adminId}`);
      fetchAdmins();
    } catch (err) {
      setDeleteError(parseError(err));;
    }
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page__title">Panel de Administradores</h1>

      {/* ── ADMINS LIST ── */}
      <section className="admin-section">
        <h2 className="admin-section__title">Administradores registrados</h2>
        {deleteError && <p className="admin-msg admin-msg--error">{deleteError}</p>}
        {loadingAdmins ? (
          <p className="admin-msg">Cargando...</p>
        ) : admins.length === 0 ? (
          <p className="admin-msg">No hay administradores registrados.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Activo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td>{admin.id}</td>
                    <td>{admin.username}</td>
                    <td>{admin.email}</td>
                    <td>
                      <span className={`admin-badge ${admin.is_active ? "admin-badge--active" : "admin-badge--inactive"}`}>
                        {admin.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>

                      {admin.id == 1 && (
                        <span className="admin-note">Admin principal</span>

                      )}

                      {admin.id !== 1 && (
                        <button
                          className="admin-btn admin-btn--danger"
                          onClick={() => handleDeleteAdmin(admin.id)}
                        >
                          Eliminar
                        </button>

                      )}


                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── CREATE ADMIN ── */}
      <section className="admin-section">
        <h2 className="admin-section__title">Crear nuevo administrador</h2>
        <form className="admin-form" onSubmit={handleCreateAdmin}>
          <div className="admin-form__group">
            <label>Usuario</label>
            <input
              type="text"
              placeholder="Nombre de usuario"
              value={newAdmin.username}
              onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
              required
            />
          </div>
          <div className="admin-form__group">
            <label>Email</label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              required
            />
          </div>
          <div className="admin-form__group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="Contraseña"
              value={newAdmin.password}
              onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
              required
            />
          </div>
          <div className="admin-form__group admin-form__group--checkbox">
            <label>
              <input
                type="checkbox"
                checked={newAdmin.is_active}
                onChange={(e) => setNewAdmin({ ...newAdmin, is_active: e.target.checked })}
              />
              {" "}Cuenta activa
            </label>
          </div>
          {createError && <p className="admin-msg admin-msg--error">{createError}</p>}
          {createSuccess && <p className="admin-msg admin-msg--success">{createSuccess}</p>}
          <button className="admin-btn admin-btn--primary" type="submit" disabled={createLoading}>
            {createLoading ? "Creando..." : "Crear Admin"}
          </button>
        </form>
      </section>

      {/* ── CHANGE PASSWORD ── */}
      <section className="admin-section">
        <h2 className="admin-section__title">Cambiar mi contraseña</h2>
        <form className="admin-form" onSubmit={handleChangePassword}>
          <div className="admin-form__group">
            <label>Contraseña actual</label>
            <input
              type="password"
              placeholder="Contraseña actual"
              value={pwdData.current_password}
              onChange={(e) => setPwdData({ ...pwdData, current_password: e.target.value })}
              required
            />
          </div>
          <div className="admin-form__group">
            <label>Nueva contraseña</label>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={pwdData.new_password}
              onChange={(e) => setPwdData({ ...pwdData, new_password: e.target.value })}
              required
            />
          </div>
          <div className="admin-form__group">
            <label>Confirmar nueva contraseña</label>
            <input
              type="password"
              placeholder=" "
              value={pwdData.confirm_password}
              onChange={(e) => setPwdData({ ...pwdData, confirm_password: e.target.value })}
              required
            />
          </div>
          {pwdError && <p className="admin-msg admin-msg--error">{pwdError}</p>}
          {pwdSuccess && <p className="admin-msg admin-msg--success">{pwdSuccess}</p>}
          <button className="admin-btn admin-btn--primary" type="submit" disabled={pwdLoading}>
            {pwdLoading ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>
      </section>
    </div>
  );
}
