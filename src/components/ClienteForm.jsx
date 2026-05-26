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
}) {
  const [form, setForm] = useState(initialState);

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
  }, [clienteEditando]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let result;
      if (clienteEditando?._id) {
        // ✏️ EDITAR
        result = await updateCliente(clienteEditando._id, form);
        onClienteGuardado?.(result);
      } else {
        // ➕ CREAR
        result = await createCliente(form);

        onClienteCreado?.();
      }

      setForm(initialState);
    } catch (err) {
      console.error("Error guardando cliente:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4 className="mb-3">
        {clienteEditando ? "✏️ Editar Cliente" : "➕ Nuevo Cliente"}
      </h4>

      <div className="row g-2">
        <div className="col-md-6 form-floating">
          <input
            className="form-control"
            name="codigoCliente"
            placeholder="Código"
            value={form.codigoCliente}
            onChange={handleChange}
            required
          />
          <label>Código</label>
        </div>

        <div className="col-md-6 form-floating">
          <input
            className="form-control"
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            required
          />
          <label>Nombre</label>
        </div>

        <div className="col-md-6 form-floating">
          <input
            className="form-control"
            name="direccion"
            placeholder="Dirección"
            value={form.direccion}
            onChange={handleChange}
          />
          <label>Dirección</label>
        </div>

        <div className="col-md-6 form-floating">
          <input
            className="form-control"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />
          <label>Email</label>
        </div>
      </div>

      <button className="btn btn-primary mt-3 w-100">
        {clienteEditando ? "Actualizar" : "Guardar Cliente"}
      </button>
    </form>
  );
}