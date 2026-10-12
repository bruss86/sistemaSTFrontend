import { useEffect, useState, useCallback } from "react";

import Header from "./components/Header";

import ClienteList from "./components/ClienteList";
import InstrumentoList from "./components/InstrumentoList";
import ClienteForm from "./components/ClienteForm";
import InstrumentoForm from "./components/InstrumentoForm";
import Modal from "./components/Modal";
import Login from "./pages/Login";
import CasoList from "./components/CasosList";
import MantenimientosList from "./components/MantenimientosList";
import RegistrarMantenimientoModal from "./components/RegistrarMantenimientoModal";

import ServiciosTercerosForm from "./components/ServiciosTercerosForm";
import ServiciosTercerosList from "./components/ServiciosTercerosList";

import RepuestoForm from "./components/RepuestoForm";
import RepuestosList from "./components/RepuestosList";

import TareasList from "./components/TareasList";
import TareaForm from "./components/TareaForm";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [auth, setAuth] = useState(() =>
    Boolean(localStorage.getItem("token"))
  );

  // Inicia por defecto en instrumentos
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
  const [clienteEdit, setClienteEdit] = useState(null); // <-- Asegurar estado de cliente edit
  const [servicioEdit, setServicioEdit] = useState(null);
  const [tareaEdit, setTareaEdit] = useState(null);

  const [casos, setCasos] = useState([]);

  const [mantenimientoFiltro, setMantenimientoFiltro] = useState("todos");
  const [mantenimientoEdit, setMantenimientoEdit] = useState(null);

  const [loading, setLoading] = useState(false);

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

    setLoading(true);

    try {
      const headers = getHeaders();

      const [ins, cli, serv, rep, tar, cas] = await Promise.all([
        fetch(`${API_URL}/instrumentos`, { headers }).then(safeJson),
        fetch(`${API_URL}/clientes`, { headers }).then(safeJson),
        fetch(`${API_URL}/servicios-terceros`, { headers }).then(safeJson),
        fetch(`${API_URL}/repuestos`, { headers }).then(safeJson),
        fetch(`${API_URL}/tareas`, { headers }).then(safeJson),
        fetch(`${API_URL}/casos`, { headers }).then(safeJson),
      ]);

      setInstrumentos(ins || []);
      setClientes(cli || []);
      setServicios(serv || []);
      setRepuestos(rep || []);
      setTareas(tar || []);
      setCasos(cas || []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      showToast("Error al cargar datos", "error");
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    if (auth) fetchAll();
  }, [auth, fetchAll]);

  const handleRefresh = useCallback(() => {
    fetchAll();
    setRefresh((r) => !r);
  }, [fetchAll]);

  // Actualización rápida de estado de tarea
  const handleUpdateEstadoTarea = async (id, nuevoEstado) => {
    try {
      await fetch(`${API_URL}/tareas/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getHeaders(),
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      handleRefresh();
      showToast("Estado actualizado");
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      showToast("Error al actualizar el estado", "error");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setAuth(false);
    setInstrumentos([]);
    setClientes([]);
    setServicios([]);
    setRepuestos([]);
    setTareas([]);
    setCasos([]);
  };

  if (!auth) {
    return <Login onLogin={() => setAuth(true)} />;
  }

  if (loading && instrumentos.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <div className="mt-2 text-muted">Cargando sistema...</div>
        </div>
      </div>
    );
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
    <div className="container-fluid px-4 py-3" style={{ minHeight: "100vh" }}>
      <Header
        onLogout={logout}
        view={view}
        setView={setView}
      />

      {loading && (
        <div className="text-center py-2">
          <div
            className="spinner-border spinner-border-sm text-primary"
            role="status"
          >
            <span className="visually-hidden">Actualizando...</span>
          </div>
          <span className="ms-2 text-muted small">Actualizando datos...</span>
        </div>
      )}

      {/* VISTAS PRINCIPALES (PANTALLA COMPLETA) */}
      <main className="mt-3">
        {view === "instrumentos" && (
          <InstrumentoList
            instrumentos={instrumentos}
            onNavigateToMantenimientos={() => setView("mantenimientos")}
            onNew={() => {
              setInstrumentoEdit(null);
              setShowInstrumentoModal(true);
            }}
            onEdit={(i) => {
              setInstrumentoEdit(i);
              setShowInstrumentoModal(true);
            }}
            onDelete={async (id) => {
              await fetch(`${API_URL}/instrumentos/${id}`, {
                method: "DELETE",
                headers: getHeaders(),
              });
              handleRefresh();
              showToast("Instrumento eliminado");
            }}
          />
        )}

        {view === "clientes" && (
          <ClienteList
            clientes={clientes}
            instrumentos={instrumentos}
            onRefresh={handleRefresh}
            onNew={() => {
              setClienteEdit(null);
              setShowClienteModal(true);
            }}
            onEdit={(c) => {
              setClienteEdit(c);
              setShowClienteModal(true);
            }}
            onDelete={async (id) => {
              await fetch(`${API_URL}/clientes/${id}`, {
                method: "DELETE",
                headers: getHeaders(),
              });
              handleRefresh();
              showToast("Cliente eliminado");
            }}
          />
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
              showToast("Tarea eliminada");
            }}
            onNew={handleNewTarea}
            onUpdateEstado={handleUpdateEstadoTarea}
          />
        )}

        {view === "casos" && (
          <CasoList
            casos={casos}
            onRefresh={handleRefresh}
          />
        )}

        {view === "mantenimientos" && (
          <MantenimientosList
            instrumentos={instrumentos}
            filtroInicial={mantenimientoFiltro}
            onEdit={(instrumento) => {
              setInstrumentoEdit(instrumento);
              setShowInstrumentoModal(true);
            }}
            onRegistrarMantenimiento={(instrumento) => {
              setMantenimientoEdit(instrumento);
            }}
          />
        )}
      </main>

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
            clienteEditando={clienteEdit}
            onClienteCreado={() => {
              handleRefresh();
              showToast("Cliente creado");
              setShowClienteModal(false); // <--- CIERRA EL MODAL AL CREAR
            }}
            onClienteGuardado={() => {
              handleRefresh();
              showToast("Cliente actualizado");
              setShowClienteModal(false); // <--- CIERRA EL MODAL AL ACTUALIZAR
            }}
            onClose={() => setShowClienteModal(false)} // <--- CIERRA EL MODAL AL CANCELAR
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

      {mantenimientoEdit && (
        <Modal onClose={() => setMantenimientoEdit(null)}>
          <RegistrarMantenimientoModal
            instrumento={mantenimientoEdit}
            onUpdated={() => {
              setMantenimientoEdit(null);
              handleRefresh();
              showToast("Mantenimiento registrado");
            }}
            onClose={() => setMantenimientoEdit(null)}
          />
        </Modal>
      )}

      {/* TOAST */}
      {toast && (
        <div
          className={`position-fixed bottom-0 end-0 m-3 alert ${
            toast.type === "success" ? "alert-success" : "alert-danger"
          } shadow`}
          style={{ zIndex: 1050 }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;