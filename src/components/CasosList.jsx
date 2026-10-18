import { useState, useMemo, useEffect } from "react";
import Modal from "./Modal";

export default function CasosList({ casos = [], onRefresh }) {
  const API_URL = import.meta.env.VITE_API_URL;

  const [casoSeleccionado, setCasoSeleccionado] = useState(null);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Ordenamiento
  const [sortField, setSortField] = useState("fechaCreacion");
  const [sortDirection, setSortDirection] = useState("desc");

  // =========================================================
  // ACTUALIZAR ESTADO DEL CASO
  // =========================================================
  const actualizarEstado = async (id, estado) => {
    try {
      const token = localStorage.getItem("token");

      await fetch(`${API_URL}/casos/${id}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado }),
      });

      onRefresh?.();
    } catch (error) {
      console.error(error);
      alert("Error actualizando estado");
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
        {/* CABECERA Y BÚSQUEDA */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="m-0 text-dark fw-bold">
            📥 Gestión de Casos / Tickets{" "}
            <span className="text-muted fs-6">({filteredCasos.length})</span>
          </h5>

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
                <th style={{ width: "25%" }} className="py-3">Asunto</th>
                <th style={{ width: "8%" }} className="text-center py-3">Msjs</th>
                <th style={{ width: "6%" }} className="text-center py-3">Acciones</th>
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
                    onDoubleClick={() => setCasoSeleccionado(c)}
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
                      <button
                        className="btn btn-sm btn-light border text-primary shadow-sm"
                        title="Ver detalle del caso"
                        onClick={() => setCasoSeleccionado(c)}
                      >
                        <i className="bi bi-eye-fill"></i>
                      </button>
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

      {/* MODAL DETALLE Y CHAT DEL CASO */}
      {casoSeleccionado && (
        <Modal onClose={() => setCasoSeleccionado(null)}>
          <div className="p-2">
            <div className="d-flex justify-content-between align-items-start mb-3 border-bottom pb-2">
              <div>
                <h5 className="fw-bold m-0 text-dark">
                  Caso #{casoSeleccionado.numero}
                </h5>
                <span className="text-muted small">
                  Remitente: <b>{casoSeleccionado.remitente}</b>
                </span>
              </div>
              <span className={`badge rounded-pill px-3 py-1 ${getEstadoBadge(casoSeleccionado.estado)}`}>
                {casoSeleccionado.estado}
              </span>
            </div>

            <div className="mb-3">
              <p className="mb-1 text-muted small fw-bold">ASUNTO:</p>
              <div className="p-2 bg-light rounded border text-dark fw-semibold">
                {casoSeleccionado.asunto}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small text-muted fw-bold">CAMBIAR ESTADO DEL CASO:</label>
              <select
                className="form-select"
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

            <hr />

            <h6 className="fw-bold mb-3 text-dark">
              <i className="bi bi-chat-left-dots me-2 text-primary"></i>
              Historial de Mensajes
            </h6>

            <div
              className="d-flex flex-column gap-2 mb-3 pe-1"
              style={{ maxHeight: "250px", overflowY: "auto" }}
            >
              {casoSeleccionado.mensajes?.length === 0 ? (
                <p className="text-center text-muted small py-3">
                  Sin mensajes registrados en este caso.
                </p>
              ) : (
                casoSeleccionado.mensajes.map((m, index) => (
                  <div key={index} className="card border-0 shadow-sm bg-light rounded-3 p-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold text-dark small">
                        <i className="bi bi-person-circle me-1 text-secondary"></i>
                        {m.remitente}
                      </span>
                      <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                        {m.fecha ? new Date(m.fecha).toLocaleString("es-AR") : ""}
                      </span>
                    </div>
                    <div className="text-secondary small">{m.texto}</div>
                  </div>
                ))
              )}
            </div>

            <div className="d-flex justify-content-end border-top pt-2">
              <button
                className="btn btn-secondary btn-sm px-4"
                onClick={() => setCasoSeleccionado(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}