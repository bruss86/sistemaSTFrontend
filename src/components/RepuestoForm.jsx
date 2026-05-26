import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;
//const API_URL = "http://localhost:3000";
//const API_URL = "https://sistemast.onrender.com";

const initialState = {
  nombre: "",
  codigo: "",
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
          stockMinimo: Number(form.stockMinimo) || 0,
        }),
      });

      if (!res.ok) {
        throw new Error("Error guardando repuesto");
      }

      await res.json();

      // ✅ refrescar lista
      onCreated?.();

      // ✅ cerrar modal
      onClose?.();

      // ✅ limpiar form
      setForm(initialState);

      // ✅ toast / alerta
      alert(
        isEdit
          ? "Repuesto actualizado correctamente"
          : "Repuesto creado correctamente"
      );
    } catch (err) {
      console.error(err);

      alert("Ocurrió un error al guardar");
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

      {/* NOMBRE */}
      <div className="mb-2">
        <label className="form-label">
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

      {/* CÓDIGO */}
      <div className="mb-2">
        <label className="form-label">
          Código
        </label>

        <input
          className="form-control"
          name="codigo"
          value={form.codigo}
          onChange={handleChange}
        />
      </div>

      {/* DESCRIPCIÓN */}
      <div className="mb-2">
        <label className="form-label">
          Descripción
        </label>

        <textarea
          className="form-control"
          name="descripcion"
          rows={3}
          value={form.descripcion}
          onChange={handleChange}
        />
      </div>

      {/* STOCK */}
      <div className="mb-2">
        <label className="form-label">
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

      {/* STOCK MÍNIMO */}
      <div className="mb-3">
        <label className="form-label">
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

      {/* BOTONES */}
      <div className="d-flex gap-2">
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