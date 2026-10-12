import { useEffect, useState } from "react";
import { updateInstrumento } from "../api/api";

export default function RegistrarMantenimientoModal({
  instrumento,
  onUpdated,
  onClose,
}) {
  const [fecha, setFecha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (instrumento) {
      const hoy = new Date();
      const fechaHoy = hoy.toISOString().slice(0, 10);
      setFecha(fechaHoy);
    }
  }, [instrumento]);

  if (!instrumento) return null;

  const calcularProximo = () => {
    if (!fecha) return null;

    const fechaProximo = new Date(`${fecha}T00:00:00`);
    fechaProximo.setFullYear(fechaProximo.getFullYear() + 1);

    return fechaProximo.toLocaleDateString("es-AR");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fecha) {
      setError("Debe indicar la fecha del mantenimiento.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        fechaUltimoMantenimiento: fecha,
      };

      const updated = await updateInstrumento(
        instrumento._id,
        payload
      );

      onUpdated?.(updated);
      onClose?.();

    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
        err?.message ||
        "Error al registrar el mantenimiento."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-0 bg-transparent">
      <div className="card-body p-2">

        <h4 className="mb-3 fw-bold text-dark">
          🔧 Registrar Mantenimiento
        </h4>

        {/* INFORMACIÓN DEL INSTRUMENTO */}
        <div className="bg-light p-3 rounded-3 mb-3 border">
          <div className="fw-semibold text-dark">
            {instrumento.descripcion}
          </div>

          {instrumento.numeroSerie && (
            <div className="small text-muted mt-1">
              <i className="bi bi-upc-scan me-1"></i> S/N: {instrumento.numeroSerie}
            </div>
          )}

          {instrumento.cliente?.nombre && (
            <div className="small text-muted mt-1">
              <i className="bi bi-building me-1"></i> Cliente: {instrumento.cliente.nombre}
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 small shadow-sm mb-3">
            <i className="bi bi-exclamation-triangle-fill me-1"></i> {error}
          </div>
        )}

        {/* CAMPO FECHA */}
        <div className="form-floating mb-3">
          <input
            type="date"
            className="form-control"
            id="fechaMantenimiento"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <label htmlFor="fechaMantenimiento">
            Fecha del mantenimiento
          </label>
        </div>

        {/* PRÓXIMO MANTENIMIENTO ESTIMADO */}
        {fecha && (
          <div className="alert alert-success bg-success bg-opacity-10 border border-success border-opacity-25 mb-4 rounded-3 py-2 px-3 d-flex justify-content-between align-items-center">
            <div>
              <div className="small text-success fw-semibold">
                Próximo mantenimiento estimado:
              </div>
              <div className="fw-bold text-success fs-6">
                {calcularProximo()}
              </div>
            </div>
            <i className="bi bi-calendar-check text-success fs-4"></i>
          </div>
        )}

        {/* BOTONES */}
        <div className="d-flex gap-2 pt-2 border-top">
          <button
            type="button"
            className="btn btn-secondary flex-fill py-2 fw-semibold shadow-sm"
            onClick={onClose}
            disabled={loading}
          >
            <i className="bi bi-x-lg me-1"></i>
            Cancelar
          </button>

          <button
            type="submit"
            className="btn btn-success flex-fill py-2 fw-semibold shadow-sm"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                />
                Guardando...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-1"></i> Registrar
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}