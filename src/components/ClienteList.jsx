import { useEffect, useState, useMemo } from "react";
import "../styles/ClienteList.css";

import Modal from "./Modal";
import ClienteInstrumentos from "./ClienteInstrumentos";
import ClienteForm from "./ClienteForm";

export default function ClienteList({
  clientes = [],
  instrumentos = [],
  onDelete,
  onRefresh,
}) {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [ordenAsc, setOrdenAsc] = useState(true);

  const [selected, setSelected] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Modal cliente
  const [showForm, setShowForm] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [clienteDelete, setClienteDelete] = useState(null);

  // Paginación
  const [pagina, setPagina] = useState(1);
  const porPagina = 8;

  // ======================================================
  // REINICIAR PAGINACIÓN
  // ======================================================
  useEffect(() => {
    setPagina(1);
  }, [search, filtroEstado]);

  // ======================================================
  // ESTADÍSTICAS DE CLIENTES
  // ======================================================
  const estadisticasClientes = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const stats = {};

    instrumentos.forEach((i) => {
      const id = i?.cliente?._id;
      if (!id) return;

      if (!stats[id]) {
        stats[id] = {
          cantidad: 0,
          vencidos: 0,
          sinMantenimiento: 0,
        };
      }

      stats[id].cantidad++;

      // Sin mantenimiento
      if (!i.fechaUltimoMantenimiento) {
        stats[id].sinMantenimiento++;
        return;
      }

      const fecha = new Date(i.fechaUltimoMantenimiento.includes("T") ? i.fechaUltimoMantenimiento : i.fechaUltimoMantenimiento + "T00:00:00");
      if (isNaN(fecha.getTime())) {
        stats[id].sinMantenimiento++;
        return;
      }

      const vencimiento = new Date(fecha);
      vencimiento.setFullYear(vencimiento.getFullYear() + 1);

      if (vencimiento < hoy) {
        stats[id].vencidos++;
      }
    });

    // Determinar estado
    Object.values(stats).forEach((s) => {
      if (s.sinMantenimiento === s.cantidad) {
        s.estado = "sin-mantenimiento";
      } else if (s.vencidos >= 2) {
        s.estado = "critico";
      } else if (s.vencidos === 1) {
        s.estado = "alerta";
      } else {
        s.estado = "ok";
      }
    });

    return stats;
  }, [instrumentos]);

  // ======================================================
  // RESUMEN DE CLIENTES
  // ======================================================
  const resumenClientes = useMemo(() => {
    const resumen = {
      total: clientes.length,
      ok: 0,
      alerta: 0,
      critico: 0,
      sinMantenimiento: 0,
    };

    clientes.forEach((c) => {
      const estado = estadisticasClientes[c._id]?.estado || "ok";
      if (estado === "sin-mantenimiento") {
        resumen.sinMantenimiento++;
      } else {
        resumen[estado]++;
      }
    });

    return resumen;
  }, [clientes, estadisticasClientes]);

  // ======================================================
  // FILTRADO + ORDEN
  // ======================================================
  const filtrados = useMemo(() => {
    const t = search.toLowerCase().trim();

    let resultado = clientes.filter((c) => {
      const coincideBusqueda =
        c?.nombre?.toLowerCase().includes(t) ||
        c?.codigoCliente?.toLowerCase().includes(t);

      if (!coincideBusqueda) return false;
      if (filtroEstado === "todos") return true;

      const estado = estadisticasClientes[c._id]?.estado || "ok";
      return estado === filtroEstado;
    });

    resultado.sort((a, b) => {
      const A = a?.nombre?.toLowerCase() || "";
      const B = b?.nombre?.toLowerCase() || "";
      return ordenAsc ? A.localeCompare(B) : B.localeCompare(A);
    });

    return resultado;
  }, [clientes, search, filtroEstado, ordenAsc, estadisticasClientes]);

  // ======================================================
  // PAGINACIÓN
  // ======================================================
  const totalPaginas = Math.ceil(filtrados.length / porPagina);

  useEffect(() => {
    if (pagina > totalPaginas && totalPaginas > 0) {
      setPagina(totalPaginas);
    }
  }, [pagina, totalPaginas]);

  const clientesPaginados = useMemo(() => {
    const inicio = (pagina - 1) * porPagina;
    return filtrados.slice(inicio, inicio + porPagina);
  }, [filtrados, pagina]);

  // ======================================================
  // RENDER
  // ======================================================
  return (
    <div className="container-fluid p-0">

      {/* ================================================== */}
      {/* TARJETAS DE RESUMEN / KPIS CLICKEABLES             */}
      {/* ================================================== */}
      <div className="row g-2 mb-3">
        <div className="col">
          <div 
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 ${filtroEstado === 'todos' ? 'border-start border-4 border-primary' : ''}`}
            onClick={() => setFiltroEstado("todos")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-muted small fw-semibold">Total Clientes</span>
            <span className="fs-4 fw-bold text-dark">{resumenClientes.total}</span>
          </div>
        </div>
        <div className="col">
          <div 
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 ${filtroEstado === 'ok' ? 'border-start border-4 border-success' : ''}`}
            onClick={() => setFiltroEstado("ok")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-success small fw-semibold">OK</span>
            <span className="fs-4 fw-bold text-success">{resumenClientes.ok}</span>
          </div>
        </div>
        <div className="col">
          <div 
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 ${filtroEstado === 'alerta' ? 'border-start border-4 border-warning' : ''}`}
            onClick={() => setFiltroEstado("alerta")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-warning small fw-semibold">Alertas</span>
            <span className="fs-4 fw-bold text-warning">{resumenClientes.alerta}</span>
          </div>
        </div>
        <div className="col">
          <div 
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 ${filtroEstado === 'critico' ? 'border-start border-4 border-danger' : ''}`}
            onClick={() => setFiltroEstado("critico")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-danger small fw-semibold">Críticos</span>
            <span className="fs-4 fw-bold text-danger">{resumenClientes.critico}</span>
          </div>
        </div>
        <div className="col">
          <div 
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 ${filtroEstado === 'sin-mantenimiento' ? 'border-start border-4 border-secondary' : ''}`}
            onClick={() => setFiltroEstado("sin-mantenimiento")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-secondary small fw-semibold">Sin Mant.</span>
            <span className="fs-4 fw-bold text-secondary">{resumenClientes.sinMantenimiento}</span>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* TARJETA PRINCIPAL Y BARRA DE BÚSQUEDA              */}
      {/* ================================================== */}
      <div className="card p-3 shadow-sm border-0 rounded-3">

        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="m-0 text-dark fw-bold">
            🏢 Listado de Clientes <span className="text-muted fs-6">({filtrados.length})</span>
          </h5>

          <div className="d-flex gap-2 flex-grow-1 justify-content-end flex-wrap">
            <input
              className="form-control"
              placeholder="🔎 Buscar por nombre o código..."
              style={{ maxWidth: "300px", minWidth: "200px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              className="btn btn-outline-secondary d-flex align-items-center"
              onClick={() => setOrdenAsc((p) => !p)}
              title={ordenAsc ? "Orden Z-A" : "Orden A-Z"}
            >
              {ordenAsc ? <i className="bi bi-sort-alpha-down"></i> : <i className="bi bi-sort-alpha-down-alt"></i>}
            </button>

            <button
              className="btn btn-success d-flex align-items-center gap-1 text-nowrap px-3"
              onClick={() => {
                setClienteEditando(null);
                setShowForm(true);
              }}
              title="Nuevo cliente"
            >
              <i className="bi bi-plus-circle"></i> Nuevo
            </button>
          </div>
        </div>

        {/* TABLA MODERNA Y FLUIDA */}
        <div className="table-responsive border rounded-3 overflow-hidden">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark text-nowrap">
              <tr>
                <th style={{ width: "40%" }} className="py-3">Nombre</th>
                <th style={{ width: "20%" }} className="py-3">Código</th>
                <th className="text-center py-3" style={{ width: "15%" }}>Estado</th>
                <th className="text-center py-3" style={{ width: "15%" }}>Instrumentos</th>
                <th className="text-center py-3" style={{ width: "10%" }}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-5">
                    <i className="bi bi-folder2-open fs-1 d-block mb-2 opacity-50"></i>
                    No se encontraron clientes registrados con los filtros actuales
                  </td>
                </tr>
              ) : (
                clientesPaginados.map((c) => {
                  const stats = estadisticasClientes[c._id] || {
                    cantidad: 0,
                    vencidos: 0,
                    sinMantenimiento: 0,
                    estado: "ok",
                  };

                  const { cantidad: cant, vencidos, estado } = stats;

                  return (
                    <tr key={c._id}>
                      {/* NOMBRE */}
                      <td className="fw-bold text-dark text-truncate" style={{ maxWidth: "250px" }} title={c.nombre}>
                        <i className="bi bi-building text-muted me-2"></i>
                        {c.nombre}
                      </td>

                      {/* CÓDIGO */}
                      <td className="text-muted text-truncate" style={{ maxWidth: "150px" }} title={c.codigoCliente || "—"}>
                        {c.codigoCliente || "—"}
                      </td>

                      {/* ESTADO */}
                      <td className="text-center">
                        <span
                          className={`badge rounded-pill px-3 py-2 fw-semibold ${
                            estado === "critico"
                              ? "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25"
                              : estado === "alerta"
                              ? "bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25"
                              : estado === "sin-mantenimiento"
                              ? "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25"
                              : "bg-success bg-opacity-10 text-success border border-success border-opacity-25"
                          }`}
                          style={{ fontSize: "0.75rem" }}
                        >
                          {estado === "sin-mantenimiento" ? "SIN MANT." : estado.toUpperCase()}
                          {(estado === "critico" || estado === "alerta") && ` (${vencidos})`}
                        </span>
                      </td>

                      {/* INSTRUMENTOS */}
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-light border text-primary shadow-sm position-relative px-3"
                          onClick={() => setSelected(c)}
                          title="Ver instrumentos"
                        >
                          <i className="bi bi-tools me-1"></i> Ver
                          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">
                            {cant}
                          </span>
                        </button>
                      </td>

                      {/* ACCIONES */}
                      <td className="text-center text-nowrap">
                        <div className="d-flex justify-content-center gap-1">
                          <button
                            className="btn btn-sm btn-light border text-primary shadow-sm"
                            title="Editar cliente"
                            onClick={() => {
                              setClienteEditando(c);
                              setShowForm(true);
                            }}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>

                          <button
                            className="btn btn-sm btn-light border text-danger shadow-sm"
                            title="Eliminar cliente"
                            onClick={() => {
                              setClienteDelete(c);
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

        {/* ================================================== */}
        {/* PAGINACIÓN                                         */}
        {/* ================================================== */}
        {totalPaginas > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
            <span className="small text-muted">
              Mostrando clientes del {(pagina - 1) * porPagina + 1} al {Math.min(pagina * porPagina, filtrados.length)} de {filtrados.length}
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

        {/* ================================================== */}
        {/* MODAL INSTRUMENTOS                                 */}
        {/* ================================================== */}
        {selected && (
          <Modal onClose={() => setSelected(null)}>
            <ClienteInstrumentos cliente={selected} />
          </Modal>
        )}

        {/* ================================================== */}
        {/* MODAL CLIENTE FORM                                 */}
        {/* ================================================== */}
        {showForm && (
          <Modal
            onClose={() => {
              setShowForm(false);
              setClienteEditando(null);
            }}
          >
            <ClienteForm
              clienteEditando={clienteEditando}
              onClienteCreado={async () => {
                onRefresh?.();
                setShowForm(false);
                setClienteEditando(null);
              }}
              onClienteGuardado={() => {
                onRefresh?.();
                setShowForm(false);
                setClienteEditando(null);
              }}
            />
          </Modal>
        )}

        {/* ================================================== */}
        {/* MODAL ELIMINAR                                     */}
        {/* ================================================== */}
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
                        setClienteDelete(null);
                      }}
                    />
                  </div>

                  <div className="modal-body py-4">
                    <p className="mb-0">
                      ¿Está seguro de querer eliminar el cliente con código{" "}
                      <strong>{clienteDelete?.codigoCliente}</strong> ({clienteDelete?.nombre})? Esta acción no se puede deshacer.
                    </p>
                  </div>

                  <div className="modal-footer bg-light">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowDeleteModal(false);
                        setClienteDelete(null);
                      }}
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        onDelete(clienteDelete._id);
                        setShowDeleteModal(false);
                        setClienteDelete(null);
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