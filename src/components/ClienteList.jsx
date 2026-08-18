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

      const fecha = new Date(i.fechaUltimoMantenimiento);

      if (isNaN(fecha.getTime())) {
        stats[id].sinMantenimiento++;
        return;
      }

      const vencimiento = new Date(fecha);

      vencimiento.setFullYear(
        vencimiento.getFullYear() + 1
      );

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
      const estado =
        estadisticasClientes[c._id]?.estado || "ok";

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

      if (filtroEstado === "todos") {
        return true;
      }

      const estado =
        estadisticasClientes[c._id]?.estado || "ok";

      return estado === filtroEstado;
    });

    resultado.sort((a, b) => {
      const A = a?.nombre?.toLowerCase() || "";
      const B = b?.nombre?.toLowerCase() || "";

      return ordenAsc
        ? A.localeCompare(B)
        : B.localeCompare(A);
    });

    return resultado;
  }, [
    clientes,
    search,
    filtroEstado,
    ordenAsc,
    estadisticasClientes,
  ]);

  // ======================================================
  // PAGINACIÓN
  // ======================================================

  const totalPaginas = Math.ceil(
    filtrados.length / porPagina
  );

  const clientesPaginados = useMemo(() => {
    const inicio = (pagina - 1) * porPagina;

    return filtrados.slice(
      inicio,
      inicio + porPagina
    );
  }, [filtrados, pagina]);

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="card p-3 shadow-sm">

      {/* ==================================================
          RESUMEN DE CLIENTES
      ================================================== */}

      <div className="d-flex flex-wrap justify-content-center gap-2 mb-3">

        {/* TODOS */}
        <button
          className={`btn ${
            filtroEstado === "todos"
              ? "btn-primary"
              : "btn-light border"
          }`}
          onClick={() => setFiltroEstado("todos")}
        >
          <i className="bi bi-people me-1"></i>
          <strong>{resumenClientes.total}</strong> clientes
        </button>

        {/* OK */}
        <button
          className={`btn ${
            filtroEstado === "ok"
              ? "btn-success"
              : "btn-outline-success"
          }`}
          onClick={() => setFiltroEstado("ok")}
        >
          <i className="bi bi-check-circle me-1"></i>
          {resumenClientes.ok} OK
        </button>

        {/* ALERTA */}
        <button
          className={`btn ${
            filtroEstado === "alerta"
              ? "btn-warning"
              : "btn-outline-warning"
          }`}
          onClick={() => setFiltroEstado("alerta")}
        >
          <i className="bi bi-exclamation-triangle me-1"></i>
          {resumenClientes.alerta} Alertas
        </button>

        {/* CRÍTICO */}
        <button
          className={`btn ${
            filtroEstado === "critico"
              ? "btn-danger"
              : "btn-outline-danger"
          }`}
          onClick={() => setFiltroEstado("critico")}
        >
          <i className="bi bi-exclamation-octagon me-1"></i>
          {resumenClientes.critico} Críticos
        </button>

        {/* SIN MANTENIMIENTO */}
        <button
          className={`btn ${
            filtroEstado === "sin-mantenimiento"
              ? "btn-secondary"
              : "btn-outline-secondary"
          }`}
          onClick={() =>
            setFiltroEstado("sin-mantenimiento")
          }
        >
          <i className="bi bi-wrench-adjustable me-1"></i>
          {resumenClientes.sinMantenimiento} Sin mant.
        </button>

      </div>

      {/* ==================================================
          BUSCAR + FILTRO + ORDEN + NUEVO
      ================================================== */}

      <div className="d-flex gap-2 mb-3">

        {/* BUSCAR */}
        <input
          className="form-control"
          placeholder="🔎 Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* ORDEN */}
        <button
          className="btn btn-outline-secondary"
          onClick={() => setOrdenAsc((p) => !p)}
          title={
            ordenAsc
              ? "Orden Z-A"
              : "Orden A-Z"
          }
        >
          {ordenAsc ? (
            <i className="bi bi-sort-alpha-down"></i>
          ) : (
            <i className="bi bi-sort-alpha-down-alt"></i>
          )}
        </button>

        {/* NUEVO */}
        <button
          className="btn btn-primary"
          onClick={() => {
            setClienteEditando(null);
            setShowForm(true);
          }}
          title="Nuevo cliente"
        >
          <i className="bi bi-plus-circle"></i>
        </button>

      </div>

      {/* ==================================================
          TABLA
      ================================================== */}

      <div className="table-responsive">

        <table className="table table-bordered table-hover align-middle">

          <thead className="table-dark">
            <tr>
              <th className="col-cliente">
                Nombre
              </th>

              <th className="col-codigo">
                Código
              </th>

              <th className="col-estado text-center">
                Estado
              </th>

              <th className="col-instrumentos text-center">
                Inst.
              </th>

              <th className="col-acciones text-center">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>

            {clientesPaginados.map((c) => {

              const stats =
                estadisticasClientes[c._id] || {
                  cantidad: 0,
                  vencidos: 0,
                  sinMantenimiento: 0,
                  estado: "ok",
                };

              const {
                cantidad: cant,
                vencidos,
                estado,
              } = stats;

              return (
                <tr
                  key={c._id}
                  className={
                    estado === "critico"
                      ? "table-danger"
                      : estado === "alerta"
                      ? "table-warning"
                      : estado === "sin-mantenimiento"
                      ? "table-secondary"
                      : ""
                  }
                >

                  {/* NOMBRE */}
                  <td className="col-cliente">
                    {c.nombre}
                  </td>

                  {/* CÓDIGO */}
                  <td className="col-codigo">
                    {c.codigoCliente}
                  </td>

                  {/* ESTADO */}
                  <td className="col-estado text-center">

                    <span
                      className={`badge ${
                        estado === "critico"
                          ? "bg-danger"
                          : estado === "alerta"
                          ? "bg-warning text-dark"
                          : estado ===
                            "sin-mantenimiento"
                          ? "bg-secondary"
                          : "bg-success"
                      }`}
                    >
                      {estado ===
                      "sin-mantenimiento"
                        ? "SIN MANT."
                        : estado.toUpperCase()}

                      {(estado === "critico" ||
                        estado === "alerta") &&
                        ` (${vencidos})`}
                    </span>

                  </td>

                  {/* INSTRUMENTOS */}
                  <td className="col-instrumentos text-center">

                    <button
                      className="btn btn-outline-primary btn-sm position-relative"
                      onClick={() =>
                        setSelected(c)
                      }
                      title="Ver instrumentos"
                    >
                      <i className="bi bi-tools"></i>

                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary">
                        {cant}
                      </span>
                    </button>

                  </td>

                  {/* ACCIONES */}
                  <td className="col-acciones">

                    <div className="d-flex justify-content-center gap-1">

                      {/* EDITAR */}
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        title="Editar cliente"
                        onClick={() => {
                          setClienteEditando(c);
                          setShowForm(true);
                        }}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>

                      {/* ELIMINAR */}
                      <button
                        className="btn btn-outline-danger btn-sm"
                        title="Eliminar cliente"
                        onClick={() => {
                          setClienteDelete(c);
                          setShowDeleteModal(true);
                        }}
                      >
                        <i className="bi bi-trash3-fill"></i>
                      </button>

                    </div>

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

        {/* ==================================================
            PAGINACIÓN
        ================================================== */}

        <div className="d-flex justify-content-center align-items-center gap-2 mt-3">

          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={pagina === 1}
            onClick={() =>
              setPagina((p) => p - 1)
            }
          >
            ←
          </button>

          <span>
            Página {pagina} de{" "}
            {totalPaginas || 1}
          </span>

          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={
              pagina === totalPaginas ||
              totalPaginas === 0
            }
            onClick={() =>
              setPagina((p) => p + 1)
            }
          >
            →
          </button>

        </div>

        {/* SIN RESULTADOS */}
        {filtrados.length === 0 && (
          <div className="text-center text-muted mt-3">
            No se encontraron clientes
          </div>
        )}

      </div>

      {/* ==================================================
          MODAL INSTRUMENTOS
      ================================================== */}

      {selected && (
        <Modal
          onClose={() => setSelected(null)}
        >
          <ClienteInstrumentos
            cliente={selected}
          />
        </Modal>
      )}

      {/* ==================================================
          MODAL CLIENTE FORM
      ================================================== */}

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

      {/* ==================================================
          MODAL ELIMINAR
      ================================================== */}

      {showDeleteModal && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex="-1"
          >
            <div className="modal-dialog">

              <div className="modal-content">

                <div className="modal-header">

                  <h5 className="modal-title">
                    Advertencia
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={() =>
                      setShowDeleteModal(false)
                    }
                  />

                </div>

                <div className="modal-body">

                  <p>
                    ¿Está seguro de querer eliminar
                    el cliente código{" "}
                    <strong>
                      {clienteDelete?.codigoCliente}
                    </strong>
                    ?
                  </p>

                </div>

                <div className="modal-footer">

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      setShowDeleteModal(false)
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      onDelete(clienteDelete._id);
                      setShowDeleteModal(false);
                    }}
                  >
                    Eliminar
                  </button>

                </div>

              </div>

            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}

    </div>
  );
}
