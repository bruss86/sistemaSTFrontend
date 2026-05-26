import React from "react";

export default function Header({ onLogout, view, setView }) {
  const views = [
    { key: "instrumentos", label: "Instrumentos", icon: "🎸" },
    { key: "clientes", label: "Clientes", icon: "👤" },
    { key: "servicios", label: "Servicios", icon: "🛠️" },
    { key: "repuestos", label: "Repuestos", icon: "⚙️" },
    { key: "tareas", label: "Tareas", icon: "📋" },
  ];

  return (
    <header className="app-header px-3 py-2 mb-4">

      <div className="d-flex align-items-center justify-content-between gap-3">

        {/* LOGO / TITULO */}
        <div className="d-flex align-items-center flex-shrink-0">
          <h4 className="m-0 fw-bold">
            📊 Sistema de Gestión
          </h4>
        </div>

        {/* NAV */}
        <div className="flex-grow-1 d-flex justify-content-center">
          <div className="nav-pills-custom">

            {views.map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`nav-pill ${
                  view === v.key ? "active" : ""
                }`}
              >
                <span className="me-2">{v.icon}</span>
                {v.label}
              </button>
            ))}

          </div>
        </div>

        {/* LOGOUT */}
        <div className="flex-shrink-0">
          <button
            className="btn btn-outline-danger btn-sm rounded-pill px-3"
            onClick={() => {
              if (window.confirm("¿Cerrar sesión?")) onLogout();
            }}
          >
            🚪 Salir
          </button>
        </div>

      </div>

    </header>
  );
}