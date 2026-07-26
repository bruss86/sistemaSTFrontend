import { useEffect, useState, useMemo } from "react";
import "../styles/InstrumentoList.css";

export default function InstrumentoList({ instrumentos = [], onNew, onEdit, onDelete }) {
  const [search, setSearch] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [instrumentoAEliminar, setInstrumentoAEliminar] = useState(null);

  //Select para mostrar solo vencidos o todos

  const [filtroEstado, setFiltroEstado] = useState("todos");

  // PAGINACIÓN
  const [pagina, setPagina] = useState(1);
  const porPagina = 8;

   const getEstado = (fecha) => {
    if (!fecha) return "sin";

    const hoy = new Date();
    const base = new Date(fecha);
    const venc = new Date(base);

    venc.setFullYear(venc.getFullYear() + 1);

    const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));

    if (diff < 0) return "vencido";
    if (diff <= 30) return "proximo";

    return "ok";
  };

  const prioridadEstado = {
      vencido: 0,
      proximo: 1,
      ok: 2,
      sin: 3
  };
 const filtrados = useMemo(() => {
    const t = search.toLowerCase().trim();

    return instrumentos
    .filter((i) => {
      const clienteNombre = i.cliente?.nombre?.toLowerCase() || "";

      const coincideBusqueda =
        !t ||
        i.numeroSerie?.toLowerCase().includes(t) ||
        i.numeroPartida?.toLowerCase().includes(t) ||
        i.descripcion?.toLowerCase().includes(t) ||
        clienteNombre.includes(t);

      const estado = getEstado(i.fechaUltimoMantenimiento);

      const coincideEstado =
        filtroEstado === "todos" ||
        estado === filtroEstado;

      return coincideBusqueda && coincideEstado;
    })
    .sort((a, b) => 
      prioridadEstado[getEstado(a.fechaUltimoMantenimiento)] -
      prioridadEstado[getEstado(b.fechaUltimoMantenimiento)]
    );
  }, [search, instrumentos, filtroEstado]);

  useEffect(() => {
    setPagina(1);
  }, [search, filtroEstado]);

  const totalPaginas = Math.ceil(filtrados.length / porPagina);

  useEffect(() => {
  if (pagina > totalPaginas && totalPaginas > 0) {
    setPagina(totalPaginas);
  }
}, [pagina, totalPaginas]);

  const instrumentosPaginados = useMemo(() => {
    const start = (pagina - 1) * porPagina;
    return filtrados.slice(start, start + porPagina);
  }, [filtrados, pagina]);
 
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    else if (typeof fecha === "string") {
      return fecha.split("-").reverse().join("/");
    }
    return new Date(fecha).toLocaleDateString("es-AR");
  };

  const getInfoMantenimiento = (fecha) => {
      if (!fecha) {
        return {
          color: "secondary",
          icono: "⚪",
          fecha: "-",
          texto: "Sin mantenimiento",
        };
      }

      const hoy = new Date();
      const base = new Date(fecha + "T00:00:00");
      const venc = new Date(base);
      venc.setFullYear(venc.getFullYear() + 1);

      const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));

      let color = "success";
      let icono = <i className="bi bi-check-circle-fill text-success me-1"></i>;
      let texto = `Vence en ${diff} días`;

      if (diff < 0) {
        color = "danger";
        icono = <i className="bi bi-exclamation-triangle-fill text-danger me-1"></i>;
        texto = `Vencido hace ${Math.abs(diff)} días`;
      } else if (diff <= 30) {
        color = "warning";
        icono = <i className="bi bi-clock-fill text-warning me-1"></i>;
        texto = `Vence en ${diff} días`;
      }

      return {
        color,
        icono,
        fecha: base.toLocaleDateString("es-AR"),
        texto,
      };
    };

  return (
    <div className="card p-3 shadow-sm">
      {/* SEARCH + NEW */}
      <div className="d-flex gap-2 mb-3">
        <input
          className="form-control"
          placeholder="🔎 Buscar instrumento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

          <select
            className="form-select"
            style={{ maxWidth: "220px" }}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="ok">Vigentes</option>
            <option value="proximo">Vencen en 30 días</option>
            <option value="vencido">Vencidos</option>
          </select>

        <button className="btn btn-primary" onClick={onNew} 
        data-bs-toggle="tooltip" 
        data-bs-placement="top" title="Agregar nuevo instrumento">
          <i className="bi bi-plus-circle"></i>
        </button>
      </div>

      {/* TABLE */}
      <div className="table-responsive">
        <table className="table table-striped table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>Serie</th>
              <th>Partida</th>
              <th>Descripción</th>
              <th>Cliente</th>
              <th>Ult. Mant.</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            
            {
              instrumentosPaginados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted">
                    No se encontraron instrumentos
                  </td>
                </tr>
              ) : (
                    instrumentosPaginados.map((i) => {
              const estado = getEstado(i.fechaUltimoMantenimiento);
              const info = getInfoMantenimiento(i.fechaUltimoMantenimiento);

              const color =
                estado === "vencido"
                  ? "text-danger fw-bold"
                  : estado === "proximo"
                  ? "text-warning fw-bold"
                  : "text-success";

              return (
                <tr key={i._id}>
                  <td>{i.numeroSerie}</td>
                  <td>{i.numeroPartida || "-"}</td>
                  <td className="col-descripcion">
                    {i.descripcion}
                  </td>
                  <td className="col-cliente">
                    <i className="me-1 text-primary"></i>
                    {i.cliente?.nombre || "Sin cliente"}
                  </td>

                  <td>
                    <div className={`text-${info.color}`}>
                      <div className="fw-semibold">
                        {info.icono} {info.fecha}
                      </div>

                      <small className="text-muted">
                        {info.texto}
                      </small>
                    </div>
                  </td>

                  <td className="d-flex gap-1">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      title="Editar"
                      onClick={() => onEdit(i)}
                    >
                      <i className="bi bi-pencil-fill"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      title="Eliminar"
                      onClick={() => {
                        setInstrumentoAEliminar(i);
                        setShowDeleteModal(true);
                      }}
                    >
                      <i className="bi bi-trash-fill"></i>
                    </button>
                  </td>
                </tr>
              );
                    })
              )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
        <button
          className="btn btn-outline-secondary btn-sm"
          disabled={pagina === 1}
          onClick={() => setPagina((p) => p - 1)}
        >
          ←
        </button>

        <span>
          Página {pagina} de {totalPaginas || 1}
        </span>

        <button
          className="btn btn-outline-secondary btn-sm"
          disabled={pagina === totalPaginas || totalPaginas === 0}
          onClick={() => setPagina((p) => p + 1)}
        >
          →
        </button>
      </div>

      {/* MODAL ELIMINAR */}
      {showDeleteModal && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex="-1"
          >
            <div className="modal-dialog">
              <div className="modal-content">

                <div className="modal-header">
                  <h5 className="modal-title">Advertencia</h5>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowDeleteModal(false)}
                  />
                </div>

                <div className="modal-body">
                  <p>
                    ¿Está seguro de querer eliminar el instrumento SN
                    <strong>
                      {" "}
                      {instrumentoAEliminar?.numeroSerie}
                    </strong>
                    ?
                  </p>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      onDelete(instrumentoAEliminar._id);
                      setShowDeleteModal(false);
                      setInstrumentoAEliminar(null);
                    }}
                  >
                    Eliminar
                  </button>
                </div>

              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}