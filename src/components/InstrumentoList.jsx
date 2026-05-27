import { useEffect, useState, useMemo } from "react";

export default function InstrumentoList({ instrumentos = [], onNew, onEdit }) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const filtrados = useMemo(() => {
    const t = search.toLowerCase().trim();
    if (!t) return instrumentos;

    return instrumentos.filter((i) => {
      const clienteNombre = i.cliente?.nombre?.toLowerCase() || "";

      return (
        i.numeroSerie?.toLowerCase().includes(t) ||
        i.numeroPartida?.toLowerCase().includes(t) ||
        i.descripcion?.toLowerCase().includes(t) ||
        clienteNombre.includes(t)
      );
    });
  }, [search, instrumentos]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtrados.length / itemsPerPage)),
    [filtrados.length]
  );

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtrados.slice(start, start + itemsPerPage);
  }, [filtrados, currentPage]);

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

        <button className="btn btn-primary" onClick={onNew}>
          ➕ Nuevo
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
              <th>Mantenimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {currentItems.map((i) => {
              const estado = getEstado(i.fechaUltimoMantenimiento);

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
                  <td>{i.descripcion}</td>
                  <td>{i.cliente?.nombre || "Sin cliente"}</td>

                  <td className={color}>
                    {i.fechaUltimoMantenimiento
                      ? typeof i.fechaUltimoMantenimiento === "string"
                        ? i.fechaUltimoMantenimiento.split("-").reverse().join("/")
                        : new Date(i.fechaUltimoMantenimiento).toLocaleDateString("es-AR")
                      : "-"}
                  </td>

                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onEdit(i)}
                    >
                      ✏️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="d-flex justify-content-center mt-3 gap-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            className={`btn btn-sm ${
              currentPage === i + 1
                ? "btn-primary"
                : "btn-outline-primary"
            }`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}