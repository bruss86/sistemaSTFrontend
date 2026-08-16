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
    <div className="card border-0">

      <div className="card-body">

        <h4 className="mb-3">
          🔧 Registrar mantenimiento
        </h4>

        <div className="mb-3">
          <div className="fw-semibold">
            {instrumento.descripcion}
          </div>

          {instrumento.numeroSerie && (
            <div className="small text-muted">
              S/N: {instrumento.numeroSerie}
            </div>
          )}

          {instrumento.cliente?.nombre && (
            <div className="small text-muted mt-1">
              Cliente: {instrumento.cliente.nombre}
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-danger py-2">
            {error}
          </div>
        )}

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

        {fecha && (
          <div className="alert alert-light border mb-3">
            <div className="small text-muted">
              Próximo mantenimiento
            </div>

            <div className="fw-semibold">
              {calcularProximo()}
            </div>
          </div>
        )}

        <div className="d-flex gap-2">

          <button
            type="button"
            className="btn btn-secondary flex-fill"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn btn-success flex-fill"
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
                🔧 Registrar
              </>
            )}
          </button>

        </div>

      </div>

    </div>
  );
}