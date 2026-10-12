import { useEffect, useState } from "react";
import { createCliente, updateCliente } from "../api/api";

const initialState = {
  codigoCliente: "",
  nombre: "",
  direccion: "",
  email: "",
};

export default function ClienteForm({
  onClienteCreado,
  clienteEditando,
  onClienteGuardado,
  onClose = () => {},
}) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = Boolean(clienteEditando?._id);

  // 👉 CARGAR DATOS AL EDITAR
  useEffect(() => {
    if (clienteEditando) {
      setForm({
        codigoCliente: clienteEditando.codigoCliente || "",
        nombre: clienteEditando.nombre || "",
        direccion: clienteEditando.direccion || "",
        email: clienteEditando.email || "",
      });
    } else {
      setForm(initialState);
    }
    setError("");
  }, [clienteEditando]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      setError("");

      let result;
      if (isEdit) {
        // ✏️ EDITAR
        result = await updateCliente(clienteEditando._id, form);
        onClienteGuardado?.(result);
      } else {
        // ➕ CREAR
        result = await createCliente(form);
        onClienteCreado?.(result);
      }

      onClose?.();
      setForm(initialState);
    } catch (err) {
      console.error("Error guardando cliente:", err);
      setError(
        err?.response?.data?.error ||
        err?.message ||
        "Error al guardar el cliente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-2">
      <h4 className="mb-3 fw-bold text-dark">
        {isEdit ? "✏️ Editar Cliente" : "➕ Nuevo Cliente"}
      </h4>

      {error && (
        <div className="alert alert-danger py-2 px-3 small shadow-sm mb-3">
          <i className="bi bi-exclamation-triangle-fill me-1"></i> {error}
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-6 form-floating">
          <input
            className="form-control"
            name="codigoCliente"
            placeholder="Código"
            value={form.codigoCliente}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <label>Código *</label>
        </div>

        <div className="col-md-6 form-floating">
          <input
            className="form-control"
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            required
            disabled={loading}
          />
          <label>Nombre *</label>
        </div>

        <div className="col-md-6 form-floating">
          <input
            className="form-control"
            name="direccion"
            placeholder="Dirección"
            value={form.direccion}
            onChange={handleChange}
            disabled={loading}
          />
          <label>Dirección</label>
        </div>

        <div className="col-md-6 form-floating">
          <input
            type="email"
            className="form-control"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
          />
          <label>Email</label>
        </div>
      </div>

      <div className="d-flex gap-2 pt-2 border-top">
      <button
          type="button"
          className="btn btn-secondary flex-fill py-2 fw-semibold shadow-sm"
          onClick={(e) => {
            e.preventDefault();
            onClose(); // Como ya tiene un valor por defecto, nunca será undefined
          }}
          disabled={loading}
        >
          <i className="bi bi-x-lg me-1"></i>
          Cancelar
        </button>

        <button
          type="submit"
          className="btn btn-primary flex-fill py-2 fw-semibold shadow-sm"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Guardando...
            </>
          ) : (
            <>
              <i className={`bi ${isEdit ? "bi-check-lg" : "bi-plus-lg"} me-1`}></i>
              {isEdit ? "Actualizar" : "Guardar Cliente"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}