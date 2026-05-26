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

  //--------------------------------- ESTADOS PARA SUGGESTION DE CLIENTES ------------------------------const [clienteSearch, setClienteSearch] = useState("");
  const [clienteSearch, setClienteSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(clienteSearch.toLowerCase())
  );
  //-------------------------------------------------------------------------------------------------------

  const isEdit = Boolean(instrumento?._id);

  // 📥 CLIENTES
  useEffect(() => {
    const cargarClientes = async () => {
      const data = await getClientes();
      setClientes(data || []);
    };

    cargarClientes();
  }, []);

  // ✏️ CARGAR FORM EN EDIT
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
    }
  }, [instrumento]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

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
        numeroPartida: form.numeroPartida?.trim() || null,
        descripcion: form.descripcion?.trim(),
        condicion: form.condicion || null,
        cliente: form.cliente || null,
        fechaUltimoMantenimiento: form.fechaUltimoMantenimiento || null,
      };

      if (isEdit) {
        const updated = await updateInstrumento(instrumento._id, payload);
        onUpdated?.(updated);
        onRefresh?.();
        onClose?.(); 
      } else {
        const created = await createInstrumento(payload);
        onCreated?.(created);
        onRefresh?.();
        onClose?.(); 
      }

      setForm(initialForm);
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

  return (
    <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
      <h4 className="mb-3">
        {isEdit ? "✏️ Editar Instrumento" : "🧰 Nuevo Instrumento"}
      </h4>

      {errors.general && (
        <div className="alert alert-danger py-2">{errors.general}</div>
      )}
      <div className="mb-3 form-floating">
      <input
        className={`form-control ${errors.numeroSerie ? "is-invalid" : ""}`}
        name="numeroSerie"
        placeholder="Número de Serie"
        value={form.numeroSerie}
        onChange={handleChange}
      />
      <label htmlFor="floatingInput">Número de Serie</label>
      </div>
      {errors.numeroSerie && (
        <div className="invalid-feedback">{errors.numeroSerie}</div>
      )}
      <div className="mb-3 form-floating">
      <input
        className="form-control"
        name="numeroPartida"
        placeholder="Número de Partida"
        value={form.numeroPartida}
        onChange={handleChange}
      />
      <label htmlFor="floatingInput">Número de Partida</label>
      </div>

      <div className="mb-3 form-floating">
      <input
        className={`form-control ${
          errors.descripcion ? "is-invalid" : ""
        }`}
        name="descripcion"
        placeholder="Descripción"
        value={form.descripcion}
        onChange={handleChange}
      />
      <label htmlFor="floatingInput">Descripción</label>
      </div>

      {errors.descripcion && (
        <div className="invalid-feedback">{errors.descripcion}</div>
      )}
      <div className="mb-3 form-floating">
      <select
        className="form-select"
        name="condicion"
        value={form.condicion}
        onChange={handleChange}
      >
        <option value="Comodato">Comodato</option>
        <option value="Propio">Propio</option>
        <option value="Alquilado">Alquilado</option>
      </select>
      <label htmlFor="floatingSelect">Condición</label>
      </div>

      <div className="mb-3 position-relative">
        <input
          className="form-control"
          placeholder="Buscar cliente..."
          value={clienteSearch}
          onChange={(e) => {
            setClienteSearch(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
        />

        {showSuggestions && clienteSearch && (
          <ul className="list-group position-absolute w-100 z-3">
            {clientesFiltrados.length > 0 ? (
              clientesFiltrados.map((c) => (
                <li
                  key={c._id}
                  className="list-group-item list-group-item-action"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      cliente: c._id,
                    }));
                    setClienteSearch(c.nombre);
                    setShowSuggestions(false);
                  }}
                >
                  {c.nombre}
                </li>
              ))
            ) : (
              <li className="list-group-item text-muted">
                Sin resultados
              </li>
            )}
          </ul>
        )}
      </div>
      
      <div className="mb-3 form-floating">
      <input
        type="date"
        className="form-control"
        name="fechaUltimoMantenimiento"
        value={form.fechaUltimoMantenimiento}
        onChange={handleChange}
      />
      <label htmlFor="floatingInput">Fecha Último Mantenimiento</label>
      </div>

      <button
        className={`btn w-100 mt-3 ${
          isEdit ? "btn-warning" : "btn-success"
        }`}
        disabled={loading}
      >
        {loading
          ? "Guardando..."
          : isEdit
          ? "Actualizar"
          : "Crear"}
      </button>
    </form>
  );
}