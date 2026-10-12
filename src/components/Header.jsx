import { useState } from "react";
import "../styles/Header.css";

export default function Header({ onLogout, view, setView }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const views = [
    { key: "instrumentos", label: "Instrumentos", icon: <i className="bi bi-boxes"></i> },
    { key: "mantenimientos", label: "Mantenimientos", icon: <i className="bi bi-tools"></i> },
    { key: "clientes", label: "Clientes", icon: <i className="bi bi-person-square"></i> },
    { key: "servicios", label: "Servicios T.", icon: <i className="bi bi-gear-wide-connected"></i> },
    { key: "repuestos", label: "Repuestos", icon: <i className="bi bi-gear"></i> },
    { key: "tareas", label: "Tareas", icon: <i className="bi bi-list-check"></i> },
    { key: "casos", label: "Casos", icon: <i className="bi bi-bell-fill"></i> },
  ];

  const handleChangeView = (key) => {
    setView(key);
    setMenuOpen(false);
  };

  return (
    <header className="app-header px-3 py-2 mb-3 shadow-sm rounded-3 bg-white border">

      {/* TOP BAR */}
      <div className="header-top d-flex justify-content-between align-items-center">

        {/* TITULO */}
        <div className="app-title fw-bold text-dark d-flex align-items-center gap-2">
          <span>📊</span> Sistema ST
        </div>

        {/* MENU CENTRO (DESKTOP / MOBILE) */}
        <div className={`nav-center ${menuOpen ? "open" : ""}`}>
          {views.map((v) => (
            <button
              key={v.key}
              className={`nav-pill btn btn-sm px-3 py-2 d-flex align-items-center gap-1 ${
                view === v.key ? "btn-primary text-white fw-semibold" : "btn-light text-secondary border-0"
              }`}
              onClick={() => handleChangeView(v.key)}
            >
              <span>{v.icon}</span>
              {v.label}
            </button>
          ))}

          {/* LOGOUT en mobile dentro del menú */}
          <button
            className="btn btn-outline-danger btn-sm rounded-pill logout-mobile mt-2"
            onClick={() => setShowLogoutModal(true)}
          >
            <i className="bi bi-door-open-fill me-1"></i> Salir
          </button>
        </div>

        {/* ACCIONES */}
        <div className="header-actions d-flex align-items-center gap-2">
          <button
            className="menu-toggle btn btn-light d-md-none border"
            onClick={() => setMenuOpen(!menuOpen)}
            title="Abrir menú"
          >
            <i className={`bi ${menuOpen ? "bi-x-lg" : "bi-list"}`}></i>
          </button>

          <button
            className="btn btn-outline-danger btn-sm rounded-pill logout-desktop d-none d-md-flex align-items-center gap-1 px-3 shadow-sm"
            onClick={() => setShowLogoutModal(true)}
          >
            <i className="bi bi-door-open-fill"></i> Salir
          </button>
        </div>

        {/* MODAL DE LOGOUT */}
        {showLogoutModal && (
          <>
            <div
              className="modal fade show"
              style={{ display: "block" }}
              tabIndex="-1"
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow">

                  <div className="modal-header bg-danger text-white">
                    <h5 className="modal-title fw-bold">
                      <i className="bi bi-box-arrow-right me-2"></i> Cerrar sesión
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowLogoutModal(false)}
                    />
                  </div>

                  <div className="modal-body py-4">
                    <p className="mb-0 text-secondary">
                      ¿Está seguro de que desea cerrar la sesión actual?
                    </p>
                  </div>

                  <div className="modal-footer bg-light">
                    <button
                      type="button"
                      className="btn btn-secondary px-4"
                      onClick={() => setShowLogoutModal(false)}
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger px-4"
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