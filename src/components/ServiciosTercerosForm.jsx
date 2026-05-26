import { useEffect, useState, useCallback } from "react";

//const API_URL = "http://localhost:3000";
const API_URL = "https://sistemast.onrender.com";

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
  const instrumentosFiltrados = instrumentos.filter((i) => {
  
    const texto = `${i.descripcion} ${i.numeroSerie}`.toLowerCase();
    return texto.includes(busquedaInstrumento.toLowerCase());
  });
  
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

    // 👇 mostrar texto del instrumento seleccionado
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
    <form onSubmit={handleSubmit}>

      <h5 className="mb-3">
        {servicioEdit ? "✏️ Editar Servicio" : "➕ Crear Servicio"}
      </h5>

      {error && (
        <div className="alert alert-danger py-2">
          {error}
        </div>
      )}

      {/* INSTRUMENTO */}
      <div className="position-relative mb-3">

        <div className="form-floating">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar instrumento..."
          value={busquedaInstrumento}
          onChange={(e) => {
            setBusquedaInstrumento(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
        />
        <label htmlFor="instrumento">Instrumento</label>
        </div>

        {/* DROPDOWN */}
        {showDropdown && busquedaInstrumento && (
          <div
            className="list-group position-absolute w-100 shadow"
            style={{ zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}
          >
            {instrumentosFiltrados.length === 0 && (
              <div className="list-group-item text-muted">
                Sin resultados
              </div>
            )}

            {instrumentosFiltrados.map((i) => (
              <button
                key={i._id}
                type="button"
                className="list-group-item list-group-item-action"
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
                {i.descripcion} - SN {i.numeroSerie}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* PROVEEDOR */}
      <div className="form-floating">
      <input
        id="proveedor"
        name="proveedor"
        className="form-control mb-2"
        placeholder="Proveedor"
        value={form.proveedor}
        onChange={handleChange}
        required
      />
      <label htmlFor="proveedor">Proveedor</label>
      </div>

      {/* TIPO SERVICIO */}
      <div className="form-floating">
      <input
        id="tipoServicio"
        name="tipoServicio"
        className="form-control mb-2"
        placeholder="Tipo de Servicio"
        value={form.tipoServicio}
        onChange={handleChange}
        required
      />
      <label htmlFor="tipoServicio">Tipo de Servicio</label>
      </div>

      {/* DESCRIPCIÓN */}
      <div className="form-floating">
      <textarea
        id="descripcion"
        name="descripcion"
        className="form-control mb-2"
        placeholder="Descripción"
        value={form.descripcion}
        onChange={handleChange}
        rows="2"
      />
      <label htmlFor="descripcion">Descripción</label>
      </div>

      {/* FECHA */}
      <div className="form-floating">
      <input
        id="fechaServicio"
        name="fechaServicio"
        className="form-control mb-2"
        type="date"
        value={form.fechaServicio}
        onChange={handleChange}
        required
      />
      <label htmlFor="fechaServicio">Fecha de Servicio</label>
      </div>

      {/* COSTO */}
      <div className="form-floating">
      <input
        id="costo"
        name="costo"
        className="form-control mb-3"
        type="number"
        step="0.01"
        min="0"
        placeholder="Costo"
        value={form.costo}
        onChange={handleChange}
      />
      <label htmlFor="costo">Costo</label>
      </div>

      <button
        className="btn btn-primary w-100"
        disabled={loading}
      >
        {loading
          ? "Guardando..."
          : servicioEdit
          ? "Actualizar"
          : "Guardar"}
      </button>

    </form>
  );
}