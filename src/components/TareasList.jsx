import { useMemo, useState } from "react";

export default function TareasList({
  tareas = [],
  onEdit,
  onDelete,
  onNew,
}) {
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [prioridadFiltro, setPrioridadFiltro] =
    useState("");
  const [search, setSearch] = useState("");

  // =========================
  // HELPERS
  // =========================
  const getCliente = (t) => {
    const c = t?.cliente;

    if (!c) return "—";

    return typeof c === "object"
      ? c.nombre || c.codigoCliente || "—"
      : c;
  };

  
  const getInstrumento = (t) => {
    const i = t?.instrumento;

    if (!i) return "—";

    return typeof i === "object"
      ? i.descripcion || i.numeroSerie || "—"
      : i;
  };

  // =========================
  // FILTRO + ORDEN
  // =========================
  const filtradas = useMemo(() => {
    const prioridadOrder = {
      Urgente: 1,
      Alta: 2,
      Media: 3,
      Baja: 4,
    };

    const estadoOrder = {
      Pendiente: 1,
      "En proceso": 2,
      Finalizada: 99,
      Cancelada: 100,
    };

    return tareas
      .filter((t) => {
        if (
          estadoFiltro &&
          t.estado !== estadoFiltro
        )
          return false;

        if (
          prioridadFiltro &&
          t.prioridad !== prioridadFiltro
        )
          return false;

        const texto = `
          ${getCliente(t)}
          ${getInstrumento(t)}
          ${t.tarea}
          ${t.responsable || ""}
        `.toLowerCase();

        if (
          search &&
          !texto.includes(search.toLowerCase())
        )
          return false;

        return true;
      })
      .sort((a, b) => {
        const estadoA =
          estadoOrder[a.estado] ?? 50;

        const estadoB =
          estadoOrder[b.estado] ?? 50;

        if (estadoA !== estadoB)
          return estadoA - estadoB;

        const prioridadA =
          prioridadOrder[a.prioridad] ?? 999;

        const prioridadB =
          prioridadOrder[b.prioridad] ?? 999;

        if (prioridadA !== prioridadB)
          return prioridadA - prioridadB;

        return (
          new Date(a.fecha) - new Date(b.fecha)
        );
      });
  }, [
    tareas,
    estadoFiltro,
    prioridadFiltro,
    search,
  ]);

  // =========================
  // BADGES
  // =========================
  const prioridadBadge = (p) => {
    switch (p) {
      case "Urgente":
        return "bg-danger";

      case "Alta":
        return "bg-warning text-dark";

      case "Media":
        return "bg-primary";

      case "Baja":
        return "bg-secondary";

      default:
        return "bg-secondary";
    }
  };

  const estadoBadge = (e) => {
    switch (e) {
      case "Pendiente":
        return "bg-secondary";

      case "En proceso":
        return "bg-info text-dark";

      case "Finalizada":
        return "bg-success";

      case "Cancelada":
        return "bg-dark";

      default:
        return "bg-secondary";
    }
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div>

      {/* ================= HEADER ================= */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">

        <h5 className="m-0">
          📋 Tareas ({filtradas.length})
        </h5>

        <input
          type="text"
          className="form-control"
          placeholder="Buscar tarea..."
          style={{ maxWidth: 320 }}
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
        <button
          className="btn btn-success"
          onClick={() => onNew?.()}
        >
          ➕ Nueva Tarea
        </button>

      </div>

      {/* ================= FILTROS ================= */}
      <div className="d-flex gap-2 mb-3 flex-wrap">

        <select
          className="form-select"
          value={estadoFiltro}
          onChange={(e) =>
            setEstadoFiltro(e.target.value)
          }
          style={{ maxWidth: 220 }}
        >
          <option value="">
            Todos los estados
          </option>

          <option value="Pendiente">
            Pendiente
          </option>

          <option value="En proceso">
            En proceso
          </option>

          <option value="Finalizada">
            Finalizada
          </option>

          <option value="Cancelada">
            Cancelada
          </option>
        </select>

        <select
          className="form-select"
          value={prioridadFiltro}
          onChange={(e) =>
            setPrioridadFiltro(e.target.value)
          }
          style={{ maxWidth: 220 }}
        >
          <option value="">
            Todas las prioridades
          </option>

          <option value="Urgente">
            Urgente
          </option>

          <option value="Alta">Alta</option>

          <option value="Media">
            Media
          </option>

          <option value="Baja">Baja</option>
        </select>

      </div>

      {/* ================= TABLA ================= */}
      <div
        className="table-responsive border rounded shadow-sm"
        style={{ maxHeight: "70vh" }}
      >
        <table className="table table-hover table-sm align-middle mb-0">

          <thead
            className="table-dark position-sticky top-0"
            style={{ zIndex: 1 }}
          >
            <tr>
              <th style={{ minWidth: 110 }}>
                Fecha
              </th>

              <th style={{ minWidth: 220 }}>
                Cliente
              </th>

              <th style={{ minWidth: 220 }}>
                Instrumento
              </th>

              <th
                className="text-center"
                style={{ width: 120 }}
              >
                Acciones
              </th>

              <th style={{ minWidth: 260 }}>
                Tarea
              </th>

              <th>Prioridad</th>

              <th>Estado</th>

              <th style={{ minWidth: 160 }}>
                Responsable
              </th>

            </tr>
          </thead>

          <tbody>

            {filtradas.length === 0 && (
              <tr>
                <td
                  colSpan="8"
                  className="text-center text-muted py-5"
                >
                  No hay tareas registradas
                </td>
              </tr>
            )}

            {filtradas.map((t) => {
              const finalizada =
                t.estado === "Finalizada";

              return (
                <tr
                  key={t._id}
                  className={
                    finalizada
                      ? "opacity-50"
                      : ""
                  }
                >

                  <td>
                    {t.fecha
                      ? typeof t.fecha === "string"
                        ? t.fecha.split("-").reverse().join("/")
                        : new Date(t.fecha).toLocaleDateString("es-AR")
                      : "—"}
                  </td>

                  <td>
                    {getCliente(t)}
                  </td>

                  <td>
                    {getInstrumento(t)}
                  </td>
                  
                  <td className="text-center">

                    <div className="d-flex justify-content-center gap-1">

                      <button
                        className="btn btn-sm btn-outline-primary"
                        title="Editar"
                        onClick={() =>
                          onEdit?.(t)
                        }
                      >
                        ✏️
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        title="Eliminar"
                        onClick={() =>
                          onDelete?.(t._id)
                        }
                      >
                        🗑️
                      </button>

                    </div>

                  </td>

                  <td>{t.tarea}</td>

                  <td>
                    <span
                      className={`badge rounded-pill ${prioridadBadge(
                        t.prioridad
                      )}`}
                    >
                      {t.prioridad}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`badge rounded-pill ${estadoBadge(
                        t.estado
                      )}`}
                    >
                      {t.estado}
                    </span>
                  </td>

                  <td>
                    {t.responsable || "—"}
                  </td>

                  

                </tr>
              );
            })}

          </tbody>

        </table>
      </div>
    </div>
  );
}