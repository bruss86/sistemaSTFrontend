import React, { useState } from "react";

export default function Header({ onLogout, view, setView }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const views = [
    { key: "instrumentos", label: "Instrumentos", icon: "🎸" },
    { key: "clientes", label: "Clientes", icon: "👤" },
    { key: "servicios", label: "Servicios", icon: "🛠️" },
    { key: "repuestos", label: "Repuestos", icon: "⚙️" },
    { key: "tareas", label: "Tareas", icon: "📋" },
  ];

  const handleChangeView = (key) => {
    setView(key);
    setMenuOpen(false);
  };

  return (
    <header className="app-header px-3 py-2 mb-3">

      {/* TOP BAR */}
      <div className="header-top">

        {/* TITULO */}
        <div className="app-title">
          📊 Sistema de Gestión
        </div>

        {/* MENU CENTRO (DESKTOP) */}
        <div className={`nav-center ${menuOpen ? "open" : ""}`}>

          {views.map((v) => (
            <button
              key={v.key}
              className={`nav-pill ${view === v.key ? "active" : ""}`}
              onClick={() => handleChangeView(v.key)}
            >
              <span className="me-1">{v.icon}</span>
              {v.label}
            </button>
          ))}

          {/* LOGOUT en mobile dentro del menú */}
          <button
            className="btn btn-outline-danger btn-sm rounded-pill logout-mobile"
            onClick={() => {
              if (window.confirm("¿Cerrar sesión?")) onLogout();
            }}
          >
            🚪 Salir
          </button>

        </div>

        {/* ACCIONES */}
        <div className="header-actions">

          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>

          <button
            className="btn btn-outline-danger btn-sm rounded-pill logout-desktop"
            onClick={() => {
              if (window.confirm("¿Cerrar sesión?")) onLogout();
            }}
          >
            Salir 🚪
          </button>

        </div>

      </div>

    </header>
  );
}