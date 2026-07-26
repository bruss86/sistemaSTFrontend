import { useEffect, useState, useMemo } from "react";
import "../styles/ClienteList.css";

import Modal from "./Modal";
import ClienteInstrumentos from "./ClienteInstrumentos";
import ClienteForm from "./ClienteForm";

export default function ClienteList({ clientes = [], instrumentos = [], refresh, onDelete, onRefresh }) {
  const [search, setSearch] = useState("");
  const [ordenAsc, setOrdenAsc] = useState(true);

  const [selected, setSelected] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 👉 modal cliente form
  const [showForm, setShowForm] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);

  const [clienteDelete, setClienteDelete] = useState(null);

  // 👉 paginación
  const [pagina, setPagina] = useState(1);
  const porPagina = 8;

  useEffect(() => {
    setPagina(1);
  }, [search]);

  const filtrados = useMemo(() => {
    const t = search.toLowerCase().trim();

    let resultado = clientes.filter((c) => {
      return (
        c?.nombre?.toLowerCase().includes(t) ||
        c?.codigoCliente?.toLowerCase().includes(t)
      );
    });

    resultado.sort((a, b) => {
      const A = a?.nombre?.toLowerCase() || "";
      const B = b?.nombre?.toLowerCase() || "";

      return ordenAsc ? A.localeCompare(B) : B.localeCompare(A);
    });

    return resultado;
  }, [clientes, search, ordenAsc]);

  const totalPaginas = Math.ceil(filtrados.length / porPagina);

  const clientesPaginados = useMemo(() => {
    const inicio = (pagina - 1) * porPagina;
    return filtrados.slice(inicio, inicio + porPagina);
  }, [filtrados, pagina]);

  /*
  const getCantidad = (id) =>
    instrumentos.filter((i) => i?.cliente?._id === id).length;

  const getVencidos = (id) => {
    const hoy = new Date();

    return instrumentos.filter((i) => {
      if (i?.cliente?._id !== id) return false;
      if (!i?.fechaUltimoMantenimiento) return false;

      const f = new Date(i.fechaUltimoMantenimiento);
      if (isNaN(f.getTime())) return false;

      const vencimiento = new Date(f);
      vencimiento.setFullYear(vencimiento.getFullYear() + 1);

      return vencimiento < hoy;
    }).length;
  };
  const getEstado = (id) => {
    const v = getVencidos(id);
    if (v >= 2) return "critico";
    if (v === 1) return "alerta";
    return "ok";
  };*/

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
          };
        }

        stats[id].cantidad++;

        if (!i.fechaUltimoMantenimiento) return;

        const fecha = new Date(i.fechaUltimoMantenimiento);

        if (isNaN(fecha.getTime())) return;

        const vencimiento = new Date(fecha);
        vencimiento.setFullYear(vencimiento.getFullYear() + 1);

        if (vencimiento < hoy) {
          stats[id].vencidos++;
        }
      });

      Object.values(stats).forEach((s) => {
        s.estado =
          s.vencidos >= 2
            ? "critico"
            : s.vencidos === 1
            ? "alerta"
            : "ok";
      });

      return stats;
      }, [instrumentos]);

  return (
    <div className="card p-3 shadow-sm">

      {/* 🔎 BUSCAR + ORDEN + NUEVO */}
      <div className="d-flex gap-2 mb-3">
        <input
          className="form-control"
          placeholder="🔎 Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className="btn btn-outline-secondary"
          onClick={() => setOrdenAsc((p) => !p)}
        >
          {ordenAsc ? <i className="bi bi-sort-alpha-down"></i> : <i className="bi bi-sort-alpha-down-alt"></i>}
        </button>

        {/* ➕ NUEVO CLIENTE */}
        <button
          className="btn btn-primary"
          onClick={() => {
            setClienteEditando(null);
            setShowForm(true);
          }}
        >
          <i className="bi bi-plus-circle"></i>
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>Nombre</th>
              <th>Código</th>
              <th>Estado</th>
              <th>Inst.</th>
              <th style={{ width: 100 }}>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {clientesPaginados.map((c) => {
              /*const estado = getEstado(c._id);
              const cant = getCantidad(c._id);
              const vencidos = getVencidos(c._id);*/

              const stats = estadisticasClientes[c._id] || {
                cantidad: 0,
                vencidos: 0,
                estado: "ok",
              };

              const { cantidad: cant, vencidos, estado } = stats;

              return (
                <tr className={
                    estado === "critico"
                        ? "table-danger"
                        : estado === "alerta"
                        ? "table-warning"
                        : ""
                } key={c._id}>
                  <td  className="col-cliente">{c.nombre}</td>
                  <td>{c.codigoCliente}</td>

                  <td className="text-center">
                    <span
                      className={`badge ${
                        estado === "critico"
                          ? "bg-danger"
                          : estado === "alerta"
                          ? "bg-warning"
                          : "bg-success"
                      }`}
                    >
                      {estado.toUpperCase()}
                      {estado !== "ok" && ` (${vencidos})`}
                    </span>
                  </td>

                  <td className="text-center">
                    <button
                      className="btn btn-outline-primary btn-sm position-relative"
                      onClick={() => setSelected(c)}
                    >
                      <i className="bi bi-tools"></i>

                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary">
                        {cant}
                      </span>
                    </button>
                  </td>

                  {/* ✏️ EDITAR CLIENTE */}
                  <td className="d-flex gap-1">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="d-flex justify-content-center align-items-center gap-2 mt-3">

          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={pagina === 1}
            onClick={() => setPagina((p) => p - 1)}
          >
            ←
          </button>

          <span>
            Página {pagina} de {totalPaginas || 1}
          </span>

          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={pagina === totalPaginas || totalPaginas === 0}
            onClick={() => setPagina((p) => p + 1)}
          >
            →
          </button>

        </div>

        {filtrados.length === 0 && (
          <div className="text-center text-muted mt-3">
            No se encontraron clientes
          </div>
        )}
      </div>

      {/* MODAL INSTRUMENTOS */}
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <ClienteInstrumentos cliente={selected} />
        </Modal>
      )}

      {/* MODAL CLIENTE FORM */}
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

      {/* MODAL ELIMINAR */}
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
                  <h5 className="modal-title">Advertencia</h5>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowDeleteModal(false)}
                  />
                </div>

                <div className="modal-body">
                  <p>
                    ¿Está seguro de querer eliminar el cliente código
                    <strong>
                      {" "}
                      {clienteDelete?.codigoCliente}
                    </strong>
                    ?
                  </p>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteModal(false)}
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