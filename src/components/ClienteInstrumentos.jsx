
import { useEffect, useState } from "react";
import { getInstrumentos } from "../api/api";

export default function ClienteInstrumentos({ cliente }) {
  const [instrumentos, setInstrumentos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);

      try {
        const data = await getInstrumentos();

        const filtrados = data.filter(
          (i) => i.cliente?._id === cliente._id
        );

        setInstrumentos(filtrados);
      } catch (error) {
        console.error("Error al cargar instrumentos:", error);
        setInstrumentos([]);
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [cliente]);

  return (
    <div className="cliente-instrumentos">
      <h5 className="mb-3">
        <i className="bi bi-building me-2"></i>
        {cliente.nombre}
      </h5>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="text-muted small">
          <i className="bi bi-tools me-1"></i>
          Instrumentos instalados
        </span>

        <span className="badge bg-secondary">
          {instrumentos.length}
        </span>
      </div>

      {cargando ? (
        <div className="text-center py-4">
          <div
            className="spinner-border spinner-border-sm text-primary me-2"
            role="status"
          ></div>
          Cargando instrumentos...
        </div>
      ) : instrumentos.length === 0 ? (
        <div className="text-muted text-center py-4">
          <i className="bi bi-inbox fs-3 d-block mb-2"></i>
          Este cliente no tiene instrumentos instalados.
        </div>
      ) : (
        <div
          className="table-responsive"
          style={{
            maxHeight: "290px",
            overflowY: "auto",
            overflowX: "auto",
            display: "block",
          }}
        >
          <table className="table table-striped table-bordered table-hover align-middle mb-0">
            <thead
              className="table-secondary"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 2,
              }}
            >
              <tr>
                <th>Serie</th>
                <th>Descripción</th>
                <th>Último mantenimiento</th>
              </tr>
            </thead>

            <tbody>
              {instrumentos.map((i) => (
                <tr key={i._id}>
                  <td className="text-nowrap">
                    {i.numeroSerie}
                  </td>

                  <td>{i.descripcion}</td>

                  <td className="text-nowrap">
                    {i.fechaUltimoMantenimiento
                      ? new Date(
                          i.fechaUltimoMantenimiento
                        ).toLocaleDateString("es-AR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
