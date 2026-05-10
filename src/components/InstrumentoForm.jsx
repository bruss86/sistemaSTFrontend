import { useEffect, useState } from "react";
import { getClientes, createInstrumento } from "../api/api";

export default function InstrumentoForm({ onCreated }) {
  const [clientes, setClientes] = useState([]);

  const [form, setForm] = useState({
    numeroSerie: "",
    numeroPartida: "",
    descripcion: "",
    condicion: "",
    cliente: "",
    fechaUltimoMantenimiento: "",
 });

  useEffect(() => {
    const cargarClientes = async () => {
      const data = await getClientes();
      setClientes(data);
    };

    cargarClientes();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  console.log("FORM ENVIADO:", form);

  await createInstrumento(form);

  setForm({
    numeroSerie: "",
    numeroPartida: "",
    descripcion: "",
    cliente: "",
    fechaUltimoMantenimiento: "",
  });

  onCreated?.();
};

  return (
    <form onSubmit={handleSubmit} className="card p-3 shadow-sm">
      <h4>🧰 Nuevo Instrumento</h4>

      <input
        className="form-control my-1"
        name="numeroSerie"
        placeholder="Número de serie"
        value={form.numeroSerie}
        onChange={handleChange}
      />

      <input
        className="form-control my-1"
        name="numeroPartida"
        placeholder="Número de partida"
        value={form.numeroPartida}
        onChange={handleChange}
      />

      <input
        className="form-control my-1"
        name="descripcion"
        placeholder="Descripción"
        value={form.descripcion}
        onChange={handleChange}
      />

      <select
        className="form-control my-1"
        name="condicion"
        value={form.condicion}
        onChange={handleChange}
        >
        <option value="">Seleccionar condición</option>
        <option value="Comodato">Comodato</option>
        <option value="Propio">Propio</option>
        <option value="Alquilado">Alquilado</option>
     </select>

      {/* 👇 SELECT CLIENTE */}
      <select
        className="form-control my-1"
        name="cliente"
        value={form.cliente}
        onChange={handleChange}
      >
        <option value="">Seleccionar cliente</option>
        {clientes.map((c) => (
          <option key={c._id} value={c._id}>
            {c.nombre} ({c.codigoCliente})
          </option>
        ))}
      </select>

      <input
        type="date"
        className="form-control my-1"
        name="fechaUltimoMantenimiento"
        value={form.fechaUltimoMantenimiento}
        onChange={handleChange}
      />

      <button type="submit" className="btn btn-success w-100 mt-2">
        Crear Instrumento
      </button>
    </form>
  );
}