import { useState } from "react";

export default function Header({ onLogout, view, setView }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const views = [
    { key: "instrumentos", label: "Instrumentos", icon: <i className="bi bi-boxes"></i>},
    { key: "clientes", label: "Clientes", icon: <i className="bi bi-person-square"></i> },
    { key: "servicios", label: "Servicios", icon: <i className="bi bi-tools"></i> },
    { key: "repuestos", label: "Repuestos", icon: <i className="bi bi-gear"></i> },
    { key: "tareas", label: "Tareas", icon: <i className="bi bi-list-check"></i> },
    { key: "casos", label: "Casos", icon: <i className="bi bi-bell-fill"></i> },
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
              setShowLogoutModal(true);
            }}
          >
            <i className="bi bi-door-open-fill"></i> Salir
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
              setShowLogoutModal(true);
            }}
          >
            <i className="bi bi-door-open-fill"></i> Salir
          </button>

        </div>

        {showLogoutModal && (
          <>
            <div
              className="modal fade show"
              style={{ display: "block" }}
              tabIndex="-1"
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">

                  <div className="modal-header">
                    <h5 className="modal-title">Cerrar sesión</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowLogoutModal(false)}
                    ></button>
                  </div>

                  <div className="modal-body">
                    <p>¿Desea cerrar la sesión?</p>
                  </div>

                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowLogoutModal(false)}
                    >
                      Cancelar
                    </button>

                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        setShowLogoutModal(false);
                        onLogout();
                      }}
                    >
                      Cerrar sesión
                    </button>
                  </div>

                </div>
              </div>
            </div>

            <div
              className="modal-backdrop fade show"
              onClick={() => setShowLogoutModal(false)}
            ></div>
          </>
        )}

      </div>

    </header>
  );
}