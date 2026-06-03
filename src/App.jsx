import { useEffect, useState, useCallback } from "react";

import Header from "./components/Header";

import ClienteList from "./components/ClienteList";
import InstrumentoList from "./components/InstrumentoList";
import ClienteForm from "./components/ClienteForm";
import InstrumentoForm from "./components/InstrumentoForm";
import Modal from "./components/Modal";
import Dashboard from "./components/Dashboard";
import Login from "./pages/Login";


import ServiciosTercerosForm from "./components/ServiciosTercerosForm";
import ServiciosTercerosList from "./components/ServiciosTercerosList";

import RepuestoForm from "./components/RepuestoForm";
import RepuestosList from "./components/RepuestosList";

import TareasList from "./components/TareasList";
import TareaForm from "./components/TareaForm";

const API_URL = import.meta.env.VITE_API_URL;
//const API_URL = "http://localhost:3000";
//const API_URL = "https://sistemast.onrender.com";

function App() {
  const [auth, setAuth] = useState(() =>
    Boolean(localStorage.getItem("token"))
  );

  const [view, setView] = useState("instrumentos");
  const [refresh, setRefresh] = useState(false);
  const [toast, setToast] = useState(null);

  const [instrumentos, setInstrumentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [tareas, setTareas] = useState([]);

  const [showInstrumentoModal, setShowInstrumentoModal] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showServicioModal, setShowServicioModal] = useState(false);
  const [showRepuestoModal, setShowRepuestoModal] = useState(false);
  const [showTareaModal, setShowTareaModal] = useState(false);

  const [instrumentoEdit, setInstrumentoEdit] = useState(null);
  const [servicioEdit, setServicioEdit] = useState(null);
  const [tareaEdit, setTareaEdit] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const safeJson = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("Respuesta inválida:", text);
      return [];
    }
  };

  const fetchAll = useCallback(async () => {
    if (!auth) return;

    try {
    const headers = getHeaders();

    const [ins, cli, serv, rep, tar] = await Promise.all([
      fetch(`${API_URL}/instrumentos`, { headers }).then(safeJson),
      fetch(`${API_URL}/clientes`, { headers }).then(safeJson),
      fetch(`${API_URL}/servicios-terceros`, { headers }).then(safeJson),
      fetch(`${API_URL}/repuestos`, { headers }).then(safeJson),
      fetch(`${API_URL}/tareas`, { headers }).then(safeJson),
    ]);

    setInstrumentos(ins || []);
    setClientes(cli || []);
    setServicios(serv || []);
    setRepuestos(rep || []);
    setTareas(tar || []);
  } catch (error) {
    console.error("Error al cargar datos:", error);
    showToast("Error al cargar datos", "error");
  }
  }, [auth]);

  useEffect(() => {
    if (auth) fetchAll();
  }, [auth, fetchAll]);

  const handleRefresh = useCallback(() => {
    fetchAll();
    setRefresh((r) => !r);
  }, [fetchAll]);

  const logout = () => {
    localStorage.removeItem("token");
    setAuth(false);
    setInstrumentos([]);
    setClientes([]);
    setServicios([]);
    setRepuestos([]);
    setTareas([]);
  };

  if (!auth) {
    return <Login onLogin={() => setAuth(true)} />;
  }

  const handleNewTarea = () => {
    setTareaEdit(null);
    setShowTareaModal(true);
  };

  const handleEditTarea = (t) => {
    setTareaEdit(t);
    setShowTareaModal(true);
  };

  return (
    <div className="container-fluid px-4 py-3">

      <Header
        onLogout={logout}
        view={view}
        setView={setView}
      />

      <div className="row g-3">
        <div className="col-md-3">
          <Dashboard refresh={refresh} />
        </div>

        <div className="col-md-9">
          <div className="card p-3 shadow-sm">

            {view === "instrumentos" && (
              <InstrumentoList
                instrumentos={instrumentos}
                onNew={() => {
                  setInstrumentoEdit(null);
                  setShowInstrumentoModal(true);
                }}
                onEdit={(i) => {
                  setInstrumentoEdit(i);
                  setShowInstrumentoModal(true);
                }}
              />
            )}

            {view === "clientes" && (
              <ClienteList onNew={() => setShowClienteModal(true)} />
            )}

            {view === "servicios" && (
              <ServiciosTercerosList
                servicios={servicios}
                onCreate={() => {
                  setServicioEdit(null);
                  setShowServicioModal(true);
                }}
                onEdit={(s) => {
                  setServicioEdit(s);
                  setShowServicioModal(true);
                }}
                onDelete={async (id) => {
                  if (!window.confirm("¿Eliminar servicio?")) return;

                  await fetch(`${API_URL}/servicios-terceros/${id}`, {
                    method: "DELETE",
                    headers: getHeaders(),
                  });

                  handleRefresh();
                  showToast("Servicio eliminado");
                }}
              />
            )}

            {view === "repuestos" && (
              <RepuestosList repuestos={repuestos} onRefresh={handleRefresh} />
            )}

            {view === "tareas" && (
              <TareasList
                tareas={tareas}
                onEdit={handleEditTarea}
                onDelete={async (id) => {
                  await fetch(`${API_URL}/tareas/${id}`, {
                    method: "DELETE",
                    headers: getHeaders(),
                  });

                  handleRefresh();
                }}
                onNew={handleNewTarea}
              />
            )}
          </div>
        </div>
      </div>

      {/* MODALES */}

      {showInstrumentoModal && (
        <Modal onClose={() => setShowInstrumentoModal(false)}>
          <InstrumentoForm
            instrumento={instrumentoEdit}
            onCreated={() => {
              handleRefresh();
              showToast("Instrumento creado");
            }}
            onUpdated={() => {
              handleRefresh();
              showToast("Instrumento actualizado");
            }}
            onClose={() => setShowInstrumentoModal(false)}
          />
        </Modal>
      )}

      {showClienteModal && (
        <Modal onClose={() => setShowClienteModal(false)}>
          <ClienteForm
            onClienteCreado={() => {
              handleRefresh();
              showToast("Cliente creado");
            }}
            onClose={() => setShowClienteModal(false)}
          />
        </Modal>
      )}

      {showServicioModal && (
        <Modal onClose={() => setShowServicioModal(false)}>
          <ServiciosTercerosForm
            instrumentos={instrumentos}
            servicioEdit={servicioEdit}
            onCreated={() => {
              handleRefresh();
              showToast("Servicio guardado");
            }}
            onUpdated={() => {
              handleRefresh();
              showToast("Servicio actualizado");
            }}
            onClose={() => setShowServicioModal(false)}
          />
        </Modal>
      )}

      {showRepuestoModal && (
        <Modal onClose={() => setShowRepuestoModal(false)}>
          <RepuestoForm
            onCreated={() => {
              handleRefresh();
              showToast("Repuesto creado");
            }}
            onClose={() => setShowRepuestoModal(false)}
          />
        </Modal>
      )}

      {showTareaModal && (
        <Modal onClose={() => setShowTareaModal(false)}>
          <TareaForm
            clientes={clientes}
            instrumentos={instrumentos}
            tareaEdit={tareaEdit}
            onCreated={() => {
              handleRefresh();
              showToast("Tarea creada");
            }}
            onUpdated={() => {
              handleRefresh();
              showToast("Tarea actualizada");
            }}
            onClose={() => setShowTareaModal(false)}
          />
        </Modal>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`position-fixed bottom-0 end-0 m-3 alert ${
          toast.type === "success" ? "alert-success" : "alert-danger"
        } shadow`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;