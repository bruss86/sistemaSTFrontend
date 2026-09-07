import { useState } from "react";
import "../styles/Login.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function Login({ onLogin }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error en login");
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
          className="min-vh-100 d-flex justify-content-center align-items-center"
          style={{
            background:
              "linear-gradient(135deg,#0d6efd 0%,#0b5ed7 40%,#084298 100%)",
          }}
        >
          <div
              className="card border-0 shadow-lg login-card"
              style={{
                  width: "100%",
                  maxWidth: "420px",
                  borderRadius: "20px",
              }}
          >
            <div className="text-center mb-4">

            <img
              src="/favicon.png"
              alt="Sistema ST"
              style={{
                width: 80,
                height: 80,
                objectFit: "contain",
                borderRadius: "18px",
                marginTop: "15px",
              }}
            />

        <h2 className="mt-3 mb-1">
            Sistema ST
        </h2>

        <p className="text-muted mb-0">
            Gestión de Instrumentos
        </p>

    </div>

        {error && (
          <div className="alert alert-danger py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card-body p-5">
          <input
            className="form-control my-2"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />

          <div className="input-group">

            <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                value={form.password}
                placeholder="********"
                onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                }
            />

            <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
            >
                <i
                    className={`bi ${
                        showPassword
                            ? "bi-eye-slash"
                            : "bi-eye"
                    }`}
                ></i>
            </button>

        </div>

          <button
              className="btn btn-primary w-100"
              disabled={loading}
          >
              {loading ? (
                  <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Ingresando...
                  </>
              ) : (
                  <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Ingresar
                  </>
              )}
          </button>
          <div className="text-center mt-4">

              <small className="text-muted">
                  Sistema ST v2.4b (Septiembre 2026)
              </small>

          </div>
        </form>
      </div>
      
    </div>
  );
}