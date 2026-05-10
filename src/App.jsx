import { useState } from "react";
import ClienteList from "./components/ClienteList";
import InstrumentoList from "./components/InstrumentoList";
import ClienteForm from "./components/ClienteForm";
import InstrumentoForm from "./components/InstrumentoForm";
import Modal from "./components/Modal";
import Dashboard from "./components/Dashboard";
import Login from "./pages/Login";

function App() {
  const [refresh, setRefresh] = useState(false);
  const [view, setView] = useState("instrumentos");

  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showInstrumentoModal, setShowInstrumentoModal] = useState(false);

  const [auth, setAuth] = useState(
    !!localStorage.getItem("token")
  );

  if (!auth) {
    return <Login onLogin={() => setAuth(true)} />;
  }

  const handleRefresh = () => {
    setRefresh((prev) => !prev);
  };

  return (
    <div className="container-fluid py-3">
      <h1 className="text-center mb-4">📊 Sistema de Instrumentos</h1>

      {/* BOTONES SUPERIORES */}
      <div className="d-flex justify-content-center gap-3 mb-4 flex-wrap">
        <button
          className="btn btn-primary"
          onClick={() => setShowInstrumentoModal(true)}
        >
          ➕ Crear Instrumento
        </button>

        <button
          className="btn btn-success"
          onClick={() => setShowClienteModal(true)}
        >
          ➕ Crear Cliente
        </button>
      </div>

      {/* LAYOUT PRINCIPAL */}
      <div className="row">

        {/* DASHBOARD */}
        <div className="col-md-3 mb-3">
          <Dashboard refresh={refresh} />
        </div>

        {/* PANEL DERECHO */}
        <div className="col-md-9">

          {/* BOTONES DE CAMBIO DE VISTA */}
          <div className="mb-3 d-flex gap-2">
            {/* NAV TABS */}
            <ul className="nav nav-tabs mb-3">
              <li className="nav-item">
                <button
                  className={`nav-link ${
                  view === "instrumentos" ? "active" : ""
                  }`}
                  onClick={() => setView("instrumentos")}
                >
                  <i className="bi bi-tools me-2"></i>
                    Instrumentos
                </button>
              </li>

              <li className="nav-item">
                <button
                  className={`nav-link ${
                    view === "clientes" ? "active" : ""
                  }`}
                  onClick={() => setView("clientes")}
                >
                  <i className="bi bi-people-fill me-2"></i>
                  Clientes
                </button>
              </li>
            </ul>
          </div>

          {/* CONTENIDO DINÁMICO */}
          <div className="card p-3 shadow-sm">
            {view === "instrumentos" ? (
              <InstrumentoList refresh={refresh} />
            ) : (
              <ClienteList refresh={refresh} />
            )}
          </div>

        </div>
      </div>

      {/* MODAL CLIENTE */}
      {showClienteModal && (
        <Modal onClose={() => setShowClienteModal(false)}>
          <ClienteForm
            onClienteCreado={() => {
              handleRefresh();
              setShowClienteModal(false);
            }}
          />
        </Modal>
      )}

      {/* MODAL INSTRUMENTO */}
      {showInstrumentoModal && (
        <Modal onClose={() => setShowInstrumentoModal(false)}>
          <InstrumentoForm
            onCreated={() => {
              handleRefresh();
              setShowInstrumentoModal(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

export default App;