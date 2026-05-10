import { useEffect, useState, useMemo } from "react";
import { getClientes, getInstrumentos, updateCliente } from "../api/api";
import Modal from "./Modal";
import ClienteInstrumentos from "./ClienteInstrumentos";

export default function ClienteList({ refresh }) {
  const [clientes, setClientes] = useState([]);
  const [instrumentos, setInstrumentos] = useState([]);
  const [search, setSearch] = useState("");

  const [editCell, setEditCell] = useState(null);
  const [editValue, setEditValue] = useState("");

  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      const [cli, ins] = await Promise.all([
        getClientes(),
        getInstrumentos(),
      ]);

      setClientes(cli || []);
      setInstrumentos(ins || []);
    };

    cargar();
  }, [refresh]);

  // 🔎 filtro
  const filtrados = useMemo(() => {
    const t = search.toLowerCase();

    return clientes.filter(
      (c) =>
        c.nombre?.toLowerCase().includes(t) ||
        c.codigoCliente?.toLowerCase().includes(t) ||
        c.direccion?.toLowerCase().includes(t) ||
        c.email?.toLowerCase().includes(t)
    );
  }, [clientes, search]);

  // 📦 cantidad instrumentos
  const getCantidad = (id) =>
    instrumentos.filter((i) => i.cliente?._id === id).length;

  // 🔴 vencidos
  const getVencidos = (id) => {
    const hoy = new Date();

    return instrumentos.filter((i) => {
      if (i.cliente?._id !== id) return false;
      if (!i.fechaUltimoMantenimiento) return false;

      const f = new Date(i.fechaUltimoMantenimiento);
      const v = new Date(f);
      v.setFullYear(v.getFullYear() + 1);

      return v < hoy;
    }).length;
  };

  const getEstado = (id) => {
    const v = getVencidos(id);

    if (v >= 2) return "critico";
    if (v === 1) return "alerta";
    return "ok";
  };

  // ✏️ editar
  const handleEdit = (id, field, value) => {
    setEditCell({ id, field });
    setEditValue(value || "");
  };

  const saveEdit = async () => {
    if (!editCell) return;

    const { id, field } = editCell;

    try {
      await updateCliente(id, { [field]: editValue });

      setClientes((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, [field]: editValue } : c
        )
      );
    } catch (err) {
      console.error(err);
    }

    setEditCell(null);
  };

  return (
    <div className="card p-3 shadow-sm">
      <h4 className="mb-3">
        <i className="bi bi-people-fill me-2"></i>
        Clientes
      </h4>

      <input
        className="form-control mb-3"
        placeholder="🔎 Buscar cliente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>Nombre</th>
              <th>Código</th>
              <th>Dirección</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Inst. / Acción</th>
            </tr>
          </thead>

          <tbody>
            {filtrados.map((c) => {
              const estado = getEstado(c._id);
              const cant = getCantidad(c._id);
              const vencidos = getVencidos(c._id);

              return (
                <tr key={c._id}>

                  {/* NOMBRE */}
                  <td
                    style={{ cursor: "pointer" }}
                    onClick={() => handleEdit(c._id, "nombre", c.nombre)}
                  >
                    {editCell?.id === c._id &&
                    editCell?.field === "nombre" ? (
                      <input
                        className="form-control form-control-sm"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      />
                    ) : (
                      c.nombre
                    )}
                  </td>

                  {/* CODIGO */}
                  <td
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      handleEdit(c._id, "codigoCliente", c.codigoCliente)
                    }
                  >
                    {editCell?.id === c._id &&
                    editCell?.field === "codigoCliente" ? (
                      <input
                        className="form-control form-control-sm"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      />
                    ) : (
                      c.codigoCliente
                    )}
                  </td>

                  {/* DIRECCION */}
                  <td
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      handleEdit(c._id, "direccion", c.direccion)
                    }
                  >
                    {editCell?.id === c._id &&
                    editCell?.field === "direccion" ? (
                      <input
                        className="form-control form-control-sm"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      />
                    ) : (
                      c.direccion || "—"
                    )}
                  </td>

                  {/* EMAIL */}
                  <td
                    style={{ cursor: "pointer" }}
                    onClick={() => handleEdit(c._id, "email", c.email)}
                  >
                    {editCell?.id === c._id &&
                    editCell?.field === "email" ? (
                      <input
                        className="form-control form-control-sm"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      />
                    ) : (
                      c.email || "—"
                    )}
                  </td>

                  {/* ESTADO */}
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

                  {/* INST + BOTON */}
                  <td className="text-center">
                    <button
                      className="btn btn-outline-primary btn-sm position-relative"
                      onClick={() => setSelected(c)}
                    >
                      <i className="bi bi-tools"></i>

                      <span
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary"
                      >
                        {cant}
                      </span>
                    </button>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>

        {filtrados.length === 0 && (
          <div className="text-center text-muted mt-3">
            No se encontraron clientes
          </div>
        )}
      </div>

      {/* MODAL */}
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <ClienteInstrumentos cliente={selected} />
        </Modal>
      )}
    </div>
  );
}