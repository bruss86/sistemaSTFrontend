import { useEffect, useState } from "react";
import { getInstrumentos, getClientes } from "../api/api";


export default function Dashboard({ refresh }) {
  const [instrumentos, setInstrumentos] = useState([]);
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      const ins = await getInstrumentos();
      const cli = await getClientes();

      // 🔥 VALIDACIÓN SEGURA
      setInstrumentos(Array.isArray(ins) ? ins : ins?.instrumentos || []);
      setClientes(Array.isArray(cli) ? cli : cli?.clientes || []);
    };

    cargar();
  }, [refresh]);

  const hoy = new Date();

  const vencidos = instrumentos.filter((i) =>
    i.fechaUltimoMantenimiento
      ? new Date(i.fechaUltimoMantenimiento) < hoy
      : false
  );

  const proximos = instrumentos.filter((i) => {
    if (!i.fechaUltimoMantenimiento) return false;

    const fecha = new Date(i.fechaUltimoMantenimiento);
    const diff = (fecha - hoy) / (1000 * 60 * 60 * 24);

    return diff <= 30 && diff >= 0;
  });

  const cards = [
    {
      title: "Clientes",
      value: clientes.length,
      icon: "bi-people-fill",
      color: "#0d6efd",
    },
    {
      title: "Instrumentos",
      value: instrumentos.length,
      icon: "bi-tools",
      color: "#198754",
    },
    {
      title: "Próximos (30 días)",
      value: proximos.length,
      icon: "bi-exclamation-triangle-fill",
      color: "#ffc107",
    },
    {
      title: "Vencidos",
      value: vencidos.length,
      icon: "bi-x-circle-fill",
      color: "#dc3545",
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">

      {cards.map((c, i) => (
        <div
          key={i}
          style={{
            background: c.color,
            color: "white",
            padding: "15px",
            borderRadius: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          }}
        >
          <i className={`bi ${c.icon}`} style={{ fontSize: "26px" }}></i>

          <div className="text-end">
            <div style={{ fontSize: "14px", opacity: 0.9 }}>
              {c.title}
            </div>
            <div style={{ fontSize: "22px", fontWeight: "bold" }}>
              {c.value}
            </div>
          </div>
        </div>
      ))}

      {/* ALERTAS */}
      <div className="mt-2">
        {vencidos.length > 0 && (
          <div className="alert alert-danger">
            ⚠️ {vencidos.length} instrumentos vencidos
          </div>
        )}

        {proximos.length > 0 && (
          <div className="alert alert-warning">
            ⏳ {proximos.length} próximos a mantenimiento
          </div>
        )}

        {vencidos.length === 0 && proximos.length === 0 && (
          <div className="alert alert-success">
            <i className="bi bi-check-circle-fill"></i> Todo en orden
          </div>
        )}
      </div>

    </div>
  );
}