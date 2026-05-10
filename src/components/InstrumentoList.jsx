import { useEffect, useState, useMemo } from "react";
import { getInstrumentos, getClientes, updateInstrumento } from "../api/api";

export default function InstrumentoList({ refresh }) {
  const [instrumentos, setInstrumentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState("");

  const [editCell, setEditCell] = useState(null);
  const [editValue, setEditValue] = useState("");

  // 🔄 CARGA DE DATOS
  useEffect(() => {
    const cargar = async () => {
      try {
        const [ins, cli] = await Promise.all([
          getInstrumentos(),
          getClientes(),
        ]);

        setInstrumentos(ins || []);
        setClientes(cli || []);
        console.log("INSTRUMENTOS:", instrumentos);
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    };

    cargar();
  }, [refresh]);

  // 🔎 FILTRO OPTIMIZADO (memoizado)
  const filtrados = useMemo(() => {
    const t = search.toLowerCase();

    return instrumentos.filter((i) =>
      i.numeroSerie?.toLowerCase().includes(t) ||
      i.numeroPartida?.toLowerCase().includes(t) ||
      i.descripcion?.toLowerCase().includes(t) ||
      i.cliente?.nombre?.toLowerCase().includes(t)
    );
  }, [search, instrumentos]);

  // ✏️ ACTIVAR EDICIÓN
  const handleEdit = (id, field, value) => {
    setEditCell({ id, field });
    setEditValue(value || "");
  };

  // 💾 GUARDAR CAMBIOS
  const saveEdit = async () => {
  if (!editCell) return;

  const { id, field } = editCell;

  try {
    let updatedValue = editValue;

    if (field === "cliente") {
      updatedValue = editValue || null;
    }

    if (field === "fechaUltimoMantenimiento") {
      updatedValue = editValue
        ? new Date(editValue + "T12:00:00")
        : null;
    }

    await updateInstrumento(id, {
      [field]: updatedValue,
    });

    setInstrumentos((prev) =>
      prev.map((i) =>
        i._id === id
          ? {
              ...i,
              [field]:
                field === "cliente"
                  ? clientes.find((c) => c._id === editValue) || null
                  : updatedValue,
            }
          : i
      )
    );

  } catch (err) {
    console.error("Error actualizando instrumento:", err);
  }

  setEditCell(null);
};

  //Funcion para calcular el estado
  const getEstadoMantenimiento = (fecha) => {
    if (!fecha) return "sin";

    const hoy = new Date();
    const fechaMant = new Date(fecha);

    // 🔧 vencimiento a 12 meses
    const vencimiento = new Date(fechaMant);
    vencimiento.setFullYear(vencimiento.getFullYear() + 1);

    const diffDias = Math.ceil(
      (vencimiento - hoy) / (1000 * 60 * 60 * 24)
    );

    if (diffDias < 0) return "vencido";       // 🔴
    if (diffDias <= 30) return "proximo";     // 🟡
    return "ok";                               // 🟢
  };

  return (
    <div className="card p-3 shadow-sm">
      <h4>🧰 Instrumentos</h4>

      {/* 🔎 SEARCH */}
      <input
        className="form-control mb-3"
        placeholder="🔎 Buscar instrumento o cliente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="table-responsive">
        <table className="table table-striped table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>Serie</th>
              <th>Partida</th>
              <th>Descripción</th>
              <th>Cliente</th>
              <th>Mantenimiento</th>
            </tr>
          </thead>

          <tbody>
            {filtrados.map((i) => (
              <tr key={i._id}>
                
                {/* 🔹 SERIE */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() => handleEdit(i._id, "numeroSerie", i.numeroSerie)}
                >
                  {editCell?.id === i._id && editCell?.field === "numeroSerie" ? (
                    <input
                      className="form-control form-control-sm"
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    />
                  ) : (
                    i.numeroSerie
                  )}
                </td>

                {/* 🔹 PARTIDA */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() => handleEdit(i._id, "numeroPartida", i.numeroPartida)}
                >
                  {editCell?.id === i._id && editCell?.field === "numeroPartida" ? (
                    <input
                      className="form-control form-control-sm"
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    />
                  ) : (
                    i.numeroPartida
                  )}
                </td>

                {/* 🔹 DESCRIPCIÓN */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() => handleEdit(i._id, "descripcion", i.descripcion)}
                >
                  {editCell?.id === i._id && editCell?.field === "descripcion" ? (
                    <input
                      className="form-control form-control-sm"
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    />
                  ) : (
                    i.descripcion
                  )}
                </td>

                {/* 🔹 CLIENTE */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() => handleEdit(i._id, "cliente", i.cliente?._id)}
                >
                  {editCell?.id === i._id && editCell?.field === "cliente" ? (
                    <select
                      autoFocus
                      className="form-select form-select-sm"
                      value={editValue || ""}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                    >
                      <option value="">Sin cliente</option>
                      {clientes.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  ) : (
                    i.cliente?.nombre || "Sin cliente"
                  )}
                </td>

                {/* 🔹 MANTENIMIENTO */}
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    handleEdit(
                      i._id,
                      "fechaUltimoMantenimiento",
                      i.fechaUltimoMantenimiento
                        ? new Date(i.fechaUltimoMantenimiento).toISOString().split("T")[0]
                        : ""
                    )
                  }
                >
                  {(() => {
                    const estado = getEstadoMantenimiento(i.fechaUltimoMantenimiento);

                    const clases =
                      estado === "vencido"
                        ? "text-danger fw-bold"
                        : estado === "proximo"
                        ? "text-warning fw-bold"
                        : estado === "ok"
                        ? "text-success"
                        : "text-muted";

                    return editCell?.id === i._id &&
                      editCell?.field === "fechaUltimoMantenimiento" ? (
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      />
                    ) : i.fechaUltimoMantenimiento ? (
                      <span className={clases}>
                        {new Date(i.fechaUltimoMantenimiento).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtrados.length === 0 && (
          <div className="text-center text-muted mt-3">
            No se encontraron instrumentos
          </div>
        )}
      </div>
    </div>
  );
}