import { useState } from "react";
import { createCliente } from "../api/api";

export default function ClienteForm({ onClienteCreado }) {
  const [form, setForm] = useState({
    codigoCliente: "",
    nombre: "",
    direccion: "",
    email: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createCliente(form);

    setForm({
      codigoCliente: "",
      nombre: "",
      direccion: "",
      email: "",
    });

    onClienteCreado();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4 className="mb-3">➕ Nuevo Cliente</h4>

      <div className="row g-2">
        <div className="col-md-6">
          <input
            className="form-control"
            name="codigoCliente"
            placeholder="Código"
            value={form.codigoCliente}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <input
            className="form-control"
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <input
            className="form-control"
            name="direccion"
            placeholder="Dirección"
            value={form.direccion}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <input
            className="form-control"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />
        </div>
      </div>

      <button className="btn btn-primary mt-3 w-100">
        Guardar Cliente
      </button>
    </form>
  );
}