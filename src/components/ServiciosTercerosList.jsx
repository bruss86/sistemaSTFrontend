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
  // TOTALES Y MÉTRICAS (KPIS)
  // =========================
  const { totalCosto, totalServicios } = useMemo(() => {
    const costo = filtrados.reduce(
      (acc, s) => acc + Number(s.costo || 0),
      0
    );
    return {
      totalCosto: costo,
      totalServicios: filtrados.length,
    };
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
    <div className="container-fluid p-0">
      
      {/* ================================================== */}
      {/* TARJETAS DE RESUMEN (KPIS)                         */}
      {/* ================================================== */}
      <div className="row g-2 mb-3">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
            <span className="text-muted small fw-semibold">Servicios Filtrados</span>
            <span className="fs-4 fw-bold text-dark">{totalServicios}</span>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm p-3 bg-white rounded-3 border-start border-4 border-success">
            <span className="text-success small fw-semibold">Costo Total Acumulado</span>
            <span className="fs-4 fw-bold text-success">${totalCosto.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* CONTENEDOR PRINCIPAL                               */}
      {/* ================================================== */}
      <div className="card p-3 shadow-sm border-0 rounded-3">

        {/* CABECERA Y FILTROS */}
        <div className="d-flex justify-content-between align-items-end mb-3 flex-wrap gap-3">
          
          <div className="d-flex gap-2 align-items-end flex-wrap">
            <div>
              <label className="form-label small text-muted mb-1">Desde</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label small text-muted mb-1">Hasta</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
            </div>

            {(desde || hasta) && (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setDesde("");
                  setHasta("");
                }}
                title="Limpiar filtros de fecha"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
              onClick={exportarExcel}
              disabled={!filtrados.length}
              title="Exportar a Excel"
            >
              <i className="bi bi-file-earmark-excel"></i> Exportar
            </button>

            <button
              className="btn btn-success btn-sm d-flex align-items-center gap-1 px-3"
              onClick={onCreate}
              title="Registrar Nuevo Servicio"
            >
              <i className="bi bi-plus-circle"></i> Nuevo Servicio
            </button>
          </div>
        </div>

        {/* TABLA */}
        <div className="table-responsive border rounded-3 shadow-sm mb-3">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark text-nowrap">
              <tr>
                <th style={{ width: "12%" }} className="py-3">Fecha</th>
                <th style={{ width: "20%" }} className="py-3">Instrumento</th>
                <th style={{ width: "18%" }} className="py-3">Proveedor</th>
                <th style={{ width: "12%" }} className="text-center py-3">Tipo</th>
                <th style={{ width: "23%" }} className="py-3">Descripción</th>
                <th style={{ width: "10%" }} className="text-end py-3">Costo</th>
                <th style={{ width: "5%" }} className="text-center py-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-5">
                    <i className="bi bi-tools fs-1 d-block mb-2 opacity-50"></i>
                    No hay servicios registrados en el rango seleccionado
                  </td>
                </tr>
              ) : (
                filtrados.map((s) => (
                  <tr key={s._id}>
                    <td className="fw-semibold text-dark">
                      {s.fechaServicio
                        ? typeof s.fechaServicio === "string"
                          ? s.fechaServicio.split("-").reverse().join("/")
                          : new Date(s.fechaServicio).toLocaleDateString("es-AR")
                        : "—"}
                    </td>

                    <td className="text-truncate fw-semibold text-dark" style={{ maxWidth: "180px" }} title={getInstrumentoNombre(s)}>
                      <i className="bi bi-cpu text-muted me-1"></i>
                      {getInstrumentoNombre(s)}
                    </td>

                    <td className="text-truncate" style={{ maxWidth: "150px" }} title={s.proveedor}>
                      {s.proveedor || "—"}
                    </td>

                    <td className="text-center">
                      <span className="badge rounded-pill bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1" style={{ fontSize: "0.75rem" }}>
                        {s.tipoServicio || "—"}
                      </span>
                    </td>

                    <td className="text-truncate text-secondary" style={{ maxWidth: "200px" }} title={s.descripcion}>
                      {s.descripcion || "—"}
                    </td>

                    <td className="text-end fw-bold text-dark">
                      ${Number(s.costo || 0).toFixed(2)}
                    </td>

                    <td className="text-center text-nowrap">
                      <div className="d-flex justify-content-center gap-1">
                        <button
                          className="btn btn-sm btn-light border text-primary shadow-sm"
                          title="Editar Servicio"
                          onClick={() => handleEdit(s)}
                        >
                          <i className="bi bi-pencil-fill"></i>
                        </button>

                        <button
                          className="btn btn-sm btn-light border text-danger shadow-sm"
                          title="Eliminar Servicio"
                          onClick={() => onDelete?.(s._id)}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PIE DE TABLA / TOTALES */}
        <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded-3">
          <span className="text-muted small">
            Mostrando <b>{filtrados.length}</b> registros de servicios de terceros
          </span>
          <div className="fs-5 fw-bold text-dark">
            Total General: <span className="text-success">${totalCosto.toFixed(2)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}