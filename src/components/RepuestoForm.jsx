import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const initialState = {
  nombre: "",
  codigo: "",
  fabricante: "",
  modelo: "",
  descripcion: "",
  stock: 0,
  stockMinimo: 0,
};

export default function RepuestoForm({
  repuesto,
  onClose,
  onCreated,
}) {
  const isEdit = !!repuesto;

  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  // 📌 Cargar datos en edición
  useEffect(() => {
    if (repuesto) {
      setForm({
        nombre: repuesto.nombre || "",
        codigo: repuesto.codigo || "",
        fabricante: repuesto.fabricante || "",
        modelo: repuesto.modelo || "",
        descripcion: repuesto.descripcion || "",
        stock: repuesto.stock ?? 0,
        stockMinimo: repuesto.stockMinimo ?? 0,
      });
    } else {
      setForm(initialState);
    }
  }, [repuesto]);

  // 📌 Inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "stock" || name === "stockMinimo"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  // 📌 Guardar
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    setLoading(true);

    try {
      const url = isEdit
        ? `${API_URL}/repuestos/${repuesto._id}`
        : `${API_URL}/repuestos`;

      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          stock: Number(form.stock) || 0,
          stockMinimo:
            Number(form.stockMinimo) || 0,
        }),
      });

      if (!res.ok) {
        throw new Error(
          "Error guardando repuesto"
        );
      }

      await res.json();

      onCreated?.();
      onClose?.();

      setForm(initialState);

      alert(
        isEdit
          ? "Repuesto actualizado correctamente"
          : "Repuesto creado correctamente"
      );
    } catch (err) {
      console.error(err);

      alert(
        "Ocurrió un error al guardar"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>

  <h5 className="mb-3">
    {isEdit
      ? "✏️ Editar Repuesto"
      : "➕ Nuevo Repuesto"}
  </h5>

  {/* NOMBRE / CÓDIGO */}
  <div className="row g-2">

    <div className="col-md-8">
      <label className="form-label mb-1">
        Nombre
      </label>

      <input
        className="form-control"
        name="nombre"
        value={form.nombre}
        onChange={handleChange}
        required
        autoFocus
      />
    </div>

    <div className="col-md-4">
      <label className="form-label mb-1">
        Código
      </label>

      <input
        className="form-control"
        name="codigo"
        value={form.codigo}
        onChange={handleChange}
      />
    </div>

  </div>

  {/* FABRICANTE / MODELO */}
  <div className="row g-2 mt-1">

    <div className="col-md-6">
      <label className="form-label mb-1">
        Fabricante
      </label>

      <input
        className="form-control"
        name="fabricante"
        value={form.fabricante}
        onChange={handleChange}
      />
    </div>

    <div className="col-md-6">
      <label className="form-label mb-1">
        Modelo
      </label>

      <input
        className="form-control"
        name="modelo"
        value={form.modelo}
        onChange={handleChange}
      />
    </div>

  </div>

  {/* STOCK */}
  <div className="row g-2 mt-1">

    <div className="col-md-6">
      <label className="form-label mb-1">
        Stock
      </label>

      <input
        type="number"
        min="0"
        className="form-control"
        name="stock"
        value={form.stock}
        onChange={handleChange}
      />
    </div>

    <div className="col-md-6">
      <label className="form-label mb-1">
        Stock mínimo
      </label>

      <input
        type="number"
        min="0"
        className="form-control"
        name="stockMinimo"
        value={form.stockMinimo}
        onChange={handleChange}
      />
    </div>

  </div>

  {/* DESCRIPCIÓN */}
  <div className="mt-2">
    <label className="form-label mb-1">
      Descripción
    </label>

    <textarea
      className="form-control"
      name="descripcion"
      rows={2}
      value={form.descripcion}
      onChange={handleChange}
    />
  </div>

  {/* BOTONES */}
  <div className="d-flex gap-2 mt-3">

    <button
      type="submit"
      className="btn btn-primary w-100"
      disabled={loading}
    >
      {loading
        ? "Guardando..."
        : isEdit
        ? "Actualizar"
        : "Guardar"}
    </button>

    <button
      type="button"
      className="btn btn-secondary"
      onClick={onClose}
      disabled={loading}
    >
      Cancelar
    </button>

  </div>

</form>
  );
}