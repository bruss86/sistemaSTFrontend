import { useEffect, useMemo, useState } from "react";
import "../styles/MantenimientosList.css";

export default function MantenimientosList({
  instrumentos = [],
  onEdit,
  onRegistrarMantenimiento,
  filtroInicial = "todos",
}) {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState(filtroInicial);

  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

  useEffect(() => {
    setFiltroEstado(filtroInicial);
    setSearch("");
    setPaginaActual(1);
  }, [filtroInicial]);

  useEffect(() => {
    setPaginaActual(1);
  }, [search, filtroEstado, itemsPorPagina]);

  // ---------------------------------------------------------
  // Parseo seguro de fechas
  // ---------------------------------------------------------
  const parseDateSafe = (value) => {
    if (!value) return null;

    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}\$/.test(value)
    ) {
      const [year, month, day] = value.split("-").map(Number);
      return new Date(year, month - 1, day);
    }

    const fecha = new Date(value);
    if (isNaN(fecha.getTime())) {
      return null;
    }

    fecha.setHours(0, 0, 0, 0);
    return fecha;
  };

  // ---------------------------------------------------------
  // Próximo mantenimiento = último mantenimiento + 12 meses
  // ---------------------------------------------------------
  const getFechaProximoMantenimiento = (fechaUltimo) => {
    const fecha = parseDateSafe(fechaUltimo);
    if (!fecha) return null;

    const proxima = new Date(fecha);
    proxima.setMonth(proxima.getMonth() + 12);
    return proxima;
  };

  // ---------------------------------------------------------
  // Diferencia en días
  // ---------------------------------------------------------
  const getDiasDiferencia = (fecha) => {
    if (!fecha) return null;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const f = new Date(fecha);
    f.setHours(0, 0, 0, 0);

    return Math.round(
      (f - hoy) / (1000 * 60 * 60 * 24)
    );
  };

  // ---------------------------------------------------------
  // Formatear fecha
  // ---------------------------------------------------------
  const formatFecha = (fecha) => {
    if (!fecha) return "—";

    return fecha.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ---------------------------------------------------------
  // Datos de mantenimiento
  // ---------------------------------------------------------
  const mantenimientos = useMemo(() => {
    return instrumentos
      .map((instrumento) => {
        const fechaUltimo = parseDateSafe(
          instrumento.fechaUltimoMantenimiento
        );

        if (!fechaUltimo) {
          return {
            ...instrumento,
            fechaUltimo: null,
            fechaProximo: null,
            dias: null,
            estado: "sin-mantenimiento",
          };
        }

        const fechaProximo = getFechaProximoMantenimiento(
          instrumento.fechaUltimoMantenimiento
        );

        const dias = getDiasDiferencia(fechaProximo);

        let estado = "al-dia";
        if (dias < 0) {
          estado = "vencido";
        } else if (dias <= 30) {
          estado = "proximo";
        }

        return {
          ...instrumento,
          fechaUltimo,
          fechaProximo,
          dias,
          estado,
        };
      })
      .sort((a, b) => {
        if (!a.fechaProximo && !b.fechaProximo) return 0;
        if (!a.fechaProximo) return 1;
        if (!b.fechaProximo) return -1;

        return (
          a.fechaProximo.getTime() -
          b.fechaProximo.getTime()
        );
      });
  }, [instrumentos]);

  // ---------------------------------------------------------
  // Filtrado
  // ---------------------------------------------------------
  const mantenimientosFiltrados = useMemo(() => {
    const texto = search.trim().toLowerCase();

    return mantenimientos.filter((m) => {
      const cliente = m.cliente?.nombre?.toLowerCase() || "";
      const descripcion = m.descripcion?.toLowerCase() || "";
      const numeroSerie = m.numeroSerie?.toLowerCase() || "";

      const coincideBusqueda =
        !texto ||
        cliente.includes(texto) ||
        descripcion.includes(texto) ||
        numeroSerie.includes(texto);

      const coincideEstado =
        filtroEstado === "todos" ||
        m.estado === filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }, [mantenimientos, search, filtroEstado]);

  const totalPaginas = Math.ceil(
    mantenimientosFiltrados.length / itemsPorPagina
  );

  const indiceInicio = (paginaActual - 1) * itemsPorPagina;
  const indiceFin = indiceInicio + itemsPorPagina;

  const mantenimientosPaginados = mantenimientosFiltrados.slice(
    indiceInicio,
    indiceFin
  );

  // ---------------------------------------------------------
  // Contadores
  // ---------------------------------------------------------
  const contadores = useMemo(() => {
    return {
      total: mantenimientos.length,
      alDia: mantenimientos.filter((m) => m.estado === "al-dia").length,
      proximos: mantenimientos.filter((m) => m.estado === "proximo").length,
      vencidos: mantenimientos.filter((m) => m.estado === "vencido").length,
      sinMantenimiento: mantenimientos.filter((m) => m.estado === "sin-mantenimiento").length,
    };
  }, [mantenimientos]);

  // ---------------------------------------------------------
  // Render Estado con Badges Modernos
  // ---------------------------------------------------------
  const renderEstado = (mantenimiento) => {
    const { estado, dias } = mantenimiento;

    if (estado === "sin-mantenimiento") {
      return (
        <div>
          <span className="badge rounded-pill bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-3 py-1">
            ⚪ Sin registro
          </span>
        </div>
      );
    }

    if (estado === "vencido") {
      return (
        <div>
          <span className="badge rounded-pill bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-3 py-1">
            🔴 Vencido
          </span>
          <div className="small text-danger mt-1 fw-semibold">
            Hace {Math.abs(dias)} {Math.abs(dias) === 1 ? "día" : "días"}
          </div>
        </div>
      );
    }

    if (estado === "proximo") {
      if (dias === 0) {
        return (
          <div>
            <span className="badge rounded-pill bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-3 py-1">
              🟡 Vence hoy
            </span>
          </div>
        );
      }

      return (
        <div>
          <span className="badge rounded-pill bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-3 py-1">
            🟡 Próximo
          </span>
          <div className="small text-warning mt-1 fw-semibold">
            En {dias} {dias === 1 ? "día" : "días"}
          </div>
        </div>
      );
    }

    return (
      <div>
        <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1">
          🟢 Al día
        </span>
        <div className="small text-success mt-1 fw-semibold">
          En {dias} {dias === 1 ? "día" : "días"}
        </div>
      </div>
    );
  };

  return (
    <div className="card p-3 shadow-sm border-0 rounded-3">

      {/* -------------------------------------------------- */}
      {/* ENCABEZADO                                         */}
      {/* -------------------------------------------------- */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold m-0 text-dark">
            🔧 Control de Mantenimientos
          </h4>
          <div className="text-muted small">
            Monitoreo y seguimiento de mantenimientos preventivos
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* RESUMEN / KPIS CLICKEABLES                         */}
      {/* -------------------------------------------------- */}
      <div className="row g-2 mb-4">
        <div className="col">
          <div 
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 ${filtroEstado === 'todos' ? 'border-start border-4 border-primary' : ''}`}
            onClick={() => setFiltroEstado("todos")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-muted small fw-semibold">Total</span>
            <span className="fs-4 fw-bold text-dark">{contadores.total}</span>
          </div>
        </div>
        <div className="col">
          <div 
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 ${filtroEstado === 'al-dia' ? 'border-start border-4 border-success' : ''}`}
            onClick={() => setFiltroEstado("al-dia")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-success small fw-semibold">Al día</span>
            <span className="fs-4 fw-bold text-success">{contadores.alDia}</span>
          </div>
        </div>
        <div className="col">
          <div 
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 ${filtroEstado === 'proximo' ? 'border-start border-4 border-warning' : ''}`}
            onClick={() => setFiltroEstado("proximo")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-warning small fw-semibold">Próximos</span>
            <span className="fs-4 fw-bold text-warning">{contadores.proximos}</span>
          </div>
        </div>
        <div className="col">
          <div 
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 ${filtroEstado === 'vencido' ? 'border-start border-4 border-danger' : ''}`}
            onClick={() => setFiltroEstado("vencido")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-danger small fw-semibold">Vencidos</span>
            <span className="fs-4 fw-bold text-danger">{contadores.vencidos}</span>
          </div>
        </div>
        <div className="col">
          <div 
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 ${filtroEstado === 'sin-mantenimiento' ? 'border-start border-4 border-secondary' : ''}`}
            onClick={() => setFiltroEstado("sin-mantenimiento")}
            style={{ cursor: "pointer" }}
          >
            <span className="text-secondary small fw-semibold">Sin mant.</span>
            <span className="fs-4 fw-bold text-secondary">{contadores.sinMantenimiento}</span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* FILTROS                                            */}
      {/* -------------------------------------------------- */}
      <div className="row g-2 mb-3">
        <div className="col-md-8">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="bi bi-search text-muted" />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar instrumento, número de serie o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="col-md-4">
          <select
            className="form-select"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="al-dia">🟢 Al día</option>
            <option value="proximo">🟡 Próximos</option>
            <option value="vencido">🔴 Vencidos</option>
            <option value="sin-mantenimiento">⚪ Sin mantenimiento</option>
          </select>
        </div>
      </div>

      {/* SELECTOR DE CANTIDAD Y CONTADOR */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="text-muted small">
          Mostrando{" "}
          {mantenimientosFiltrados.length === 0 ? 0 : indiceInicio + 1}
          {" - "}
          {Math.min(indiceFin, mantenimientosFiltrados.length)} de {mantenimientosFiltrados.length} resultados
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="small text-muted">Mostrar</span>
          <select
            className="form-select form-select-sm"
            style={{ width: "80px" }}
            value={itemsPorPagina}
            onChange={(e) => setItemsPorPagina(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* -------------------------------------------------- */}
      {/* TABLA                                              */}
      {/* -------------------------------------------------- */}
      <div className="table-responsive border rounded-3 overflow-hidden shadow-sm">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-dark text-nowrap">
            <tr>
              <th className="py-3" style={{ width: "25%" }}>Instrumento</th>
              <th className="py-3" style={{ width: "20%" }}>Cliente</th>
              <th className="py-3" style={{ width: "15%" }}>Último Mantenimiento</th>
              <th className="py-3" style={{ width: "15%" }}>Próximo Mantenimiento</th>
              <th className="py-3" style={{ width: "15%" }}>Estado</th>
              <th className="text-center py-3" style={{ width: "10%" }}>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {mantenimientosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-muted py-5">
                  <i className="bi bi-folder2-open fs-1 d-block mb-2 opacity-50"></i>
                  No se encontraron mantenimientos registrados
                </td>
              </tr>
            ) : (
              mantenimientosPaginados.map((m) => (
                <tr key={m._id}>
                  <td>
                    <div className="fw-semibold text-dark">
                      {m.descripcion || "—"}
                    </div>
                    {m.numeroSerie && (
                      <div className="small text-muted">
                        S/N: {m.numeroSerie}
                      </div>
                    )}
                  </td>

                  <td>
                    {m.cliente?.nombre ? (
                      <span className="badge rounded-pill bg-primary text-white px-2 py-1 shadow-sm">
                        <i className="bi bi-building me-1"></i>
                        {m.cliente.nombre}
                      </span>
                    ) : (
                      <span className="badge rounded-pill bg-secondary bg-opacity-10 text-secondary">
                        Sin cliente
                      </span>
                    )}
                  </td>

                  <td className="text-muted">
                    {m.fechaUltimo ? formatFecha(m.fechaUltimo) : "—"}
                  </td>

                  <td className="fw-semibold text-dark">
                    {m.fechaProximo ? formatFecha(m.fechaProximo) : "—"}
                  </td>

                  <td>
                    {renderEstado(m)}
                  </td>

                  <td className="text-center text-nowrap">
                    <div className="d-flex justify-content-center gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border text-success shadow-sm"
                        onClick={() => onRegistrarMantenimiento(m)}
                        title="Registrar mantenimiento"
                      >
                        <i className="bi bi-tools"></i>
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-light border text-primary shadow-sm"
                        onClick={() => onEdit(m)}
                        title="Editar instrumento"
                      >
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* -------------------------------------------------- */}
      {/* PAGINACIÓN UNIFICADA                               */}
      {/* -------------------------------------------------- */}
      {totalPaginas > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
          <span className="small text-muted">
            Mostrando resultados del {indiceInicio + 1} al {Math.min(indiceFin, mantenimientosFiltrados.length)} de {mantenimientosFiltrados.length}
          </span>

          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={paginaActual === 1}
              onClick={() => setPaginaActual((p) => p - 1)}
            >
              ← Anterior
            </button>

            <span className="small fw-semibold text-dark px-2">
              Página {paginaActual} de {totalPaginas}
            </span>

            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={paginaActual === totalPaginas}
              onClick={() => setPaginaActual((p) => p + 1)}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

    </div>
  );
}