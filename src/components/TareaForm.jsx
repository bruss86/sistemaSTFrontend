import { useEffect, useState, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL;
//const API_URL = "http://localhost:3000";
//const API_URL = "https://sistemast.onrender.com";

const initialState = {
  cliente: "",
  instrumento: "",
  tarea: "",
  fecha: "",
  prioridad: "Media",
  estado: "Pendiente",
  responsable: "",
  notas: "",
};

export default function TareaForm({
  clientes = [],
  tareaEdit,
  onCreated,
  onClose,
  showToast,
}) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const [clienteSearch, setClienteSearch] = useState("");
  const [showClienteDropdown, setShowClienteDropdown] =
    useState(false);

  const [instrumentosCliente, setInstrumentosCliente] =
    useState([]);

  const clienteRef = useRef(null);

  const token = localStorage.getItem("token");

  // =========================
  // CERRAR DROPDOWN AFUERA
  // =========================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        clienteRef.current &&
        !clienteRef.current.contains(e.target)
      ) {
        setShowClienteDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =========================
  // LOAD EDIT
  // =========================
  useEffect(() => {
    if (!tareaEdit) {
      setForm(initialState);
      setClienteSearch("");
      return;
    }

    const cliente =
      typeof tareaEdit.cliente === "object"
        ? tareaEdit.cliente
        : clientes.find((c) => c._id === tareaEdit.cliente);

    const instrumentoId =
      typeof tareaEdit.instrumento === "object"
        ? tareaEdit.instrumento?._id
        : tareaEdit.instrumento;

    setForm({
      cliente: cliente?._id || "",
      instrumento: instrumentoId || "",
      tarea: tareaEdit.tarea || "",
      fecha: tareaEdit.fecha
        ? tareaEdit.fecha.substring(0, 10)
        : "",
      prioridad: tareaEdit.prioridad || "Media",
      estado: tareaEdit.estado || "Pendiente",
      responsable: tareaEdit.responsable || "",
      notas: tareaEdit.notas || "",
    });

    setClienteSearch(cliente?.nombre || "");
  }, [tareaEdit, clientes]);

  // =========================
  // FETCH INSTRUMENTOS
  // =========================
  useEffect(() => {
    if (!form.cliente) {
      setInstrumentosCliente([]);
      return;
    }

    const fetchInstrumentos = async () => {
      try {
        const res = await fetch(
          `${API_URL}/instrumentos/cliente/${form.cliente}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok)
          throw new Error("Error cargando instrumentos");

        const data = await res.json();

        setInstrumentosCliente(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchInstrumentos();
  }, [form.cliente, token]);

  // =========================
  // FILTRADO CLIENTES
  // =========================
  const filteredClientes = clientes.filter((c) =>
    c.nombre
      .toLowerCase()
      .includes(clienteSearch.toLowerCase())
  );

  // =========================
  // VALIDACIÓN
  // =========================
  const isValid =
    form.tarea.trim() &&
    form.cliente &&
    form.instrumento &&
    form.fecha;

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValid || loading) return;

    try {
      setLoading(true);

      const url = tareaEdit
        ? `${API_URL}/tareas/${tareaEdit._id}`
        : `${API_URL}/tareas`;

      const method = tareaEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Error al guardar tarea"
        );
      }

      showToast?.(
        tareaEdit
          ? "Tarea actualizada correctamente"
          : "Tarea creada correctamente",
        "success"
      );

      setForm(initialState);
      setClienteSearch("");

      onCreated?.();
      onClose?.();
    } catch (err) {
      console.error(err);

      showToast?.(err.message, "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h5 className="mb-3">
        {tareaEdit
          ? "✏️ Editar Tarea"
          : "➕ Nueva Tarea"}
      </h5>

      {/* ================= CLIENTE ================= */}
      <div
        className="position-relative mb-2"
        ref={clienteRef}
      >
        <input
          className="form-control"
          placeholder="Buscar cliente..."
          value={clienteSearch}
          autoComplete="off"
          onChange={(e) => {
            setClienteSearch(e.target.value);

            setShowClienteDropdown(true);

            setForm((prev) => ({
              ...prev,
              cliente: "",
              instrumento: "",
            }));
          }}
          onFocus={() => setShowClienteDropdown(true)}
        />

        {showClienteDropdown && clienteSearch && (
          <div
            className="dropdown-menu show w-100 shadow"
            style={{
              maxHeight: "220px",
              overflowY: "auto",
            }}
          >
            {filteredClientes.length > 0 ? (
              filteredClientes.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      cliente: c._id,
                      instrumento: "",
                    }));

                    setClienteSearch(c.nombre);

                    setShowClienteDropdown(false);
                  }}
                >
                  {c.nombre}
                </button>
              ))
            ) : (
              <div className="dropdown-item text-muted">
                Sin resultados
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= INSTRUMENTOS ================= */}
      <select
        className="form-select mb-2"
        value={form.instrumento}
        disabled={!form.cliente}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            instrumento: e.target.value,
          }))
        }
      >
        <option value="">
          {!form.cliente
            ? "Seleccione cliente primero"
            : instrumentosCliente.length === 0
            ? "Sin instrumentos"
            : "Seleccionar instrumento"}
        </option>

        {instrumentosCliente.map((i) => (
          <option key={i._id} value={i._id}>
            {i.descripcion} — SN {i.numeroSerie}
          </option>
        ))}
      </select>

      {/* ================= TAREA ================= */}
      <input
        className="form-control mb-2"
        placeholder="Tarea"
        value={form.tarea}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            tarea: e.target.value,
          }))
        }
      />

      <input
        type="date"
        className="form-control mb-2"
        value={form.fecha}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            fecha: e.target.value,
          }))
        }
      />

      <select
        className="form-select mb-2"
        value={form.prioridad}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            prioridad: e.target.value,
          }))
        }
      >
        <option>Baja</option>
        <option>Media</option>
        <option>Alta</option>
        <option>Urgente</option>
      </select>

      <select
        className="form-select mb-2"
        value={form.estado}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            estado: e.target.value,
          }))
        }
      >
        <option>Pendiente</option>
        <option>En proceso</option>
        <option>Finalizada</option>
        <option>Cancelada</option>
      </select>

      <input
        className="form-control mb-2"
        placeholder="Responsable"
        value={form.responsable}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            responsable: e.target.value,
          }))
        }
      />

      <textarea
        className="form-control mb-3"
        rows={3}
        placeholder="Notas"
        value={form.notas}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            notas: e.target.value,
          }))
        }
      />

      {/* ================= BOTONES ================= */}
      <div className="d-flex gap-2">
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={!isValid || loading}
        >
          {loading
            ? "Guardando..."
            : tareaEdit
            ? "Actualizar"
            : "Guardar"}
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary w-100"
          onClick={onClose}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}