import { useState, useMemo, useEffect } from "react";
import Modal from "./Modal";

export default function CasosList({ casos = [], onRefresh, onDelete }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const MY_EMAIL = import.meta.env.VITE_EMAIL_USER; // O tu correo de soporte configurado

  const [casoSeleccionado, setCasoSeleccionado] = useState(null);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [sincronizando, setSincronizando] = useState(false);
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Ordenamiento
  const [sortField, setSortField] = useState("fechaCreacion");
  const [sortDirection, setSortDirection] = useState("desc");

  // Estados para los selectores dentro del modal de detalles
  const [modoSeleccion, setModoSeleccion] = useState(null); // null | 'cliente' | 'instrumento'
  const [listaClientes, setListaClientes] = useState([]);
  const [listaInstrumentos, setListaInstrumentos] = useState([]);
  const [busquedaFiltro, setBusquedaFiltro] = useState("");

  const [casoAEliminar, setCasoAEliminar] = useState(null);
  const [casoATarea, setCasoATarea] = useState(null);

  // Estado para el modal de notificaciones/avisos (reemplaza los alert)
  const [mensajeModal, setMensajeModal] = useState(null); // { titulo: "", texto: "", tipo: "success" | "danger" | "info" }

  // =========================================================
  // SINCRONIZAR GMAIL Y CREAR CASOS / RESPUESTAS
  // =========================================================
  const handleSincronizarGmail = async () => {
    try {
      setSincronizando(true);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/casos/sincronizar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al sincronizar");

      setMensajeModal({
        titulo: "Sincronización Exitosa",
        texto: data.message || "Sincronización completada con éxito",
        tipo: "success"
      });
      onRefresh?.();
    } catch (error) {
      console.error(error);
      setMensajeModal({
        titulo: "Error de Sincronización",
        texto: "Hubo un error al sincronizar con Gmail",
        tipo: "danger"
      });
    } finally {
      setSincronizando(false);
    }
  };

  // =========================================================
  // ACTUALIZAR ESTADO DEL CASO
  // =========================================================
  const actualizarEstado = async (id, estado) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/casos/${id}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Si tenemos el caso abierto en el modal, actualizamos su estado localmente también
      if (casoSeleccionado && casoSeleccionado._id === id) {
        setCasoSeleccionado(data.caso || { ...casoSeleccionado, estado });
      }

      onRefresh?.();
    } catch (error) {
      console.error(error);
      setMensajeModal({
        titulo: "Error",
        texto: "Error actualizando estado",
        tipo: "danger"
      });
    }
  };

  // =========================================================
  // ASIGNAR CLIENTE E INSTRUMENTO DESDE EL BUSCADOR
  // =========================================================
  const abrirSelectorCliente = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/clientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setListaClientes(data);
      setBusquedaFiltro("");
      setModoSeleccion("cliente");
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setMensajeModal({
        titulo: "Error",
        texto: "No se pudieron cargar los clientes",
        tipo: "danger"
      });
    }
  };

  const abrirSelectorInstrumento = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/instrumentos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setListaInstrumentos(data);
      setBusquedaFiltro("");
      setModoSeleccion("instrumento");
    } catch (error) {
      console.error("Error al cargar instrumentos:", error);
      setMensajeModal({
        titulo: "Error",
        texto: "No se pudieron cargar los instrumentos",
        tipo: "danger"
      });
    }
  };

  const asignarClienteSeleccionado = async (clienteId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/casos/${casoSeleccionado._id}/cliente`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clienteId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCasoSeleccionado(data.caso);
      setModoSeleccion(null);
      onRefresh?.();
      
      setMensajeModal({
        titulo: "Asignación Exitosa",
        texto: "¡Cliente asignado con éxito!",
        tipo: "success"
      });
    } catch (error) {
      console.error(error);
      setMensajeModal({
        titulo: "Error",
        texto: "Error al asignar el cliente",
        tipo: "danger"
      });
    }
  };

  const asignarInstrumentoSeleccionado = async (instrumentoId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/casos/${casoSeleccionado._id}/instrumento`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ instrumentoId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCasoSeleccionado(data.caso);
      setModoSeleccion(null);
      onRefresh?.();

      setMensajeModal({
        titulo: "Asignación Exitosa",
        texto: "¡Instrumento asignado con éxito!",
        tipo: "success"
      });
    } catch (error) {
      console.error(error);
      setMensajeModal({
        titulo: "Error",
        texto: "Error al asignar el instrumento",
        tipo: "danger"
      });
    }
  };

  // =========================================================
  // BADGES Y COLORES DE ESTADO
  // =========================================================
  const getEstadoBadge = (estado) => {
    switch (estado) {
      case "Abierto":
        return "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25";
      case "En Proceso":
        return "bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25";
      case "Pendiente Cliente":
        return "bg-info bg-opacity-10 text-info border border-info border-opacity-25";
      case "Cerrado":
        return "bg-success bg-opacity-10 text-success border border-success border-opacity-25";
      default:
        return "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25";
    }
  };

  // =========================================================
  // RESUMEN Y KPIS
  // =========================================================
  const resumenCasos = useMemo(() => {
    const res = {
      total: casos.length,
      abiertos: 0,
      enProceso: 0,
      pendienteCliente: 0,
      cerrados: 0,
    };

    casos.forEach((c) => {
      if (c.estado === "Abierto") res.abiertos++;
      else if (c.estado === "En Proceso") res.enProceso++;
      else if (c.estado === "Pendiente Cliente") res.pendienteCliente++;
      else if (c.estado === "Cerrado") res.cerrados++;
    });

    return res;
  }, [casos]);

  // =========================================================
  // FILTRO + ORDEN
  // =========================================================
  const filteredCasos = useMemo(() => {
    let data = casos.filter((c) => {
      const texto = search.toLowerCase().trim();

      const coincideBusqueda =
        !texto ||
        c.numero?.toLowerCase().includes(texto) ||
        c.asunto?.toLowerCase().includes(texto) ||
        c.remitente?.toLowerCase().includes(texto);

      const coincideEstado =
        estadoFiltro === "todos" ? true : c.estado === estadoFiltro;

      return coincideBusqueda && coincideEstado;
    });

    data.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "fechaCreacion") {
        valA = new Date(valA || 0);
        valB = new Date(valB || 0);
      }

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [casos, search, estadoFiltro, sortField, sortDirection]);

  // =========================================================
  // PAGINACIÓN
  // =========================================================
  const totalPages = Math.ceil(filteredCasos.length / itemsPerPage);

  const paginatedCasos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCasos.slice(start, start + itemsPerPage);
  }, [filteredCasos, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, estadoFiltro, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="container-fluid p-0">
      {/* TARJETAS DE RESUMEN (KPIS) CLICKEABLES */}
      <div className="row g-2 mb-3">
        <div className="col">
          <div
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 kpi-card ${
              estadoFiltro === "todos" ? "border-start border-4 border-primary" : ""
            }`}
            onClick={() => setEstadoFiltro("todos")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-muted small fw-semibold">Total Casos</span>
            <span className="fs-4 fw-bold text-dark">{resumenCasos.total}</span>
          </div>
        </div>

        <div className="col">
          <div
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 kpi-card ${
              estadoFiltro === "Abierto" ? "border-start border-4 border-danger" : ""
            }`}
            onClick={() => setEstadoFiltro("Abierto")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-danger small fw-semibold">Abiertos</span>
            <span className="fs-4 fw-bold text-danger">{resumenCasos.abiertos}</span>
          </div>
        </div>

        <div className="col">
          <div
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 kpi-card ${
              estadoFiltro === "En Proceso" ? "border-start border-4 border-warning" : ""
            }`}
            onClick={() => setEstadoFiltro("En Proceso")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-warning small fw-semibold">En Proceso</span>
            <span className="fs-4 fw-bold text-warning">{resumenCasos.enProceso}</span>
          </div>
        </div>

        <div className="col">
          <div
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 kpi-card ${
              estadoFiltro === "Pendiente Cliente" ? "border-start border-4 border-info" : ""
            }`}
            onClick={() => setEstadoFiltro("Pendiente Cliente")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-info small fw-semibold">Pend. Cliente</span>
            <span className="fs-4 fw-bold text-info">{resumenCasos.pendienteCliente}</span>
          </div>
        </div>

        <div className="col">
          <div
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 kpi-card ${
              estadoFiltro === "Cerrado" ? "border-start border-4 border-success" : ""
            }`}
            onClick={() => setEstadoFiltro("Cerrado")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-success small fw-semibold">Cerrados</span>
            <span className="fs-4 fw-bold text-success">{resumenCasos.cerrados}</span>
          </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="card p-3 shadow-sm border-0 rounded-3">
        {/* CABECERA, BOTÓN DE SINCRONIZAR Y BÚSQUEDA */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <h5 className="m-0 text-dark fw-bold">
              📥 Gestión de Casos / Tickets{" "}
              <span className="text-muted fs-6">({filteredCasos.length})</span>
            </h5>

            <button
              className="btn btn-sm btn-primary shadow-sm d-flex align-items-center gap-1"
              onClick={handleSincronizarGmail}
              disabled={sincronizando}
            >
              <i className={`bi bi-arrow-clockwise ${sincronizando ? "spinner-border spinner-border-sm" : ""}`}></i>
              {sincronizando ? "Sincronizando..." : "Sincronizar Gmail"}
            </button>
          </div>

          <div className="d-flex gap-2 flex-grow-1 justify-content-end flex-wrap">
            <input
              type="text"
              className="form-control"
              placeholder="🔎 Buscar por caso, asunto o remitente..."
              style={{ maxWidth: 350, minWidth: 200 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="form-select"
              style={{ maxWidth: 180 }}
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="Abierto">Abiertos</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Pendiente Cliente">Pendiente Cliente</option>
              <option value="Cerrado">Cerrados</option>
            </select>
          </div>
        </div>

        {/* TABLA DE CASOS */}
        <div className="table-responsive border rounded-3 shadow-sm">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark text-nowrap">
              <tr>
                <th style={{ width: "12%" }} className="py-3" role="button" onClick={() => handleSort("numero")}>
                  Caso {getSortIcon("numero")}
                </th>
                <th style={{ width: "12%" }} className="py-3" role="button" onClick={() => handleSort("fechaCreacion")}>
                  Fecha {getSortIcon("fechaCreacion")}
                </th>
                <th style={{ width: "15%" }} className="text-center py-3" role="button" onClick={() => handleSort("estado")}>
                  Estado {getSortIcon("estado")}
                </th>
                <th style={{ width: "22%" }} className="py-3" role="button" onClick={() => handleSort("remitente")}>
                  Remitente {getSortIcon("remitente")}
                </th>
                <th style={{ width: "23%" }} className="py-3">Asunto</th>
                <th style={{ width: "6%" }} className="text-center py-3">Msjs</th>
                <th style={{ width: "10%" }} className="text-center py-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {paginatedCasos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-5">
                    <i className="bi bi-inbox fs-1 d-block mb-2 opacity-50"></i>
                    No se encontraron casos de soporte registrados
                  </td>
                </tr>
              ) : (
                paginatedCasos.map((c) => (
                  <tr
                    key={c._id}
                    onDoubleClick={() => {
                      setCasoSeleccionado(c);
                      setModoSeleccion(null);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="fw-bold text-primary">#{c.numero}</td>
                    <td className="text-dark">
                      {c.fechaCreacion
                        ? new Date(c.fechaCreacion).toLocaleDateString("es-AR")
                        : "—"}
                    </td>
                    <td className="text-center">
                      <span className={`badge rounded-pill px-3 py-1 fw-semibold ${getEstadoBadge(c.estado)}`} style={{ fontSize: "0.75rem" }}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="text-truncate fw-semibold text-dark" style={{ maxWidth: 200 }} title={c.remitente}>
                      <i className="bi bi-person text-muted me-1"></i>
                      {c.remitente || "—"}
                    </td>
                    <td className="text-truncate text-secondary" style={{ maxWidth: 250 }} title={c.asunto}>
                      {c.asunto || "Sin asunto"}
                    </td>
                    <td className="text-center">
                      <span className="badge rounded-pill bg-light text-dark border">
                        <i className="bi bi-chat-text text-muted me-1"></i>
                        {c.mensajes?.length || 0}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-1">
                        <button
                          className="btn btn-sm btn-light border text-primary shadow-sm"
                          title="Ver detalle del caso"
                          onClick={() => {
                            setCasoSeleccionado(c);
                            setModoSeleccion(null);
                          }}
                        >
                          <i className="bi bi-eye-fill"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-light border text-danger shadow-sm"
                          title="Eliminar caso"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCasoAEliminar(c);
                          }}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Mostrar:</span>
              <select
                className="form-select form-select-sm"
                style={{ width: "80px" }}
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              <span className="small fw-bold">
                Página {currentPage} de {totalPages || 1}
              </span>

              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🗑️ MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {casoAEliminar && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1070 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "400px" }}>
            <div className="modal-content shadow-lg border-0">
              
              <div className="modal-header bg-danger text-white py-2 px-3">
                <h6 className="modal-title fw-bold m-0">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Confirmar Eliminación
                </h6>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Cerrar"
                  onClick={() => setCasoAEliminar(null)}
                ></button>
              </div>

              <div className="modal-body p-3 text-center">
                <p className="text-secondary small mb-1">
                  ¿Estás seguro de que deseas eliminar permanentemente el caso:
                </p>
                <h5 className="fw-bold text-dark my-2">#{casoAEliminar.numero}</h5>
                <p className="text-muted" style={{ fontSize: "0.75rem" }}>
                  Esta acción no se puede deshacer y borrará todo su historial de mensajes asociado.
                </p>
              </div>

              <div className="modal-footer py-2 px-3 bg-light border-top-0 d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm px-3"
                  onClick={() => setCasoAEliminar(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm px-3"
                  onClick={async () => {
                    try {
                      await onDelete?.(casoAEliminar._id);
                      setCasoAEliminar(null); // Cerramos el modal tras eliminar
                    } catch (error) {
                      console.error("Error al eliminar el caso:", error);
                      setMensajeModal({
                        titulo: "Error",
                        texto: "Hubo un error al eliminar el caso.",
                        tipo: "danger"
                      });
                    }
                  }}
                >
                  Sí, Eliminar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 📋 MODAL DE CONFIRMACIÓN PARA CONVERTIR EN TAREA */}
      {casoATarea && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1070 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "400px" }}>
            <div className="modal-content shadow-lg border-0">
              
              <div className="modal-header bg-primary text-white py-2 px-3">
                <h6 className="modal-title fw-bold m-0">
                  <i className="bi bi-list-task me-2"></i>
                  Crear Tarea desde Caso
                </h6>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Cerrar"
                  onClick={() => setCasoATarea(null)}
                ></button>
              </div>

              <div className="modal-body p-3 text-center">
                <p className="text-secondary small mb-1">
                  ¿Deseas crear una tarea basada en los datos del caso:
                </p>
                <h5 className="fw-bold text-dark my-2">#{casoATarea.numero}</h5>
                <p className="text-muted" style={{ fontSize: "0.75rem" }}>
                  Se importarán automáticamente el cliente, el instrumento y los detalles asociados.
                </p>
              </div>

              <div className="modal-footer py-2 px-3 bg-light border-top-0 d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm px-3"
                  onClick={() => setCasoATarea(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-3"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("token");
                      const res = await fetch(`${API_URL}/tareas/desde-caso/${casoATarea._id}`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ prioridad: "Media" }),
                      });

                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || "Error al crear la tarea");

                      setMensajeModal({
                        titulo: "Tarea Creada",
                        texto: "¡Tarea creada con éxito con los datos del cliente e instrumento!",
                        tipo: "success"
                      });
                      
                      // Actualizamos el estado local del caso a "En Proceso"
                      setCasoSeleccionado(prev => prev ? {
                        ...prev,
                        estado: "En Proceso"
                      } : null);

                      setCasoATarea(null); // Cerramos este modal
                      onRefresh?.();
                    } catch (error) {
                      console.error(error);
                      setMensajeModal({
                        titulo: "Error",
                        texto: "Hubo un error al convertir el caso en tarea",
                        tipo: "danger"
                      });
                    }
                  }}
                >
                  Sí, Crear Tarea
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 🔔 MODAL GENERAL DE AVISOS / ALERTAS (REEMPLAZA LOS ALERT) */}
      {mensajeModal && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1080 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "380px" }}>
            <div className="modal-content shadow-lg border-0">
              
              <div className={`modal-header text-white py-2 px-3 bg-${mensajeModal.tipo === 'success' ? 'success' : mensajeModal.tipo === 'danger' ? 'danger' : 'primary'}`}>
                <h6 className="modal-title fw-bold m-0">
                  <i className={`bi ${mensajeModal.tipo === 'success' ? 'bi-check-circle-fill' : mensajeModal.tipo === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'} me-2`}></i>
                  {mensajeModal.titulo}
                </h6>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Cerrar"
                  onClick={() => setMensajeModal(null)}
                ></button>
              </div>

              <div className="modal-body p-3 text-center">
                <p className="text-secondary small my-2" style={{ fontSize: "0.85rem" }}>
                  {mensajeModal.texto}
                </p>
              </div>

              <div className="modal-footer py-2 px-3 bg-light border-top-0 d-flex justify-content-center">
                <button
                  type="button"
                  className={`btn btn-sm px-4 btn-${mensajeModal.tipo === 'success' ? 'success' : mensajeModal.tipo === 'danger' ? 'danger' : 'primary'}`}
                  onClick={() => setMensajeModal(null)}
                >
                  Aceptar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE Y CHAT EN DOS COLUMNAS */}
      {casoSeleccionado && (
        <div 
          className="modal show d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              
              {/* Cabecera del Modal */}
              <div className="modal-header py-2 px-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small fw-semibold">CASO</span>
                  <h5 className="fw-bold m-0 text-dark">#{casoSeleccionado.numero}</h5>
                  <span className={`badge rounded-pill px-3 py-1 ms-2 ${getEstadoBadge(casoSeleccionado.estado)}`}>
                    {casoSeleccionado.estado}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={() => setCasoSeleccionado(null)}
                ></button>
              </div>

              {/* Cuerpo del Modal (Dos Columnas) */}
              <div className="modal-body p-3 position-relative">

                {/* VENTANA FLOTANTE INTERNA PARA INSTRUMENTO */}
                {modoSeleccion === "instrumento" && (
                  <div 
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75"
                    style={{ zIndex: 1050, borderRadius: "0.3rem" }}
                  >
                    <div className="card shadow border p-3 bg-white w-75" style={{ maxWidth: "380px" }}>
                      <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                        <span className="fw-bold text-dark small">🛠️ Seleccionar Instrumento</span>
                        <button className="btn-close btn-sm" onClick={() => setModoSeleccion(null)}></button>
                      </div>

                      {!casoSeleccionado.cliente ? (
                        <div className="alert alert-warning small text-center py-2 mb-2">
                          ⚠️ Debe asignar un <strong>Cliente</strong> primero.
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            className="form-control form-control-sm mb-2"
                            placeholder="Descripción o N° de serie..."
                            value={busquedaFiltro}
                            onChange={(e) => setBusquedaFiltro(e.target.value)}
                            autoFocus
                          />
                          <div className="list-group overflow-y-auto mb-2 border rounded" style={{ maxHeight: "150px" }}>
                            {(() => {
                              const clienteIdCaso = casoSeleccionado.cliente._id || casoSeleccionado.cliente;
                              const instrumentosFiltrados = listaInstrumentos.filter(i => {
                                const clienteInstrId = i.cliente?._id || i.cliente;
                                const perteneceAlCliente = String(clienteInstrId) === String(clienteIdCaso);
                                const textoMatch = 
                                  (i.descripcion && i.descripcion.toLowerCase().includes(busquedaFiltro.toLowerCase())) ||
                                  (i.numeroSerie && i.numeroSerie.toLowerCase().includes(busquedaFiltro.toLowerCase()));
                                return perteneceAlCliente && textoMatch;
                              });

                              if (instrumentosFiltrados.length === 0) {
                                return <div className="text-center text-muted small py-3">No hay instrumentos registrados</div>;
                              }

                              return instrumentosFiltrados.map(instr => (
                                <button
                                  key={instr._id}
                                  className="list-group-item list-group-item-action small py-1"
                                  onClick={() => asignarInstrumentoSeleccionado(instr._id)}
                                >
                                  <i className="bi bi-tools me-2 text-secondary"></i>
                                  <strong>{instr.descripcion}</strong> {instr.numeroSerie ? `(S/N: ${instr.numeroSerie})` : ""}
                                </button>
                              ));
                            })()}
                          </div>
                        </>
                      )}

                      <div className="d-flex justify-content-end">
                        <button className="btn btn-secondary btn-sm px-3" onClick={() => setModoSeleccion(null)}>Cancelar</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* VENTANA FLOTANTE INTERNA PARA CLIENTE */}
                {modoSeleccion === "cliente" && (
                  <div 
                    className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75"
                    style={{ zIndex: 1050, borderRadius: "0.3rem" }}
                  >
                    <div className="card shadow border p-3 bg-white w-75" style={{ maxWidth: "380px" }}>
                      <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                        <span className="fw-bold text-dark small">👤 Seleccionar Cliente</span>
                        <button className="btn-close btn-sm" onClick={() => setModoSeleccion(null)}></button>
                      </div>

                      <input
                        type="text"
                        className="form-control form-control-sm mb-2"
                        placeholder="Buscar por nombre..."
                        value={busquedaFiltro}
                        onChange={(e) => setBusquedaFiltro(e.target.value)}
                        autoFocus
                      />
                      <div className="list-group overflow-y-auto mb-2 border rounded" style={{ maxHeight: "150px" }}>
                        {listaClientes
                          .filter(c => c.nombre?.toLowerCase().includes(busquedaFiltro.toLowerCase()))
                          .map(cli => (
                            <button
                              key={cli._id}
                              className="list-group-item list-group-item-action small py-1"
                              onClick={() => asignarClienteSeleccionado(cli._id)}
                            >
                              <i className="bi bi-person me-2 text-secondary"></i>
                              <strong>{cli.nombre}</strong>
                            </button>
                          ))}
                      </div>

                      <div className="d-flex justify-content-end">
                        <button className="btn btn-secondary btn-sm px-3" onClick={() => setModoSeleccion(null)}>Cancelar</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Layout Principal de Dos Columnas */}
                <div className="row g-3 align-items-stretch">
                  
                  {/* Columna Izquierda: Metadatos y Acciones */}
                  <div className="col-md-5 border-end pe-3 d-flex flex-column justify-content-between">
                    <div className="d-flex flex-column gap-2">
                      
                      <div>
                        <span className="text-muted small fw-bold" style={{ fontSize: "0.7rem" }}>REMITENTE:</span>
                        <div className="text-dark fw-semibold text-break small bg-light p-1 px-2 rounded border text-truncate" style={{ fontSize: "0.8rem" }}>
                          <i className="bi bi-envelope text-primary me-1"></i>
                          {casoSeleccionado.remitente || "—"}
                        </div>
                      </div>

                      <div>
                        <span className="text-muted small fw-bold" style={{ fontSize: "0.7rem" }}>ASUNTO:</span>
                        <div className="p-1 px-2 bg-light rounded border text-secondary small text-truncate" style={{ fontSize: "0.8rem" }}>
                          {casoSeleccionado.asunto}
                        </div>
                      </div>

                      <div className="row g-1">
                        <div className="col-6">
                          <span className="text-muted small fw-bold" style={{ fontSize: "0.7rem" }}>CLIENTE:</span>
                          <div className="text-dark small text-truncate bg-light p-1 px-2 rounded border" style={{ fontSize: "0.8rem" }}>
                            {casoSeleccionado.cliente?.nombre || <span className="text-muted fst-italic">Sin asignar</span>}
                          </div>
                        </div>
                        <div className="col-6">
                          <span className="text-muted small fw-bold" style={{ fontSize: "0.7rem" }}>INSTRUMENTO:</span>
                          <div className="text-dark small text-truncate bg-light p-1 px-2 rounded border" style={{ fontSize: "0.8rem" }}>
                            {casoSeleccionado.instrumento?.descripcion || <span className="text-muted fst-italic">Sin asignar</span>}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="form-label small text-muted fw-bold mb-1" style={{ fontSize: "0.7rem" }}>ESTADO:</label>
                        <select
                          className="form-select form-select-sm shadow-sm"
                          style={{ fontSize: "0.8rem" }}
                          value={casoSeleccionado.estado}
                          onChange={async (e) => {
                            const nuevoEstado = e.target.value;
                            setCasoSeleccionado({
                              ...casoSeleccionado,
                              estado: nuevoEstado,
                            });
                            await actualizarEstado(casoSeleccionado._id, nuevoEstado);
                          }}
                        >
                          <option value="Abierto">Abierto</option>
                          <option value="En Proceso">En Proceso</option>
                          <option value="Pendiente Cliente">Pendiente Cliente</option>
                          <option value="Cerrado">Cerrado</option>
                        </select>
                      </div>

                    </div>

                    {/* Acciones Rápidas abajo */}
                    <div className="mt-3 pt-2 border-top">
                      <label className="form-label small text-muted fw-bold mb-1" style={{ fontSize: "0.7rem" }}>ACCIONES:</label>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-outline-secondary btn-sm flex-grow-1 py-1 px-1"
                          title="Asignar Cliente"
                          onClick={abrirSelectorCliente}
                          style={{ fontSize: "0.75rem" }}
                        >
                          <i className="bi bi-person-plus"></i> Cliente
                        </button>

                        <button
                          className="btn btn-outline-secondary btn-sm flex-grow-1 py-1 px-1"
                          title="Asignar Instrumento/Equipo"
                          onClick={abrirSelectorInstrumento}
                          style={{ fontSize: "0.75rem" }}
                        >
                          <i className="bi bi-tools"></i> Equipo
                        </button>

                        <button
                          className="btn btn-outline-primary btn-sm flex-grow-1 py-1 px-1"
                          title="Crear Tarea desde este Caso"
                          onClick={() => {
                            setCasoATarea(casoSeleccionado);
                          }}
                          style={{ fontSize: "0.75rem" }}
                        >
                          <i className="bi bi-list-task"></i> Tarea
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Columna Derecha: Historial de Mensajes Estilo Chat + Input */}
                  <div className="col-md-7 ps-3 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center mb-1 flex-shrink-0">
                      <h6 className="fw-bold m-0 text-dark small" style={{ fontSize: "0.8rem" }}>
                        <i className="bi bi-chat-dots-fill me-1 text-primary"></i>
                        Conversación ({casoSeleccionado.mensajes?.length || 0})
                      </h6>
                    </div>

                    {/* Contenedor de Mensajes Compacto */}
                    <div
                      className="d-flex flex-column gap-2 mb-2 p-2 bg-light border rounded-2 overflow-y-auto flex-grow-1"
                      style={{ maxHeight: "220px", minHeight: "180px" }}
                    >
                      {casoSeleccionado.mensajes?.length === 0 ? (
                        <div className="text-center text-muted small my-auto py-3" style={{ fontSize: "0.8rem" }}>
                          <i className="bi bi-chat-square-text fs-4 d-block mb-1 opacity-50"></i>
                          Sin mensajes registrados.
                        </div>
                      ) : (
                        casoSeleccionado.mensajes.map((m, index) => {
                          const esMio = m.remitente === MY_EMAIL || m.remitente === import.meta.env.VITE_EMAIL_USER || m.esEnviadoPorSoporte;

                          return (
                            <div 
                              key={index} 
                              className={`d-flex flex-column p-2 rounded-2 shadow-sm ${
                                esMio 
                                  ? 'ms-auto bg-white border-start border-primary border-3 text-start w-95' 
                                  : 'me-auto bg-white border-start border-secondary border-3 text-start w-95'
                              }`}
                              style={{ maxWidth: "98%" }}
                            >
                              <div className="d-flex justify-content-between align-items-center mb-1 gap-2">
                                <span className="fw-bold text-dark text-truncate" style={{ fontSize: "0.7rem" }}>
                                  <i className={`bi ${esMio ? 'bi-headset text-primary' : 'bi-person-circle text-secondary'} me-1`}></i>
                                  {esMio ? 'Soporte Técnico (Tú)' : m.remitente}
                                </span>
                                <span className="text-muted flex-shrink-0" style={{ fontSize: "0.6rem" }}>
                                  {m.fecha ? new Date(m.fecha).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : ""}
                                </span>
                              </div>
                              <div className="text-secondary" style={{ whiteSpace: "pre-wrap", fontSize: "0.75rem", lineHeight: "1.3" }}>
                                {m.texto}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Formulario para Enviar Respuesta */}
                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const textarea = e.target.elements.respuestaTexto;
                        const textoRespuesta = textarea.value.trim();
                        
                        if (!textoRespuesta) return;

                        try {
                          setEnviandoRespuesta(true);
                          const token = localStorage.getItem("token");
                          const res = await fetch(`${API_URL}/casos/${casoSeleccionado._id}/responder`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ textoRespuesta }),
                          });

                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Error al enviar respuesta");

                          setCasoSeleccionado(data.caso);
                          textarea.value = "";
                          onRefresh?.();
                        } catch (error) {
                          console.error(error);
                          setMensajeModal({
                            titulo: "Error",
                            texto: "Hubo un error al enviar la respuesta al cliente",
                            tipo: "danger"
                          });
                        } finally {
                          setEnviandoRespuesta(false);
                        }
                      }}
                      className="mt-auto flex-shrink-0"
                    >
                      <div className="input-group input-group-sm shadow-sm">
                        <textarea
                          name="respuestaTexto"
                          className="form-control"
                          rows="2"
                          placeholder="Escribe una respuesta..."
                          style={{ resize: "none", fontSize: "0.8rem" }}
                          required
                          disabled={enviandoRespuesta}
                        ></textarea>
                        <button 
                          className="btn btn-primary px-3 d-flex align-items-center justify-content-center" 
                          type="submit" 
                          title="Enviar respuesta"
                          disabled={enviandoRespuesta}
                        >
                          {enviandoRespuesta ? (
                            <span className="spinner-border spinner-border-sm"></span>
                          ) : (
                            <i className="bi bi-send-fill"></i>
                          )}
                        </button>
                      </div>
                    </form>

                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}