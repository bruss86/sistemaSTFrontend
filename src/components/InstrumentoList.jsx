import { useEffect, useState, useMemo } from "react";
import "../styles/InstrumentoList.css";

export default function InstrumentoList({ 
  instrumentos = [], 
  onNew, 
  onEdit, 
  onDelete, 
  onNavigateToMantenimientos // <-- Nueva prop para navegar
}) {
  const [search, setSearch] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [instrumentoAEliminar, setInstrumentoAEliminar] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // PAGINACIÓN
  const [pagina, setPagina] = useState(1);
  const porPagina = 8;

  const getEstado = (fecha) => {
    if (!fecha) return "sin";

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const base = new Date(fecha.includes("T") ? fecha : fecha + "T00:00:00");
    const venc = new Date(base);
    venc.setFullYear(venc.getFullYear() + 1);

    const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));

    if (diff < 0) return "vencido";
    if (diff <= 30) return "proximo";
    return "ok";
  };

  const prioridadEstado = {
    vencido: 0,
    proximo: 1,
    ok: 2,
    sin: 3,
  };

  const conteoEstados = useMemo(() => {
    let vigentes = 0;
    let proximos = 0;
    let vencidos = 0;

    instrumentos.forEach((i) => {
      const est = getEstado(i.fechaUltimoMantenimiento);
      if (est === "ok") vigentes++;
      if (est === "proximo") proximos++;
      if (est === "vencido") vencidos++;
    });

    return { total: instrumentos.length, vigentes, proximos, vencidos };
  }, [instrumentos]);

  const filtrados = useMemo(() => {
    const t = search.toLowerCase().trim();

    return instrumentos
      .filter((i) => {
        const clienteNombre = i.cliente?.nombre?.toLowerCase() || "";

        const coincideBusqueda =
          !t ||
          i.numeroSerie?.toLowerCase().includes(t) ||
          i.numeroPartida?.toLowerCase().includes(t) ||
          i.descripcion?.toLowerCase().includes(t) ||
          clienteNombre.includes(t);

        const estado = getEstado(i.fechaUltimoMantenimiento);
        const coincideEstado = filtroEstado === "todos" || estado === filtroEstado;

        return coincideBusqueda && coincideEstado;
      })
      .sort((a, b) => 
        prioridadEstado[getEstado(a.fechaUltimoMantenimiento)] -
        prioridadEstado[getEstado(b.fechaUltimoMantenimiento)]
      );
  }, [search, instrumentos, filtroEstado]);

  useEffect(() => {
    setPagina(1);
  }, [search, filtroEstado]);

  const totalPaginas = Math.ceil(filtrados.length / porPagina);

  useEffect(() => {
    if (pagina > totalPaginas && totalPaginas > 0) {
      setPagina(totalPaginas);
    }
  }, [pagina, totalPaginas]);

  const instrumentosPaginados = useMemo(() => {
    const start = (pagina - 1) * porPagina;
    return filtrados.slice(start, start + porPagina);
  }, [filtrados, pagina]);

  const getInfoMantenimiento = (fecha) => {
    if (!fecha) {
      return {
        badgeClass: "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25",
        icono: <i className="bi bi-dash-circle me-1"></i>,
        fecha: "—",
        texto: "Sin registro",
      };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const base = new Date(fecha.includes("T") ? fecha : fecha + "T00:00:00");
    const venc = new Date(base);
    venc.setFullYear(venc.getFullYear() + 1);

    const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));

    let badgeClass = "bg-success bg-opacity-10 text-success border border-success border-opacity-25";
    let icono = <i className="bi bi-check-circle-fill me-1"></i>;
    let texto = `Vence en ${diff} días`;

    if (diff < 0) {
      badgeClass = "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25";
      icono = <i className="bi bi-exclamation-triangle-fill me-1"></i>;
      texto = `Vencido hace ${Math.abs(diff)} días`;
    } else if (diff <= 30) {
      badgeClass = "bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25";
      icono = <i className="bi bi-clock-fill me-1"></i>;
      texto = `Vence en ${diff} días`;
    }

    return {
      badgeClass,
      icono,
      fecha: base.toLocaleDateString("es-AR"),
      texto,
    };
  };

  return (
    <div className="container-fluid p-0">
      
      {/* TARJETAS DE RESUMEN / KPIS */}
      <div className="row g-2 mb-3">
        <div className="col-6 col-md-3">
          <div 
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 ${filtroEstado === 'todos' ? 'border-start border-4 border-primary' : ''}`}
            onClick={() => setFiltroEstado("todos")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-muted small fw-semibold">Total Instrumentos</span>
            <span className="fs-4 fw-bold text-dark">{conteoEstados.total}</span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div 
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 ${filtroEstado === 'ok' ? 'border-start border-4 border-success' : ''}`}
            onClick={() => setFiltroEstado("ok")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-success small fw-semibold">Vigentes</span>
            <span className="fs-4 fw-bold text-success">{conteoEstados.vigentes}</span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div 
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 ${filtroEstado === 'proximo' ? 'border-start border-4 border-warning' : ''}`}
            onClick={() => setFiltroEstado("proximo")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-warning small fw-semibold">Vencen en 30 días</span>
            <span className="fs-4 fw-bold text-warning">{conteoEstados.proximos}</span>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div 
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 ${filtroEstado === 'vencido' ? 'border-start border-4 border-danger' : ''}`}
            onClick={() => setFiltroEstado("vencido")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-danger small fw-semibold">Vencidos</span>
            <span className="fs-4 fw-bold text-danger">{conteoEstados.vencidos}</span>
          </div>
        </div>
      </div>

      <div className="card p-3 shadow-sm border-0 rounded-3">
        
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="m-0 text-dark fw-bold">
            🛠️ Listado de Instrumentos <span className="text-muted fs-6">({filtrados.length})</span>
          </h5>

          <div className="d-flex gap-2 flex-grow-1 justify-content-end flex-wrap">
            <input
              className="form-control"
              placeholder="🔎 Buscar serie, partida, descripción..."
              style={{ maxWidth: "260px", minWidth: "180px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="form-select"
              style={{ maxWidth: "180px" }}
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="ok">Vigentes</option>
              <option value="proximo">Vencen en 30 días</option>
              <option value="vencido">Vencidos</option>
            </select>

            {/* BOTÓN PARA IR A MANTENIMIENTOS */}
            <button 
              className="btn btn-outline-primary d-flex align-items-center gap-1 text-nowrap px-3" 
              onClick={() => onNavigateToMantenimientos?.()}
              title="Ir a Control de Mantenimientos"
            >
              <i className="bi bi-tools"></i> Mantenimientos
            </button>

            <button 
              className="btn btn-success d-flex align-items-center gap-1 text-nowrap px-3" 
              onClick={onNew}
              title="Agregar nuevo instrumento"
            >
              <i className="bi bi-plus-circle"></i> Nuevo
            </button>
          </div>
        </div>

        {/* TABLA */}
        <div className="table-responsive border rounded-3 overflow-hidden">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark text-nowrap">
              <tr>
                <th style={{ width: "15%" }} className="py-3">Serie</th>
                <th style={{ width: "12%" }} className="py-3">Partida</th>
                <th style={{ width: "25%" }} className="py-3">Descripción</th>
                <th style={{ width: "18%" }} className="py-3">Cliente</th>
                <th style={{ width: "20%" }} className="py-3">Último Mantenimiento</th>
                <th className="text-center py-3" style={{ width: "10%" }}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-5">
                    <i className="bi bi-folder2-open fs-1 d-block mb-2 opacity-50"></i>
                    No se encontraron instrumentos registrados con los filtros actuales
                  </td>
                </tr>
              ) : (
                instrumentosPaginados.map((i) => {
                  const info = getInfoMantenimiento(i.fechaUltimoMantenimiento);

                  return (
                    <tr key={i._id} className="transition-all">
                      <td className="fw-bold text-dark text-truncate" style={{ maxWidth: "150px" }} title={i.numeroSerie}>
                        {i.numeroSerie}
                      </td>
                      <td className="text-muted text-truncate" style={{ maxWidth: "120px" }} title={i.numeroPartida || "—"}>
                        {i.numeroPartida || "—"}
                      </td>
                      <td className="text-truncate text-secondary" style={{ maxWidth: "250px" }} title={i.descripcion}>
                        {i.descripcion}
                      </td>
                      <td className="text-truncate fw-semibold text-dark" style={{ maxWidth: "180px" }} title={i.cliente?.nombre || "Sin cliente"}>
                        <i className="bi bi-building text-muted me-1"></i>
                        {i.cliente?.nombre || "Sin cliente"}
                      </td>
                      <td>
                        <span className={`badge ${info.badgeClass} px-2 py-1 rounded-pill d-inline-flex align-items-center fw-normal`} style={{ fontSize: "0.8rem" }}>
                          {info.icono} 
                          <span className="ms-1 fw-semibold">{info.fecha}</span>
                        </span>
                        <div className="text-muted mt-1" style={{ fontSize: "0.7rem" }}>
                          {info.texto}
                        </div>
                      </td>
                      <td className="text-center text-nowrap">
                        <div className="d-flex justify-content-center gap-1">
                          <button
                            className="btn btn-sm btn-light border text-primary shadow-sm"
                            title="Editar"
                            onClick={() => onEdit(i)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-light border text-danger shadow-sm"
                            title="Eliminar"
                            onClick={() => {
                              setInstrumentoAEliminar(i);
                              setShowDeleteModal(true);
                            }}
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

        {/* PAGINACIÓN */}
        {totalPaginas > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
            <span className="small text-muted">
              Mostrando instrumentos del {(pagina - 1) * porPagina + 1} al {Math.min(pagina * porPagina, filtrados.length)} de {filtrados.length}
            </span>

            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={pagina === 1}
                onClick={() => setPagina((p) => p - 1)}
              >
                ← Anterior
              </button>

              <span className="small fw-semibold text-dark px-2">
                Página {pagina} de {totalPaginas}
              </span>

              <button
                className="btn btn-outline-secondary btn-sm"
                disabled={pagina === totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* MODAL ELIMINAR */}
        {showDeleteModal && (
          <>
            <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow">
                  <div className="modal-header bg-danger text-white">
                    <h5 className="modal-title fw-bold">⚠️ Confirmar Eliminación</h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => {
                        setShowDeleteModal(false);
                        setInstrumentoAEliminar(null);
                      }}
                    />
                  </div>

                  <div className="modal-body py-4">
                    <p className="mb-0">
                      ¿Está seguro de querer eliminar el instrumento con número de serie{" "}
                      <strong>{instrumentoAEliminar?.numeroSerie}</strong>? Esta acción no se puede deshacer.
                    </p>
                  </div>

                  <div className="modal-footer bg-light">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowDeleteModal(false);
                        setInstrumentoAEliminar(null);
                      }}
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        onDelete(instrumentoAEliminar._id);
                        setShowDeleteModal(false);
                        setInstrumentoAEliminar(null);
                      }}
                    >
                      Sí, Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-backdrop fade show"></div>
          </>
        )}
      </div>
    </div>
  );
}