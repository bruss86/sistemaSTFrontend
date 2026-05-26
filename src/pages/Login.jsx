import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;
//const API_URL = "http://localhost:3000";
//const API_URL = "https://sistemast.onrender.com";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    <div className="container mt-5" style={{ maxWidth: 420 }}>
      <div className="card shadow-sm p-4">
        <h3 className="mb-3 text-center">🔐 Login</h3>

        {error && (
          <div className="alert alert-danger py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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

          <input
            type="password"
            className="form-control my-2"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            required
          />

          <button
            className="btn btn-primary w-100 mt-2"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}