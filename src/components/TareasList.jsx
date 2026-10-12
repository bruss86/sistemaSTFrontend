import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

export default function TareasList({
  tareas = [],
  onEdit,
  onDelete,
  onNew,
  onUpdateEstado,
}) {
  const [estadoFiltro, setEstadoFiltro] = useState("Pendiente");
  const [prioridadFiltro, setPrioridadFiltro] = useState("");
  const [responsableFiltro, setResponsableFiltro] = useState(""); 
  const [search, setSearch] = useState("");
  
  // Estados para el Modal de Calendario Mensual
  const [showCalendario, setShowCalendario] = useState(false);
  const [fechaActualCalendario, setFechaActualCalendario] = useState(new Date());
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );

  // =========================
  // HELPERS
  // =========================
  const getCliente = (t) => {
    const c = t?.cliente;
    if (!c) return "—";
    return typeof c === "object"
      ? c.nombre || c.codigoCliente || "—"
      : c;
  };

  const getInstrumentoTexto = (t) => {
    const i = t?.instrumento;
    if (!i) return "";
    return typeof i === "object"
      ? `${i.descripcion || ""} ${i.numeroSerie || ""}`
      : i;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "—";
    if (typeof fecha === "string") {
      const partes = fecha.split("T")[0].split("-");
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
      return fecha;
    }
    return new Date(fecha).toLocaleDateString("es-AR");
  };

  // =========================
  // FILTRO + ORDEN
  // =========================
  const filtradas = useMemo(() => {
    const prioridadOrder = { Urgente: 1, Alta: 2, Media: 3, Baja: 4 };
    const estadoOrder = { Pendiente: 1, "En proceso": 2, Finalizada: 99, Cancelada: 100 };

    return tareas
      .filter((t) => {
        if (estadoFiltro && t.estado !== estadoFiltro) return false;
        if (prioridadFiltro && t.prioridad !== prioridadFiltro) return false;
        if (responsableFiltro && t.responsable !== responsableFiltro) return false;

        const texto = `
          ${getCliente(t)}
          ${t.tarea || ""}
          ${t.responsable || ""}
          ${getInstrumentoTexto(t)}
        `.toLowerCase();

        if (search && !texto.includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const estadoA = estadoOrder[a.estado] ?? 50;
        const estadoB = estadoOrder[b.estado] ?? 50;
        if (estadoA !== estadoB) return estadoA - estadoB;

        const prioridadA = prioridadOrder[a.prioridad] ?? 999;
        const prioridadB = prioridadOrder[b.prioridad] ?? 999;
        if (prioridadA !== prioridadB) return prioridadA - prioridadB;

        return new Date(a.fecha || 0) - new Date(b.fecha || 0);
      });
  }, [tareas, estadoFiltro, prioridadFiltro, responsableFiltro, search]);

  // Tareas filtradas para la fecha seleccionada en el calendario
  const tareasPorFecha = useMemo(() => {
    if (!fechaSeleccionada) return [];
    return tareas.filter((t) => {
      if (!t.fecha) return false;
      const fechaT = typeof t.fecha === "string" 
        ? t.fecha.split("T")[0] 
        : new Date(t.fecha).toISOString().split("T")[0];
      return fechaT === fechaSeleccionada;
    });
  }, [tareas, fechaSeleccionada]);

  // =========================
  // LÓGICA DEL CALENDARIO MENSUAL
  // =========================
  const cambiarMes = (direccion) => {
    const nuevoMes = new Date(fechaActualCalendario);
    nuevoMes.setMonth(nuevoMes.getMonth() + direccion);
    setFechaActualCalendario(nuevoMes);
  };

  const irAHoy = () => {
    const hoy = new Date();
    setFechaActualCalendario(hoy);
    setFechaSeleccionada(hoy.toISOString().split("T")[0]);
  };

  const diasDelMes = useMemo(() => {
    const anio = fechaActualCalendario.getFullYear();
    const mes = fechaActualCalendario.getMonth();
    
    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);

    let diaSemanaInicio = primerDia.getDay(); 
    diaSemanaInicio = diaSemanaInicio === 0 ? 6 : diaSemanaInicio - 1;

    const dias = [];

    const ultimoDiaMesAnterior = new Date(anio, mes, 0).getDate();
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const d = new Date(anio, mes - 1, ultimoDiaMesAnterior - i);
      dias.push({ fecha: d, esMesActual: false });
    }

    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      const d = new Date(anio, mes, i);
      dias.push({ fecha: d, esMesActual: true });
    }

    const totalCeldas = Math.ceil(dias.length / 7) * 7;
    for (let i = 1; i <= (totalCeldas - dias.length); i++) {
      const d = new Date(anio, mes + 1, i);
      dias.push({ fecha: d, esMesActual: false });
    }

    return dias;
  }, [fechaActualCalendario]);

  const obtenerInfoTareasFecha = (fechaObj) => {
    const fechaStr = fechaObj.toISOString().split("T")[0];
    const tareasDelDia = tareas.filter((t) => {
      if (!t.fecha) return false;
      const fT = typeof t.fecha === "string" ? t.fecha.split("T")[0] : new Date(t.fecha).toISOString().split("T")[0];
      return fT === fechaStr;
    });

    if (tareasDelDia.length === 0) {
      return { total: 0, prioridadMaxima: null };
    }

    let tieneUrgente = false;
    let tieneAlta = false;
    let tieneMedia = false;

    tareasDelDia.forEach((t) => {
      if (t.prioridad === "Urgente") tieneUrgente = true;
      else if (t.prioridad === "Alta") tieneAlta = true;
      else if (t.prioridad === "Media") tieneMedia = true;
    });

    let prioridadMaxima = "Baja";
    if (tieneUrgente) prioridadMaxima = "Urgente";
    else if (tieneAlta) prioridadMaxima = "Alta";
    else if (tieneMedia) prioridadMaxima = "Media";

    return { total: tareasDelDia.length, prioridadMaxima };
  };

  const nombreMesAnio = useMemo(() => {
    return fechaActualCalendario.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });
  }, [fechaActualCalendario]);

  // =========================
  // BADGES & ESTILOS MODERNOS
  // =========================
  const badgePrioridadClase = (p) => {
    switch (p) {
      case "Urgente": return "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25";
      case "Alta": return "bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25";
      case "Media": return "bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25";
      case "Baja": return "bg-info bg-opacity-10 text-info border border-info border-opacity-25";
      default: return "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25";
    }
  };

  const badgeEstadoClase = (e) => {
    switch (e) {
      case "Pendiente": return "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25";
      case "En proceso": return "bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25";
      case "Finalizada": return "bg-success bg-opacity-10 text-success border border-success border-opacity-25";
      case "Cancelada": return "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25";
      default: return "bg-secondary bg-opacity-10 text-secondary";
    }
  };

  const borderPrioridadCard = (p) => {
    switch (p) {
      case "Urgente": return "border-danger";
      case "Alta": return "border-warning";
      case "Media": return "border-primary";
      case "Baja": return "border-info";
      default: return "border-secondary";
    }
  };

  // =========================
  // EXPORTAR A EXCEL
  // =========================
  const exportarExcel = () => {
    const datos = filtradas.map((t) => ({
      Fecha: formatearFecha(t.fecha),
      Cliente: getCliente(t),
      Tarea: t.tarea || "—",
      Estado: t.estado || "—",
      Responsable: t.responsable || "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tareas");
    XLSX.writeFile(workbook, "tareas.xlsx");
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="card p-3 shadow-sm border-0 rounded-3">
      
      {/* ================= HEADER ================= */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h5 className="m-0 text-dark fw-bold">
          📋 Listado de Tareas <span className="text-muted fs-6">({filtradas.length})</span>
        </h5>

        <div className="d-flex gap-2 flex-grow-1 justify-content-end flex-wrap">
          <input
            type="text"
            className="form-control"
            placeholder="🔎 Buscar tarea, cliente o instrumento..."
            style={{ maxWidth: 300, minWidth: 200 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            className="btn btn-outline-secondary d-flex align-items-center gap-1"
            onClick={exportarExcel}
            disabled={filtradas.length === 0}
            title="Exportar a Excel"
          >
            <i className="bi bi-file-earmark-excel"></i> Exportar
          </button>

          <button
            className="btn btn-success d-flex align-items-center gap-1 text-nowrap px-3"
            onClick={() => onNew?.()}
            title="Nueva Tarea"
          >
            <i className="bi bi-plus-circle"></i> Nuevo
          </button>
        </div>
      </div>

      {/* ================= FILTROS Y BOTÓN CALENDARIO ================= */}
      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center justify-content-between">
        <div className="d-flex gap-2 flex-wrap flex-grow-1">
          <select
            className="form-select"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            style={{ maxWidth: 200 }}
          >
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En proceso">En proceso</option>
            <option value="Finalizada">Finalizada</option>
            <option value="Cancelada">Cancelada</option>
          </select>

          <select
            className="form-select"
            value={prioridadFiltro}
            onChange={(e) => setPrioridadFiltro(e.target.value)}
            style={{ maxWidth: 200 }}
          >
            <option value="">Todas las prioridades</option>
            <option value="Urgente">Urgente</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>

          <select
            className="form-select"
            value={responsableFiltro}
            onChange={(e) => setResponsableFiltro(e.target.value)}
            style={{ maxWidth: 220 }}
          >
            <option value="">Todos los responsables</option>
            <option value="Vaccaro Sebastián">Vaccaro Sebastián</option>
            <option value="Correas Gustavo">Correas Gustavo</option>
            <option value="Orlandi Matías">Orlandi Matías</option>
            <option value="Gerbaudo Leandro">Gerbaudo Leandro</option>
          </select>
        </div>

        <button
          className="btn btn-outline-primary d-flex align-items-center gap-1 px-3 shadow-sm"
          onClick={() => setShowCalendario(true)}
          title="Ver Calendario Mensual"
        >
          <i className="bi bi-calendar3"></i> Calendario
        </button>
      </div>

      {/* ================= TABLA SIN SCROLL INTERNO ================= */}
      <div className="table-responsive border rounded-3 shadow-sm">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-dark text-nowrap">
            <tr>
              <th style={{ width: "12%" }} className="py-3">Fecha</th>
              <th style={{ width: "25%" }} className="py-3">Cliente</th>
              <th style={{ width: "25%" }} className="py-3">Instrumento</th>
              <th className="text-center py-3" style={{ width: "12%" }}>Estado</th>
              <th className="text-center py-3" style={{ width: "16%" }}>Responsable</th>
              <th className="text-center py-3" style={{ width: "10%" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-muted py-5">
                  <i className="bi bi-folder2-open fs-1 d-block mb-2 opacity-50"></i>
                  No se encontraron tareas registradas con los filtros actuales
                </td>
              </tr>
            ) : (
              filtradas.map((t) => {
                const finalizada = t.estado === "Finalizada";

                return (
                  <tr
                    key={t._id}
                    className={finalizada ? "opacity-50" : ""}
                  >
                    <td className="fw-semibold text-dark">{formatearFecha(t.fecha)}</td>
                    <td className="text-truncate fw-semibold text-dark" style={{ maxWidth: "220px" }} title={getCliente(t)}>
                      <i className="bi bi-building text-muted me-1"></i>
                      {getCliente(t)}
                    </td>
                    <td>
                      {t.instrumento ? (
                        typeof t.instrumento === "object" ? (
                          <div className="text-truncate" style={{ maxWidth: "250px" }} title={`${t.instrumento.descripcion || ""} - SN: ${t.instrumento.numeroSerie || ""}`}>
                            <span className="fw-semibold text-dark">{t.instrumento.descripcion || "Sin descripción"}</span>
                            <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                              SN: {t.instrumento.numeroSerie || "—"}
                            </div>
                          </div>
                        ) : (
                          t.instrumento
                        )
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-center">
                      <span className={`badge rounded-pill px-3 py-1 fw-semibold ${badgeEstadoClase(t.estado)}`} style={{ fontSize: "0.75rem" }}>
                        {t.estado}
                      </span>
                    </td>
                    
                    {/* FUENTE EN BLANCO EN EL BADGE DEL RESPONSABLE */}
                    <td className="text-center">
                      {t.responsable ? (
                        <span
                          className="badge rounded-pill bg-primary text-white px-2 py-1 shadow-sm"
                          title={t.responsable}
                          style={{ fontSize: "0.75rem" }}
                        >
                          <i className="bi bi-person-fill me-1"></i>
                          {t.responsable}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    <td className="text-center text-nowrap">
                      <div className="d-flex justify-content-center gap-1">
                        <button
                          className="btn btn-sm btn-light border text-primary shadow-sm"
                          title="Ver / Editar"
                          onClick={() => onEdit?.(t)}
                        >
                          <i className="bi bi-pencil-fill"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-light border text-danger shadow-sm"
                          title="Eliminar"
                          onClick={() => onDelete?.(t._id)}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= MODAL DE CALENDARIO MENSUAL ================= */}
      {showCalendario && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-calendar3 me-2"></i> Calendario de Tareas — <span className="text-capitalize">{nombreMesAnio}</span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCalendario(false)}
                ></button>
              </div>

              <div className="modal-body p-4">
                {/* LEYENDA DE PRIORIDADES */}
                <div className="d-flex gap-3 mb-3 justify-content-end align-items-center small">
                  <span className="fw-bold me-1 text-muted">Prioridades:</span>
                  <span className="d-flex align-items-center gap-1">
                    <span className="badge rounded-circle bg-danger p-1"> </span> Urgente
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <span className="badge rounded-circle bg-warning p-1"> </span> Alta
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <span className="badge rounded-circle bg-primary p-1"> </span> Media
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <span className="badge rounded-circle bg-info p-1"> </span> Baja
                  </span>
                </div>

                <div className="row g-3">
                  
                  {/* ZONA IZQUIERDA: Cuadrícula del Mes Completo */}
                  <div className="col-lg-7 border-end pe-lg-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => cambiarMes(-1)}
                      >
                        <i className="bi bi-chevron-left"></i> Anterior
                      </button>
                      
                      <div className="d-flex gap-2 align-items-center">
                        <button className="btn btn-sm btn-outline-dark px-3" onClick={irAHoy}>
                          Hoy
                        </button>
                        <span className="fw-bold text-capitalize fs-6 text-dark">{nombreMesAnio}</span>
                      </div>

                      <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => cambiarMes(1)}
                      >
                        Siguiente <i className="bi bi-chevron-right"></i>
                      </button>
                    </div>

                    <div className="row text-center fw-bold text-muted small bg-light py-2 rounded mb-2">
                      <div className="col">Lun</div>
                      <div className="col">Mar</div>
                      <div className="col">Mié</div>
                      <div className="col">Jue</div>
                      <div className="col">Vie</div>
                      <div className="col text-primary">Sáb</div>
                      <div className="col text-primary">Dom</div>
                    </div>

                    <div className="row g-1" style={{ minHeight: "320px" }}>
                      {diasDelMes.map((item, index) => {
                        const fechaStr = item.fecha.toISOString().split("T")[0];
                        const { total, prioridadMaxima } = obtenerInfoTareasFecha(item.fecha);
                        const esSeleccionado = fechaSeleccionada === fechaStr;

                        return (
                          <div className="col-12" style={{ width: "14.28%", height: "64px" }} key={index}>
                            <button
                              type="button"
                              onClick={() => setFechaSeleccionada(fechaStr)}
                              className={`w-100 h-100 p-1 d-flex flex-column justify-content-between align-items-center border rounded position-relative transition-all ${
                                esSeleccionado 
                                  ? "border-primary bg-primary bg-opacity-10 shadow-sm fw-bold" 
                                  : item.esMesActual 
                                    ? "bg-white text-dark border-light" 
                                    : "bg-light text-muted border-light opacity-50"
                              }`}
                              style={{ fontSize: "0.85rem" }}
                            >
                              <span>{item.fecha.getDate()}</span>
                              
                              {total > 0 && (
                                <span 
                                  className={`badge rounded-pill ${badgePrioridadClase(prioridadMaxima)}`} 
                                  style={{ fontSize: "0.6rem" }}
                                  title={`Máxima prioridad: ${prioridadMaxima}`}
                                >
                                  {total}
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ZONA DERECHA: Lista de Tareas del Día Seleccionado */}
                  <div className="col-lg-5 d-flex flex-column ps-lg-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold m-0 text-dark">
                        📅 {formatearFecha(fechaSeleccionada)}
                      </h6>
                      <span className="badge bg-secondary rounded-pill">
                        {tareasPorFecha.length} {tareasPorFecha.length === 1 ? "tarea" : "tareas"}
                      </span>
                    </div>

                    <div style={{ maxHeight: "360px", overflowY: "auto" }} className="d-flex flex-column gap-2 pe-1">
                      {tareasPorFecha.length === 0 ? (
                        <div className="text-center text-muted py-5 my-auto">
                          <i className="bi bi-calendar-x fs-1 d-block mb-2 opacity-50"></i>
                          No hay tareas registradas para este día
                        </div>
                      ) : (
                        tareasPorFecha.map((t) => (
                          <div 
                            key={t._id} 
                            className={`card p-3 shadow-sm border-0 border-start border-4 ${borderPrioridadCard(t.prioridad)} bg-white rounded-3`}
                          >
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fw-bold small text-dark text-truncate" style={{ maxWidth: "60%" }}>
                                <i className="bi bi-building text-muted me-1"></i> {getCliente(t)}
                              </span>
                              
                              <div className="d-flex gap-1">
                                <span className={`badge rounded-pill ${badgePrioridadClase(t.prioridad)}`} style={{ fontSize: "0.65rem" }}>
                                  {t.prioridad || "Baja"}
                                </span>
                                <span className={`badge rounded-pill ${badgeEstadoClase(t.estado)}`} style={{ fontSize: "0.65rem" }}>
                                  {t.estado}
                                </span>
                              </div>
                            </div>
                            
                            <p className="mb-2 small text-secondary">{t.tarea || "Sin descripción de tarea"}</p>
                            
                            <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-1">
                              <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                                Resp: <b className="text-dark">{t.responsable || "—"}</b>
                              </span>

                              {/* ACCIONES DIRECTAS */}
                              <div className="d-flex gap-1">
                                {onUpdateEstado && t.estado !== "Finalizada" && (
                                  <button
                                    className="btn btn-sm btn-outline-success py-0 px-2"
                                    style={{ fontSize: "0.75rem" }}
                                    title="Marcar como Finalizada"
                                    onClick={() => onUpdateEstado(t._id, "Finalizada")}
                                  >
                                    <i className="bi bi-check-lg"></i> Finalizar
                                  </button>
                                )}

                                <button
                                  className="btn btn-sm btn-light border text-primary shadow-sm p-1"
                                  title="Editar Tarea"
                                  onClick={() => {
                                    setShowCalendario(false);
                                    onEdit?.(t);
                                  }}
                                >
                                  <i className="bi bi-pencil-fill" style={{ fontSize: "0.75rem" }}></i>
                                </button>

                                <button
                                  className="btn btn-sm btn-light border text-danger shadow-sm p-1"
                                  title="Eliminar Tarea"
                                  onClick={() => onDelete?.(t._id)}
                                >
                                  <i className="bi bi-trash-fill" style={{ fontSize: "0.75rem" }}></i>
                                </button>
                              </div>
                            </div>

                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>

              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary px-4"
                  onClick={() => setShowCalendario(false)}
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}