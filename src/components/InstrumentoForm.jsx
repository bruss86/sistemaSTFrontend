import { useEffect, useState } from "react";
import {
  getClientes,
  createInstrumento,
  updateInstrumento,
} from "../api/api";

const initialForm = {
  codigo: "",
  numeroSerie: "",
  numeroPartida: "",
  descripcion: "",
  condicion: "",
  cliente: "",
  fechaUltimoMantenimiento: "",
};

export default function InstrumentoForm({
  onCreated,
  onUpdated,
  onClose,
  instrumento,
  onRefresh,
}) {
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [clienteSearch, setClienteSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isEdit = Boolean(instrumento?._id);
  const mantenimientoRegistrado =
    Boolean(form.fechaUltimoMantenimiento);

  // ======================================================
  // CARGAR CLIENTES
  // ======================================================

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const data = await getClientes();
        setClientes(data || []);
      } catch (err) {
        console.error("Error al cargar clientes:", err);
      }
    };

    cargarClientes();
  }, []);

  // ======================================================
  // CARGAR / RESET FORMULARIO
  // ======================================================

  useEffect(() => {
    if (instrumento) {
      setForm({
        codigo: instrumento.codigo || "",
        numeroSerie: instrumento.numeroSerie || "",
        numeroPartida: instrumento.numeroPartida || "",
        descripcion: instrumento.descripcion || "",
        condicion: instrumento.condicion || "",
        cliente: instrumento.cliente?._id || "",
        fechaUltimoMantenimiento:
          instrumento.fechaUltimoMantenimiento?.slice(0, 10) || "",
      });

      setClienteSearch(
        instrumento.cliente?.nombre || ""
      );
    } else {
      setForm(initialForm);
      setClienteSearch("");
    }

    setErrors({});
  }, [instrumento]);

  // ======================================================
  // CLIENTES FILTRADOS
  // ======================================================

  const clientesFiltrados = clientes
    .filter((c) =>
      c.nombre
        ?.toLowerCase()
        .includes(clienteSearch.toLowerCase())
    )
    .slice(0, 8);

  // ======================================================
  // CAMBIOS
  // ======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // ======================================================
  // CLIENTE
  // ======================================================

  const seleccionarCliente = (cliente) => {
    setForm((prev) => ({
      ...prev,
      cliente: cliente._id,
    }));

    setClienteSearch(cliente.nombre);
    setShowSuggestions(false);
  };

  const limpiarCliente = () => {
    setClienteSearch("");

    setForm((prev) => ({
      ...prev,
      cliente: "",
    }));
  };

  const handleClienteChange = (e) => {
    const value = e.target.value;

    setClienteSearch(value);
    setShowSuggestions(true);

    // Al modificar el texto, deja de estar seleccionado
    setForm((prev) => ({
      ...prev,
      cliente: "",
    }));
  };

  // ======================================================
  // MANTENIMIENTO
  // ======================================================

  const marcarSinMantenimiento = () => {
    setForm((prev) => ({
      ...prev,
      fechaUltimoMantenimiento: "",
    }));
  };

  // ======================================================
  // VALIDACIÓN
  // ======================================================

  const validate = () => {
    const e = {};

    if (!form.numeroSerie.trim()) {
      e.numeroSerie = "Obligatorio";
    }

    if (!form.descripcion.trim()) {
      e.descripcion = "Obligatorio";
    }

    // Si hay texto de cliente pero no se seleccionó
    if (clienteSearch.trim() && !form.cliente) {
      e.cliente = "Seleccione un cliente de la lista";
    }

    return e;
  };

  // ======================================================
  // GUARDAR
  // ======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const validation = validate();

    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        codigo: form.codigo.trim(),
        numeroSerie: form.numeroSerie.trim(),
        numeroPartida:
          form.numeroPartida.trim() || null,
        descripcion: form.descripcion.trim(),
        condicion: form.condicion || null,
        cliente: form.cliente || null,
        fechaUltimoMantenimiento:
          form.fechaUltimoMantenimiento || null,
      };

      if (isEdit) {
        const updated = await updateInstrumento(
          instrumento._id,
          payload
        );

        onUpdated?.(updated);
      } else {
        const created = await createInstrumento(payload);

        onCreated?.(created);
      }

      onRefresh?.();
      onClose?.();

      setForm(initialForm);
      setClienteSearch("");
      setErrors({});

    } catch (err) {
      setErrors({
        general:
          err?.response?.data?.error ||
          err?.message ||
          "Error al guardar",
      });
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <form
      onSubmit={handleSubmit}
      className="card p-3 shadow-sm"
    >
      {/* TÍTULO */}

      <h5 className="mb-2">
        {isEdit
          ? "✏️ Editar Instrumento"
          : "🧰 Nuevo Instrumento"}
      </h5>

      {/* ERROR GENERAL */}

      {errors.general && (
        <div className="alert alert-danger py-1 px-2 mb-2 small">
          {errors.general}
        </div>
      )}

      {/* ==================================================
          CÓDIGO + SERIE + PARTIDA
      ================================================== */}

      <div className="row g-2 mb-2">

        <div className="col-md-4">
          <div className="form-floating">
            <input
              className="form-control"
              name="codigo"
              placeholder="Código"
              value={form.codigo}
              onChange={handleChange}
            />
            <label>Código</label>
          </div>
        </div>

        <div className="col-md-4">
          <div className="form-floating">
            <input
              className={`form-control ${
                errors.numeroSerie ? "is-invalid" : ""
              }`}
              name="numeroSerie"
              placeholder="Número de Serie"
              value={form.numeroSerie}
              onChange={handleChange}
            />
            <label>Serie</label>
          </div>
        </div>

        <div className="col-md-4">
          <div className="form-floating">
            <input
              className="form-control"
              name="numeroPartida"
              placeholder="Número de Partida"
              value={form.numeroPartida}
              onChange={handleChange}
            />
            <label>Partida</label>
          </div>
        </div>

      </div>

      {/* ==================================================
          DESCRIPCIÓN + CONDICIÓN
      ================================================== */}

      <div className="row g-2 mb-2">

        <div className="col-md-8">
          <div className="form-floating">
            <input
              className={`form-control ${
                errors.descripcion ? "is-invalid" : ""
              }`}
              name="descripcion"
              placeholder="Descripción"
              value={form.descripcion}
              onChange={handleChange}
            />
            <label>Descripción *</label>
          </div>
        </div>

        <div className="col-md-4">
          <div className="form-floating">
            <select
              className="form-select"
              name="condicion"
              value={form.condicion}
              onChange={handleChange}
            >
              <option value="">Seleccionar</option>
              <option value="Comodato">Comodato</option>
              <option value="Propio">Propio</option>
              <option value="Prestado">Prestado</option>
              <option value="Alquilado">Alquilado</option>
            </select>

            <label>Condición</label>
          </div>
        </div>

      </div>

      {/* ==================================================
          CLIENTE
      ================================================== */}

      <div className="mb-2 position-relative">

        <div className="input-group">

          <div className="form-floating flex-grow-1">

            <input
              className={`form-control ${
                errors.cliente ? "is-invalid" : ""
              }`}
              placeholder="Cliente"
              value={clienteSearch}
              onChange={handleClienteChange}
              onFocus={() => {
                if (clienteSearch) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(
                  () => setShowSuggestions(false),
                  200
                );
              }}
            />

            <label>Cliente</label>

          </div>

          {clienteSearch && (
            <button
              type="button"
              className="btn btn-outline-secondary px-3"
              onClick={limpiarCliente}
              title="Quitar cliente"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}

        </div>

        {errors.cliente && (
          <div className="text-danger small mt-1">
            {errors.cliente}
          </div>
        )}

        {/* SUGERENCIAS */}

        {showSuggestions && clienteSearch && (
          <ul
            className="list-group position-absolute w-100 z-3 shadow-sm"
            style={{ maxHeight: "220px", overflowY: "auto" }}
          >
            {clientesFiltrados.length > 0 ? (
              clientesFiltrados.map((c) => (
                <li
                  key={c._id}
                  className="list-group-item list-group-item-action py-2"
                  style={{ cursor: "pointer" }}
                  onMouseDown={() =>
                    seleccionarCliente(c)
                  }
                >
                  {c.nombre}
                </li>
              ))
            ) : (
              <li className="list-group-item text-muted py-2">
                Sin resultados
              </li>
            )}
          </ul>
        )}

      </div>

      {/* ==================================================
          MANTENIMIENTO
      ================================================== */}

      <div className="row g-2 mb-2">

        <div className="col-md-7">

          <div className="form-floating">

            <input
              type="date"
              className="form-control"
              name="fechaUltimoMantenimiento"
              value={form.fechaUltimoMantenimiento}
              onChange={handleChange}
            />

            <label>Último mantenimiento</label>

          </div>

        </div>

        <div className="col-md-5">

          <div
            className={`h-100 d-flex align-items-center justify-content-between border rounded px-2 ${
              mantenimientoRegistrado
                ? "border-success"
                : ""
            }`}
          >

            <span
              className={
                mantenimientoRegistrado
                  ? "text-success small"
                  : "text-secondary small"
              }
            >
              <i
                className={`bi ${
                  mantenimientoRegistrado
                    ? "bi-check-circle-fill"
                    : "bi-circle"
                } me-1`}
              ></i>

              {mantenimientoRegistrado
                ? "Mantenimiento registrado"
                : "Sin mantenimiento"}
            </span>

            {mantenimientoRegistrado && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary py-0 px-2"
                onClick={marcarSinMantenimiento}
                title="Quitar mantenimiento"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}

          </div>

        </div>

      </div>

      {/* ==================================================
          BOTONES
      ================================================== */}

      <div className="d-flex gap-2 mt-1">

        <button
          type="submit"
          className={`btn ${
            isEdit ? "btn-warning" : "btn-success"
          } flex-fill`}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-1" />
              Guardando...
            </>
          ) : (
            <>
              <i
                className={`bi ${
                  isEdit
                    ? "bi-check-lg"
                    : "bi-plus-lg"
                } me-1`}
              ></i>

              {isEdit ? "Actualizar" : "Crear"}
            </>
          )}
        </button>

        <button
          type="button"
          className="btn btn-secondary flex-fill"
          onClick={onClose}
          disabled={loading}
        >
          <i className="bi bi-x-lg me-1"></i>
          Cancelar
        </button>

      </div>
    </form>
  );
}
