import { useEffect, useState } from "react";
import { getInstrumentos } from "../api/api";

export default function ClienteInstrumentos({ cliente }) {
  const [instrumentos, setInstrumentos] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      const data = await getInstrumentos();
      const filtrados = data.filter(
        (i) => i.cliente?._id === cliente._id
      );
      setInstrumentos(filtrados);
    };

    cargar();
  }, [cliente]);

  return (
    <div>
      <h5 className="mb-3">
        <i className="bi bi-building me-2"></i>
        {cliente.nombre}
      </h5>

      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="table-secondary">
            <tr>
              <th>Serie</th>
              <th>Descripción</th>
              <th>Último Mantenimiento</th>
            </tr>
          </thead>
          <tbody>
            {instrumentos.map((i) => (
              <tr key={i._id}>
                <td>{i.numeroSerie}</td>
                <td>{i.descripcion}</td>
                <td>
                  {i.fechaUltimoMantenimiento
                    ? new Date(i.fechaUltimoMantenimiento).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {instrumentos.length === 0 && (
          <div className="text-muted text-center mt-3">
            Este cliente no tiene instrumentos instalados.
          </div>
        )}
      </div>
    </div>
  );
}