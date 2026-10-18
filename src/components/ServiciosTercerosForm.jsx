import { useEffect, useState, useCallback, useMemo } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const initialState = {
  instrumento: "",
  proveedor: "",
  tipoServicio: "",
  descripcion: "",
  fechaServicio: "",
  costo: "",
};

export default function ServiciosTercerosForm({
  instrumentos = [],
  servicioEdit,
  onClose,
  onCreated,
}) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  // =========================
  // FILTRADO DE INSTRUMENTOS
  // =========================
  const [busquedaInstrumento, setBusquedaInstrumento] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  
  const instrumentosFiltrados = useMemo(() => {
    return instrumentos.filter((i) => {
      const texto = `${i.descripcion || ""} ${i.numeroSerie || ""}`.toLowerCase();
      return texto.includes(busquedaInstrumento.toLowerCase());
    });
  }, [instrumentos, busquedaInstrumento]);
  
  // =========================
  // CARGAR DATOS EN EDICIÓN
  // =========================
  useEffect(() => {
    if (!servicioEdit) {
      setForm(initialState);
      setBusquedaInstrumento("");
      return;
    }

    setForm({
      instrumento:
        typeof servicioEdit.instrumento === "object"
          ? servicioEdit.instrumento?._id
          : servicioEdit.instrumento || "",
      proveedor: servicioEdit.proveedor || "",
      tipoServicio: servicioEdit.tipoServicio || "",
      descripcion: servicioEdit.descripcion || "",
      fechaServicio: servicioEdit.fechaServicio
        ? servicioEdit.fechaServicio.substring(0, 10)
        : "",
      costo: servicioEdit.costo || "",
    });

    const inst = instrumentos.find((i) =>
      (typeof servicioEdit.instrumento === "object"
        ? servicioEdit.instrumento?._id
        : servicioEdit.instrumento) === i._id
    );

    setBusquedaInstrumento(
      inst ? `${inst.descripcion} - SN ${inst.numeroSerie}` : ""
    );
  }, [servicioEdit, instrumentos]);

  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    window.addEventListener("click", handleClickOutside);

    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // =========================
  // HANDLE CHANGE GENÉRICO
  // =========================
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // =========================
  // VALIDACIÓN BÁSICA
  // =========================
  const validar = () => {
    if (!form.instrumento) return "Debe seleccionar un instrumento";
    if (!form.proveedor.trim()) return "Proveedor requerido";
    if (!form.tipoServicio.trim()) return "Tipo de servicio requerido";
    if (!form.fechaServicio) return "Fecha requerida";
    return null;
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errorValidacion = validar();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const url = servicioEdit
        ? `${API_URL}/servicios-terceros/${servicioEdit._id}`
        : `${API_URL}/servicios-terceros`;

      const method = servicioEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          costo: Number(form.costo || 0),
        }),
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.reload();
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Error al guardar el servicio");
      }

      onCreated?.();
      setForm(initialState);
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-2">

      <h5 className="mb-3 fw-bold text-dark">
        {servicioEdit ? "✏️ Editar Servicio de Terceros" : "➕ Registrar Servicio de Terceros"}
      </h5>

      {error && (
        <div className="alert alert-danger py-2 small shadow-sm">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {/* INSTRUMENTO CON BÚSQUEDA PREDICTIVA */}
      <div className="position-relative mb-3">
        <div className="form-floating">
          <input
            type="text"
            className="form-control"
            id="busquedaInstrumento"
            placeholder="Buscar instrumento..."
            value={busquedaInstrumento}
            onChange={(e) => {
              setBusquedaInstrumento(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            autoComplete="off"
          />
          <label htmlFor="busquedaInstrumento">Instrumento *</label>
        </div>

        {/* DROPDOWN */}
        {showDropdown && busquedaInstrumento && (
          <div
            className="list-group position-absolute w-100 shadow rounded-3 mt-1 overflow-hidden"
            style={{ zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}
          >
            {instrumentosFiltrados.length === 0 ? (
              <div className="list-group-item text-muted small py-2">
                Sin resultados encontrados
              </div>
            ) : (
              instrumentosFiltrados.map((i) => (
                <button
                  key={i._id}
                  type="button"
                  className="list-group-item list-group-item-action small py-2"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      instrumento: i._id,
                    }));

                    setBusquedaInstrumento(
                      `${i.descripcion} - SN ${i.numeroSerie}`
                    );

                    setShowDropdown(false);
                  }}
                >
                  <i className="bi bi-cpu text-muted me-1"></i>
                  {i.descripcion} — <span className="text-muted">SN: {i.numeroSerie}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* PROVEEDOR */}
      <div className="form-floating mb-3">
        <input
          id="proveedor"
          name="proveedor"
          className="form-control"
          placeholder="Proveedor"
          value={form.proveedor}
          onChange={handleChange}
          required
        />
        <label htmlFor="proveedor">Proveedor *</label>
      </div>

      {/* TIPO SERVICIO */}
      <div className="form-floating mb-3">
        <input
          id="tipoServicio"
          name="tipoServicio"
          className="form-control"
          placeholder="Tipo de Servicio"
          value={form.tipoServicio}
          onChange={handleChange}
          required
        />
        <label htmlFor="tipoServicio">Tipo de Servicio *</label>
      </div>

      {/* DESCRIPCIÓN */}
      <div className="form-floating mb-3">
        <textarea
          id="descripcion"
          name="descripcion"
          className="form-control"
          placeholder="Descripción"
          value={form.descripcion}
          onChange={handleChange}
          style={{ height: "90px" }}
        />
        <label htmlFor="descripcion">Descripción de las tareas realizadas</label>
      </div>

      {/* FECHA */}
      <div className="form-floating mb-3">
        <input
          id="fechaServicio"
          name="fechaServicio"
          className="form-control"
          type="date"
          value={form.fechaServicio}
          onChange={handleChange}
          required
        />
        <label htmlFor="fechaServicio">Fecha de Servicio *</label>
      </div>

      {/* COSTO */}
      <div className="form-floating mb-4">
        <input
          id="costo"
          name="costo"
          className="form-control"
          type="number"
          step="0.01"
          min="0"
          placeholder="Costo"
          value={form.costo}
          onChange={handleChange}
        />
        <label htmlFor="costo">Costo (\$)</label>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="d-flex justify-content-end gap-2 pt-2 border-top">
        <button
          type="button"
          className="btn btn-outline-secondary px-3"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </button>

        <button
          type="submit"
          className="btn btn-primary px-4 shadow-sm"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              Guardando...
            </>
          ) : servicioEdit ? (
            "Actualizar Servicio"
          ) : (
            "Registrar Servicio"
          )}
        </button>
      </div>

    </form>
  );
}