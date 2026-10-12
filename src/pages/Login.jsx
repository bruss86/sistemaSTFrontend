import { useState } from "react";
import "../styles/Login.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function Login({ onLogin }) {
  const [form, setForm] = useState({
    email: localStorage.getItem("remembered_email") || "",
    password: "",
  });

  const [rememberMe, setRememberMe] = useState(
    Boolean(localStorage.getItem("remembered_email"))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  // Manejar cambio en inputs y limpiar errores automáticamente
  const handleChange = (e) => {
    if (error) setError(null);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Detectar Mayúsculas en campo contraseña
  const handleKeyUp = (e) => {
    if (e.getModifierState) {
      setCapsLock(e.getModifierState("CapsLock"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Guardar / Olvidar correo
    if (rememberMe) {
      localStorage.setItem("remembered_email", form.email);
    } else {
      localStorage.removeItem("remembered_email");
    }

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Credenciales incorrectas");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        onLogin();
      }
    } catch (err) {
      console.error("Error login:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex justify-content-center align-items-center p-3"
      style={{
        background:
          "linear-gradient(135deg, #0d6efd 0%, #0b5ed7 40%, #084298 100%)",
      }}
    >
      <div
        className="card border-0 shadow-lg login-card animate__animated animate__fadeIn"
        style={{
          width: "100%",
          maxWidth: "420px",
          borderRadius: "20px",
        }}
      >
        <div className="card-body p-4 p-md-5">
          {/* BRAND / LOGO */}
          <div className="text-center mb-4">
            <img
              src="/favicon.png"
              alt="Sistema ST"
              style={{
                width: 70,
                height: 70,
                objectFit: "contain",
                borderRadius: "16px",
              }}
            />
            <h3 className="mt-3 mb-1 fw-bold text-dark">Sistema ST</h3>
            <p className="text-muted small mb-0">
              Gestión de Instrumentos y Mantenimientos
            </p>
          </div>

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger py-2 small mb-3 text-center shadow-sm">
                <i className="bi bi-exclamation-triangle-fill me-1"></i> {error}
              </div>
            )}

            {/* EMAIL */}
            <div className="mb-3">
              <label className="form-label small text-muted fw-semibold mb-1">
                Correo electrónico
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted border-end-0">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  name="email"
                  className="form-control border-start-0 ps-0"
                  placeholder="ejemplo@correo.com"
                  type="email"
                  autoComplete="username"
                  value={form.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* CONTRASEÑA */}
            <div className="mb-2">
              <label className="form-label small text-muted fw-semibold mb-1">
                Contraseña
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted border-end-0">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="form-control border-start-0 border-end-0 ps-0"
                  value={form.password}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  onChange={handleChange}
                  onKeyUp={handleKeyUp}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  title={showPassword ? "Ocultar" : "Mostrar"}
                >
                  <i
                    className={`bi ${
                      showPassword ? "bi-eye-slash" : "bi-eye"
                    }`}
                  ></i>
                </button>
              </div>

              {/* AVISO DE MAYÚSCULAS */}
              {capsLock && (
                <div className="text-warning mt-1 small" style={{ fontSize: "0.75rem" }}>
                  <i className="bi bi-capslock-fill me-1"></i> Bloq Mayús activado
                </div>
              )}
            </div>

            {/* OPCIONES: RECORDARME */}
            <div className="d-flex justify-content-between align-items-center mb-4 mt-2">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <label
                  className="form-check-input-label small text-muted"
                  htmlFor="rememberMe"
                  style={{ cursor: "pointer", fontSize: "0.85rem" }}
                >
                  Recordar email
                </label>
              </div>
            </div>

            {/* BOTÓN INGRESAR */}
            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  Ingresando...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Ingresar
                </>
              )}
            </button>
          </form>

          {/* FOOTER */}
          <div className="text-center mt-4 pt-3 border-top">
            <small className="text-muted" style={{ fontSize: "0.75rem" }}>
              Sistema ST v3.0 (Octubre 2026)
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}