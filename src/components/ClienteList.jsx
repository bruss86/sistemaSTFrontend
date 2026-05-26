import { useEffect, useState, useMemo } from "react";
import {
  getClientes,
  getInstrumentos,
} from "../api/api";

import Modal from "./Modal";
import ClienteInstrumentos from "./ClienteInstrumentos";
import ClienteForm from "./ClienteForm";

export default function ClienteList({ refresh }) {
  const [clientes, setClientes] = useState([]);
  const [instrumentos, setInstrumentos] = useState([]);
  const [search, setSearch] = useState("");
  const [ordenAsc, setOrdenAsc] = useState(true);

  const [selected, setSelected] = useState(null);

  // 👉 modal cliente form
  const [showForm, setShowForm] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);

  // 👉 paginación
  const [pagina, setPagina] = useState(1);
  const porPagina = 8;

  useEffect(() => {
    setPagina(1);
    const cargar = async () => {
      try {
        const [cli, ins] = await Promise.all([
          getClientes(),
          getInstrumentos(),
        ]);

        setClientes(Array.isArray(cli) ? cli : []);
        setInstrumentos(Array.isArray(ins) ? ins : []);
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    };

    cargar();
  }, [refresh],[search]);

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
  };

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
          {ordenAsc ? "A → Z" : "Z → A"}
        </button>

        {/* ➕ NUEVO CLIENTE */}
        <button
          className="btn btn-primary"
          onClick={() => {
            setClienteEditando(null);
            setShowForm(true);
          }}
        >
          + Nuevo
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
              <th style={{ width: 100 }}>Editar</th>
            </tr>
          </thead>

          <tbody>
            {clientesPaginados.map((c) => {
              const estado = getEstado(c._id);
              const cant = getCantidad(c._id);
              const vencidos = getVencidos(c._id);

              return (
                <tr key={c._id}>
                  <td>{c.nombre}</td>
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
                  <td className="text-center">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        setClienteEditando(c);
                        setShowForm(true);
                      }}
                    >
                      <i className="bi bi-pencil"></i>
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
              setShowForm(false);
              setClienteEditando(null);
            }}
            onClienteGuardado={(clienteActualizado) => {
              setClientes((prev) =>
                prev.map((c) =>
                  c._id === clienteActualizado._id
                    ? clienteActualizado
                    : c
                )
              );

              setShowForm(false);
              setClienteEditando(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}