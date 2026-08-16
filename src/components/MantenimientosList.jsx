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

    // Evita problemas de zona horaria con YYYY-MM-DD
    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value)
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
    if (!fecha) return "-";

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

        // Instrumento sin mantenimiento registrado
        if (!fechaUltimo) {
            return {
            ...instrumento,
            fechaUltimo: null,
            fechaProximo: null,
            dias: null,
            estado: "sin-mantenimiento",
            };
        }

        const fechaProximo =
            getFechaProximoMantenimiento(
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
        // Sin mantenimiento al final
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
      const cliente =
        m.cliente?.nombre?.toLowerCase() || "";

      const descripcion =
        m.descripcion?.toLowerCase() || "";

      const numeroSerie =
        m.numeroSerie?.toLowerCase() || "";

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
  }, [
    mantenimientos,
    search,
    filtroEstado,
  ]);

  const totalPaginas = Math.ceil(
    mantenimientosFiltrados.length / itemsPorPagina
    );

    const indiceInicio =
    (paginaActual - 1) * itemsPorPagina;

    const indiceFin =
    indiceInicio + itemsPorPagina;

    const mantenimientosPaginados =
    mantenimientosFiltrados.slice(
        indiceInicio,
        indiceFin
    );

  // ---------------------------------------------------------
  // Contadores
  // ---------------------------------------------------------
  const contadores = useMemo(() => {
    return {
      total: mantenimientos.length,

      alDia: mantenimientos.filter(
        (m) => m.estado === "al-dia"
      ).length,

      proximos: mantenimientos.filter(
        (m) => m.estado === "proximo"
      ).length,

      vencidos: mantenimientos.filter(
        (m) => m.estado === "vencido"
      ).length,

      sinMantenimiento: mantenimientos.filter(
      (m) => m.estado === "sin-mantenimiento"
    ).length,

    };
  }, [mantenimientos]);

  // ---------------------------------------------------------
  // Texto de estado
  // ---------------------------------------------------------
  const renderEstado = (mantenimiento) => {
    const { estado, dias } = mantenimiento;

    if (estado === "sin-mantenimiento") {
        return (
            <div>
            <span className="badge bg-secondary">
                ⚪ Sin mantenimiento
            </span>

            <div className="small text-muted mt-1">
                Sin registro
            </div>
            </div>
        );
        }

    if (estado === "vencido") {
      return (
        <div>
          <span className="badge bg-danger">
            🔴 Vencido
          </span>

          <div className="small text-danger mt-1">
            Hace {Math.abs(dias)}{" "}
            {Math.abs(dias) === 1 ? "día" : "días"}
          </div>
        </div>
      );
    }

    if (estado === "proximo") {
      if (dias === 0) {
        return (
          <div>
            <span className="badge bg-warning text-dark">
              🟡 Vence hoy
            </span>
          </div>
        );
      }

      return (
        <div>
          <span className="badge bg-warning text-dark">
            🟡 Próximo
          </span>

          <div className="small text-warning-emphasis mt-1">
            En {dias} {dias === 1 ? "día" : "días"}
          </div>
        </div>
      );
    }

    return (
      <div>
        <span className="badge bg-success">
          🟢 Al día
        </span>

        <div className="small text-success mt-1">
          En {dias} {dias === 1 ? "día" : "días"}
        </div>
      </div>
    );
  };

  return (
    <div>

      {/* -------------------------------------------------- */}
      {/* ENCABEZADO                                         */}
      {/* -------------------------------------------------- */}

      <div className="d-flex justify-content-between align-items-center mb-3">

        <div>
          <h4 className="mb-1">
            🔧 Mantenimientos
          </h4>

          <div className="text-muted small">
            Control de mantenimiento de instrumentos
          </div>
        </div>

      </div>

      {/* -------------------------------------------------- */}
      {/* RESUMEN                                            */}
      {/* -------------------------------------------------- */}

      <div className="maintenance-summary">

        <div className="summary-item">
            <div className="summary-label">Total</div>
            <div className="summary-value">
            {contadores.total}
            </div>
        </div>

        <div className="summary-item success">
            <div className="summary-label">🟢 Al día</div>
            <div className="summary-value">
            {contadores.alDia}
            </div>
        </div>

        <div className="summary-item warning">
            <div className="summary-label">🟡 Próximos</div>
            <div className="summary-value">
            {contadores.proximos}
            </div>
        </div>

        <div className="summary-item danger">
            <div className="summary-label">🔴 Vencidos</div>
            <div className="summary-value">
            {contadores.vencidos}
            </div>
        </div>

        <div className="summary-item secondary">
            <div className="summary-label">
            ⚪ Sin mantenimiento
            </div>
            <div className="summary-value">
            {contadores.sinMantenimiento}
            </div>
        </div>

        </div>

      {/* -------------------------------------------------- */}
      {/* FILTROS                                            */}
      {/* -------------------------------------------------- */}

      <div className="row g-2 mb-3">

        <div className="col-md-8">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search" />
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
            onChange={(e) =>
              setFiltroEstado(e.target.value)
            }
          >
            <option value="todos">
              Todos los estados
            </option>

            <option value="al-dia">
              🟢 Al día
            </option>

            <option value="proximo">
              🟡 Próximos
            </option>

            <option value="vencido">
              🔴 Vencidos
            </option>

            <option value="sin-mantenimiento">
                ⚪ Sin mantenimiento
            </option>
          </select>
        </div>

      </div>

      {/*selector de cantidad*/}

      <div className="d-flex justify-content-between align-items-center mb-3">

        <div className="text-muted small">
            Mostrando{" "}
            {mantenimientosFiltrados.length === 0
            ? 0
            : indiceInicio + 1}
            {" - "}
            {Math.min(
            indiceFin,
            mantenimientosFiltrados.length
            )}{" "}
            de {mantenimientosFiltrados.length}
        </div>

        <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">
            Mostrar
            </span>

            <select
            className="form-select form-select-sm"
            style={{ width: "80px" }}
            value={itemsPorPagina}
            onChange={(e) =>
                setItemsPorPagina(Number(e.target.value))
            }
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

      <div className="table-responsive">

        <table className="table table-hover align-middle">

          <thead className="table-light">
            <tr>
              <th>Instrumento</th>
              <th className="col-cliente">Cliente</th>
              <th>Último mantenimiento</th>
              <th>Próximo mantenimiento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>

            {mantenimientosFiltrados.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="text-center text-muted py-4"
                >
                  No se encontraron mantenimientos.
                </td>
              </tr>
            )}

            {mantenimientosPaginados.map((m) => (
              <tr key={m._id}>

                <td>
                  <div className="fw-semibold">
                    {m.descripcion || "-"}
                  </div>

                  {m.numeroSerie && (
                    <div className="small text-muted">
                      S/N: {m.numeroSerie}
                    </div>
                  )}
                </td>

                <td className="col-cliente">
                  {m.cliente?.nombre ? (
                    <span className="badge bg-primary">
                      {m.cliente.nombre}
                    </span>
                  ) : (
                    <span className="badge bg-secondary">
                      Sin cliente
                    </span>
                  )}
                </td>

                <td>
                    {m.fechaUltimo
                        ? formatFecha(m.fechaUltimo)
                        : (
                        <span className="text-muted">
                            —
                        </span>
                        )}
                </td>

                <td>
                {m.fechaProximo
                    ? (
                    <div className="fw-semibold">
                        {formatFecha(m.fechaProximo)}
                    </div>
                    )
                    : (
                    <span className="text-muted">
                        —
                    </span>
                    )}
                </td>

                <td>
                  {renderEstado(m)}
                </td>

                <td>
                    <div className="d-flex gap-1">

                        <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        onClick={() => onRegistrarMantenimiento(m)}
                        title="Registrar mantenimiento"
                        >
                        <i className="bi bi-tools"></i>
                        </button>

                        <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onEdit(m)}
                        title="Editar instrumento"
                        >
                        <i className="bi bi-pencil"></i>
                        </button>

                    </div>
                    </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      {/*Botones de navegación de páginas*/}

      {totalPaginas > 1 && (
        <div className="d-flex justify-content-center mt-3">

            <ul className="pagination pagination-sm mb-0">

            <li
                className={`page-item ${
                paginaActual === 1 ? "disabled" : ""
                }`}
            >
                <button
                className="page-link"
                onClick={() =>
                    setPaginaActual((p) => Math.max(1, p - 1))
                }
                >
                <i className="bi bi-chevron-left" />
                </button>
            </li>

            {Array.from(
                { length: totalPaginas },
                (_, index) => index + 1
            ).map((pagina) => (
                <li
                key={pagina}
                className={`page-item ${
                    paginaActual === pagina ? "active" : ""
                }`}
                >
                <button
                    className="page-link"
                    onClick={() => setPaginaActual(pagina)}
                >
                    {pagina}
                </button>
                </li>
            ))}

            <li
                className={`page-item ${
                paginaActual === totalPaginas ? "disabled" : ""
                }`}
            >
                <button
                className="page-link"
                onClick={() =>
                    setPaginaActual((p) =>
                    Math.min(totalPaginas, p + 1)
                    )
                }
                >
                <i className="bi bi-chevron-right" />
                </button>
            </li>

            </ul>

        </div>
        )}

      {/* -------------------------------------------------- */}
      {/* RESULTADOS                                         */}
      {/* -------------------------------------------------- */}

      <div className="text-muted small mt-2">
        Mostrando {mantenimientosFiltrados.length} de{" "}
        {mantenimientos.length} instrumentos
      </div>

    </div>
  );
}
