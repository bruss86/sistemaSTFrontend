import { useEffect, useState } from "react";
import { getInstrumentosByCliente } from "../api/api";

export default function ClienteDashboard({ cliente, onClose }) {
  const [instrumentos, setInstrumentos] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      const data = await getInstrumentosByCliente(cliente._id);
      setInstrumentos(data);
    };

    if (cliente) cargar();
  }, [cliente]);

  return (
    <div className="card mt-3 p-3 shadow-sm">

      {/* HEADER */}
      <div className="d-flex justify-content-between">
        <h4>🏢 {cliente.nombre}</h4>

        <button className="btn btn-sm btn-secondary" onClick={onClose}>
          ✖ Cerrar
        </button>
      </div>

      <p>
        📌 {cliente.codigoCliente} <br />
        📧 {cliente.email} <br />
        📍 {cliente.direccion}
      </p>

      <hr />

      {/* INSTRUMENTOS */}
      <h5>🧰 Instrumentos asignados</h5>

      {instrumentos.length === 0 ? (
        <p className="text-muted">Sin instrumentos asignados</p>
      ) : (
        <div className="row">
          {instrumentos.map((i) => (
            <div key={i._id} className="col-md-6 mb-2">
              <div className="card p-2 shadow-sm">
                <strong>{i.descripcion}</strong>

                <p className="mb-1">🔢 {i.numeroSerie}</p>
                <p className="mb-1">📦 {i.numeroPartida}</p>

                <span className="badge bg-secondary">
                  {i.condicion}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}