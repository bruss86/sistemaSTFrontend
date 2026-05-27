import { useMemo, useState, useCallback } from "react";
import * as XLSX from "xlsx";

export default function ServiciosTercerosList({
  servicios = [],
  onEdit,
  onDelete,
  onCreate,
}) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const handleEdit = useCallback((s) => {
    onEdit?.(s);
  }, [onEdit]);

  // =========================
  // NORMALIZAR INSTRUMENTO
  // =========================
  const getInstrumentoNombre = useCallback((s) => {
    if (!s?.instrumento) return "—";

    if (typeof s.instrumento === "object") {
      return s.instrumento?.descripcion || "—";
    }

    return s.instrumento || "—";
  }, []);

  // =========================
  // FILTRO + ORDENAMIENTO
  // =========================
  const filtrados = useMemo(() => {

    //const fDesde = desde ? new Date(desde) : null;

    const fDesde = desde
      ? new Date(new Date(desde).setHours(0, 0, 0, 0))
      : null;

    const fHasta = hasta
      ? new Date(new Date(hasta).setHours(23, 59, 59, 999))
      : null;
    return servicios
      .filter((s) => {
        if (!s?.fechaServicio) return false;

        const fecha = new Date(s.fechaServicio);
        if (isNaN(fecha)) return false;

        if (fDesde && fecha < fDesde) return false;
        if (fHasta && fecha > fHasta) return false;

        return true;
      })
      .sort((a, b) => new Date(b.fechaServicio) - new Date(a.fechaServicio));
  }, [servicios, desde, hasta]);

  // =========================
  // TOTAL
  // =========================
  const total = useMemo(() => {
    return filtrados.reduce(
      (acc, s) => acc + Number(s.costo || 0),
      0
    );
  }, [filtrados]);

  // =========================
  // EXPORTAR EXCEL
  // =========================
  const exportarExcel = useCallback(() => {
    if (!filtrados.length) return;

    const data = filtrados.map((s) => ({
      Fecha: s.fechaServicio
        ? typeof s.fechaServicio === "string"
          ? s.fechaServicio.split("-").reverse().join("/")
          : new Date(s.fechaServicio).toLocaleDateString("es-AR")
        : "-",
      Instrumento: getInstrumentoNombre(s),
      Proveedor: s.proveedor || "",
      Tipo: s.tipoServicio || "",
      Descripción: s.descripcion || "",
      Costo: Number(s.costo || 0),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Servicios");

    XLSX.writeFile(wb, "servicios-terceros.xlsx");
  }, [filtrados, getInstrumentoNombre]);

  return (
    <div>

      {/* =========================
          FILTROS
      ========================= */}
      <div className="d-flex gap-2 mb-3 flex-wrap align-items-end">

        <div>
          <label className="form-label small">Desde</label>
          <input
            type="date"
            className="form-control"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label small">Hasta</label>
          <input
            type="date"
            className="form-control"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>

        <button
          className="btn btn-outline-secondary"
          onClick={() => {
            setDesde("");
            setHasta("");
          }}
        >
          Limpiar
        </button>

        <div className="ms-auto d-flex gap-2">

          <button
            className="btn btn-primary"
            onClick={onCreate}
          >
            ➕ Nuevo Servicio
          </button>

          <button
            className="btn btn-success"
            onClick={exportarExcel}
            disabled={!filtrados.length}
          >
            📥 Exportar Excel
          </button>

        </div>

      </div>

      {/* =========================
          TABLA
      ========================= */}
      <div className="table-responsive">

        <table className="table table-bordered table-sm align-middle">

          <thead className="table-dark">
            <tr>
              <th>Fecha</th>
              <th>Instrumento</th>
              <th>Proveedor</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th className="text-end">Costo</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>

            {filtrados.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center text-muted py-4">
                  No hay servicios en el rango seleccionado
                </td>
              </tr>
            )}

            {filtrados.map((s) => (
              <tr key={s._id}>

                <td>
                  {s.fechaServicio
                    ? typeof s.fechaServicio === "string"
                      ? s.fechaServicio.split("-").reverse().join("/")
                      : new Date(s.fechaServicio).toLocaleDateString("es-AR")
                    : "—"}
                </td>

                <td>{getInstrumentoNombre(s)}</td>

                <td>{s.proveedor || "—"}</td>

                <td>
                  <span className="badge bg-secondary">
                    {s.tipoServicio || "—"}
                  </span>
                </td>

                <td>{s.descripcion || "—"}</td>

                <td className="text-end">
                  ${Number(s.costo || 0).toFixed(2)}
                </td>

                <td className="text-center">

                  <button
                    className="btn btn-sm btn-primary me-1"
                    onClick={() => handleEdit(s)}
                  >
                    ✏️
                  </button>

                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => onDelete?.(s._id)}
                  >
                    🗑️
                  </button>

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      {/* =========================
          TOTAL
      ========================= */}
      <div className="text-end mt-3 fs-5">
        <strong>Total: ${total.toFixed(2)}</strong>
      </div>

    </div>
  );
}