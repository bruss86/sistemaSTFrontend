import { useEffect, useState, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL;

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
  onClose = () => {},
  showToast,
}) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const [clienteSearch, setClienteSearch] = useState("");
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);

  const [instrumentosCliente, setInstrumentosCliente] = useState([]);
  const [error, setError] = useState("");

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
      document.removeEventListener("mousedown", handleClickOutside);
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
      fecha: tareaEdit.fecha ? tareaEdit.fecha.substring(0, 10) : "",
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

        if (!res.ok) throw new Error("Error cargando instrumentos");

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
    c.nombre.toLowerCase().includes(clienteSearch.toLowerCase())
  );

  const isValid = form.tarea.trim() && form.fecha;

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setError("");

    try {
      setLoading(true);

      const url = tareaEdit
        ? `${API_URL}/tareas/${tareaEdit._id}`
        : `${API_URL}/tareas`;

      const method = tareaEdit ? "PUT" : "POST";

      const data = {
        ...form,
        cliente: form.cliente || null,
        instrumento: form.instrumento || null,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const response = await res.json();

      if (!res.ok) {
        throw new Error(response.error || "Error al guardar tarea");
      }

      setError("");
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
      setError(err.message || "No se pudo guardar la tarea.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-2">
      <h4 className="mb-3 fw-bold text-dark">
        {tareaEdit ? "✏️ Editar Tarea" : "➕ Nueva Tarea"}
      </h4>

      {error && (
        <div className="alert alert-danger py-2 px-3 small shadow-sm mb-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-1"></i> {error}
        </div>
      )}

      <div className="row g-3 mb-3">
        {/* ================= CLIENTE ================= */}
        <div className="col-md-6 position-relative" ref={clienteRef}>
          <div className="form-floating">
            <input
              className="form-control"
              placeholder="Buscar cliente..."
              value={clienteSearch}
              autoComplete="off"
              disabled={loading}
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
            <label>Buscar cliente...</label>
          </div>

          {showClienteDropdown && clienteSearch && (
            <div
              className="dropdown-menu show w-100 shadow border-0 mt-1 rounded-3 overflow-hidden"
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                zIndex: 1050,
              }}
            >
              {filteredClientes.length > 0 ? (
                filteredClientes.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    className="dropdown-item py-2 px-3 small"
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
                    <i className="bi bi-building text-muted me-2"></i>
                    {c.nombre}
                  </button>
                ))
              ) : (
                <div className="dropdown-item text-muted py-2 px-3 small">
                  Sin resultados
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= INSTRUMENTOS ================= */}
        <div className="col-md-6">
          <div className="form-floating">
            <select
              className="form-select"
              value={form.instrumento}
              disabled={!form.cliente || loading}
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
            <label>Instrumento</label>
          </div>
        </div>

        {/* ================= TAREA ================= */}
        <div className="col-12">
          <div className="form-floating">
            <input
              className="form-control"
              placeholder="Descripción de la tarea"
              value={form.tarea}
              disabled={loading}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tarea: e.target.value,
                }))
              }
              required
            />
            <label>Descripción de la tarea *</label>
          </div>
        </div>

        {/* ================= FECHA ================= */}
        <div className="col-md-6">
          <div className="form-floating">
            <input
              type="date"
              className="form-control"
              value={form.fecha}
              disabled={loading}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  fecha: e.target.value,
                }))
              }
              required
            />
            <label>Fecha límite *</label>
          </div>
        </div>

        {/* ================= PRIORIDAD ================= */}
        <div className="col-md-6">
          <div className="form-floating">
            <select
              className="form-select"
              value={form.prioridad}
              disabled={loading}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  prioridad: e.target.value,
                }))
              }
            >
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
            <label>Prioridad</label>
          </div>
        </div>

        {/* ================= ESTADO ================= */}
        <div className="col-md-6">
          <div className="form-floating">
            <select
              className="form-select"
              value={form.estado}
              disabled={loading}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  estado: e.target.value,
                }))
              }
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En proceso">En proceso</option>
              <option value="Finalizada">Finalizada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
            <label>Estado</label>
          </div>
        </div>

        {/* ================= RESPONSABLE ================= */}
        <div className="col-md-6">
          <div className="form-floating">
            <select
              className="form-select"
              value={form.responsable}
              disabled={loading}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  responsable: e.target.value,
                }))
              }
            >
              <option value="">Seleccionar responsable</option>
              <option value="Vaccaro Sebastián">Vaccaro Sebastián</option>
              <option value="Correas Gustavo">Correas Gustavo</option>
              <option value="Orlandi Matías">Orlandi Matías</option>
              <option value="Gerbaudo Leandro">Gerbaudo Leandro</option>
            </select>
            <label>Responsable</label>
          </div>
        </div>

        {/* ================= NOTAS ================= */}
        <div className="col-12">
          <div className="form-floating">
            <textarea
              className="form-control"
              placeholder="Notas adicionales"
              value={form.notas}
              disabled={loading}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  notas: e.target.value,
                }))
              }
              style={{ height: "80px", resize: "none" }}
            />
            <label>Notas</label>
          </div>
        </div>
      </div>

      {/* ================= BOTONES ================= */}
      <div className="d-flex gap-2 pt-2 border-top">
        <button
          type="button"
          className="btn btn-secondary flex-fill py-2 fw-semibold shadow-sm"
          onClick={(e) => {
            e.preventDefault();
            onClose();
          }}
          disabled={loading}
        >
          <i className="bi bi-x-lg me-1"></i>
          Cancelar
        </button>

        <button
          type="submit"
          className="btn btn-primary flex-fill py-2 fw-semibold shadow-sm"
          disabled={!isValid || loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              Guardando...
            </>
          ) : (
            <>
              <i className={`bi ${tareaEdit ? "bi-check-lg" : "bi-plus-lg"} me-1`}></i>
              {tareaEdit ? "Actualizar Tarea" : "Guardar Tarea"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}