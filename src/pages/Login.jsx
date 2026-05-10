import { useState } from "react";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
      onLogin();
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <h3>🔐 Login</h3>

      <form onSubmit={handleSubmit}>
        <input
          className="form-control my-2"
          placeholder="Email"
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          type="password"
          className="form-control my-2"
          placeholder="Password"
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <button className="btn btn-primary w-100">
          Entrar
        </button>
      </form>
    </div>
  );
}