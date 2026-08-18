import { useEffect, useState } from "react";
import {
  getClientes,
  createInstrumento,
  updateInstrumento,
} from "../api/api";

const initialForm = {
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

  // Cliente
  const [clienteSearch, setClienteSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isEdit = Boolean(instrumento?._id);

  // ======================================================
  // CLIENTES
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
  // CARGAR FORMULARIO
  // ======================================================

  useEffect(() => {
    if (instrumento) {
      setClienteSearch(instrumento.cliente?.nombre || "");

      setForm({
        numeroSerie: instrumento.numeroSerie || "",
        numeroPartida: instrumento.numeroPartida || "",
        descripcion: instrumento.descripcion || "",
        condicion: instrumento.condicion || "",
        cliente: instrumento.cliente?._id || "",
        fechaUltimoMantenimiento:
          instrumento.fechaUltimoMantenimiento?.slice(0, 10) || "",
      });
    } else {
      setForm(initialForm);
      setClienteSearch("");
    }

    setErrors({});
  }, [instrumento]);

  // ======================================================
  // CLIENTES FILTRADOS
  // ======================================================

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre
      .toLowerCase()
      .includes(clienteSearch.toLowerCase())
  );

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
  // LIMPIAR CLIENTE
  // ======================================================

  const limpiarCliente = () => {
    setClienteSearch("");

    setForm((prev) => ({
      ...prev,
      cliente: "",
    }));
  };

  // ======================================================
  // SIN MANTENIMIENTO
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
        numeroSerie: form.numeroSerie?.trim(),
        numeroPartida:
          form.numeroPartida?.trim() || null,
        descripcion: form.descripcion?.trim(),
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
  // ESTADO DEL MANTENIMIENTO
  // ======================================================

  const mantenimientoRegistrado =
    Boolean(form.fechaUltimoMantenimiento);

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <form
      onSubmit={handleSubmit}
      className="card p-3 shadow-sm"
    >
      {/* TÍTULO */}

      <h5 className="mb-3">
        {isEdit
          ? "✏️ Editar Instrumento"
          : "🧰 Nuevo Instrumento"}
      </h5>

      {/* ERROR GENERAL */}

      {errors.general && (
        <div className="alert alert-danger py-2 mb-2">
          {errors.general}
        </div>
      )}

      {/* ==================================================
          SERIE + PARTIDA
      ================================================== */}

      <div className="row g-2 mb-2">

        <div className="col-md-6">
          <div className="form-floating">
            <input
              className={`form-control ${
                errors.numeroSerie
                  ? "is-invalid"
                  : ""
              }`}
              name="numeroSerie"
              placeholder="Número de Serie"
              value={form.numeroSerie}
              onChange={handleChange}
            />

            <label>Número de Serie</label>
          </div>

          {errors.numeroSerie && (
            <div className="text-danger small mt-1">
              {errors.numeroSerie}
            </div>
          )}
        </div>

        <div className="col-md-6">
          <div className="form-floating">
            <input
              className="form-control"
              name="numeroPartida"
              placeholder="Número de Partida"
              value={form.numeroPartida}
              onChange={handleChange}
            />

            <label>Número de Partida</label>
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
                errors.descripcion
                  ? "is-invalid"
                  : ""
              }`}
              name="descripcion"
              placeholder="Descripción"
              value={form.descripcion}
              onChange={handleChange}
            />

            <label>Descripción</label>
          </div>

          {errors.descripcion && (
            <div className="text-danger small mt-1">
              {errors.descripcion}
            </div>
          )}
        </div>

        <div className="col-md-4">
          <div className="form-floating">
            <select
              className="form-select"
              name="condicion"
              value={form.condicion}
              onChange={handleChange}
            >
              <option value="">
                Seleccionar
              </option>
              <option value="Comodato">
                Comodato
              </option>
              <option value="Propio">
                Propio
              </option>
              <option value="Prestado">
                Prestado
              </option>
              <option value="Alquilado">
                Alquilado
              </option>
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
              className="form-control"
              placeholder="Cliente"
              value={clienteSearch}
              onChange={(e) => {
                setClienteSearch(e.target.value);
                setShowSuggestions(true);

                setForm((prev) => ({
                  ...prev,
                  cliente: "",
                }));
              }}
              onFocus={() =>
                setShowSuggestions(true)
              }
              onBlur={() => {
                setTimeout(
                  () =>
                    setShowSuggestions(false),
                  200
                );
              }}
            />

            <label>Cliente</label>

          </div>

          {clienteSearch && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={limpiarCliente}
              title="Quitar cliente"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}

        </div>

        {/* SUGERENCIAS */}

        {showSuggestions &&
          clienteSearch && (
            <ul className="list-group position-absolute w-100 z-3 shadow-sm">

              {clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((c) => (
                  <li
                    key={c._id}
                    className="list-group-item list-group-item-action py-2"
                    style={{
                      cursor: "pointer",
                    }}
                    onMouseDown={() => {
                      setForm((prev) => ({
                        ...prev,
                        cliente: c._id,
                      }));

                      setClienteSearch(
                        c.nombre
                      );

                      setShowSuggestions(false);
                    }}
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

      <div className="row g-2 align-items-center mb-2">

        <div className="col-md-7">

          <div className="form-floating">

            <input
              type="date"
              className="form-control"
              name="fechaUltimoMantenimiento"
              value={
                form.fechaUltimoMantenimiento
              }
              onChange={handleChange}
            />

            <label>
              Fecha último mantenimiento
            </label>

          </div>

        </div>

        <div className="col-md-5">

          {mantenimientoRegistrado ? (
            <div className="d-flex align-items-center justify-content-between border rounded px-2 py-2">

              <span className="text-success small">
                <i className="bi bi-check-circle-fill me-1"></i>
                Mantenimiento registrado
              </span>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={marcarSinMantenimiento}
                title="Quitar mantenimiento"
              >
                <i className="bi bi-x-lg"></i>
              </button>

            </div>
          ) : (
            <div className="d-flex align-items-center justify-content-between border rounded px-2 py-2">

              <span className="text-secondary small">
                <i className="bi bi-circle me-1"></i>
                Sin mantenimiento
              </span>

              <span className="badge bg-secondary">
                Sin fecha
              </span>

            </div>
          )}

        </div>

      </div>

      {/* ==================================================
          BOTONES
      ================================================== */}

      <div className="d-flex gap-2 mt-2">

        <button
          type="submit"
          className={`btn ${
            isEdit
              ? "btn-warning"
              : "btn-success"
          } flex-fill`}
          disabled={loading}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-1"
              ></span>
              Guardando...
            </>
          ) : isEdit ? (
            <>
              <i className="bi bi-check-lg me-1"></i>
              Actualizar
            </>
          ) : (
            <>
              <i className="bi bi-plus-lg me-1"></i>
              Crear
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