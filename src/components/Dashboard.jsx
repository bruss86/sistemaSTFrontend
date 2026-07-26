import { useEffect, useMemo, useState } from "react";
import { getInstrumentos, getClientes, obtenerTareas } from "../api/api";
import "../styles/Dashboard.css";

export default function Dashboard({ refresh }) {
  const [instrumentos, setInstrumentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tareas, setTareas] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      try {
        const ins = await getInstrumentos();
        const cli = await getClientes();
        const tar = await obtenerTareas();

        setInstrumentos(Array.isArray(ins) ? ins : ins?.instrumentos || []);
        setClientes(Array.isArray(cli) ? cli : cli?.clientes || []);
        setTareas(Array.isArray(tar) ? tar : tar?.tareas || []);
      } catch (error) {
        console.error("Error dashboard:", error);
      }
    };

    cargar();
  }, [refresh]);

  const parseDateSafe = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getDiasDiferencia = (fecha) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const f = parseDateSafe(fecha);
    if (!f) return null;

    return Math.floor((f - hoy) / (1000 * 60 * 60 * 24));
  };

  const { vencidos, proximos } = useMemo(() => {
    const venc = [];
    const prox = [];

    instrumentos.forEach((i) => {
      const fecha =
        i.fechaProximoMantenimiento ||
        i.fechaUltimoMantenimiento;

      const dias = getDiasDiferencia(fecha);

      if (dias === null) return;

      if (dias < 0) venc.push(i);
      else if (dias <= 30) prox.push(i);
    });

    return { vencidos: venc, proximos: prox };
  }, [instrumentos]);

  const tareasPendientes = useMemo(() => {
    return tareas.filter(
      (t) => t.estado === "Pendiente" || !t.estado
    );
  }, [tareas]);

  const cards = [
    {
      title: "Clientes registrados",
      value: clientes.length,
      icon: "bi-people-fill",
      color: "#0d6efd",
      bg: "#e7f1ff",
    },
    {
      title: "Instrumentos registrados",
      value: instrumentos.length,
      icon: "bi-tools",
      color: "#198754",
      bg: "#e9f7ef",
    },
    {
      title: "Tareas pendientes",
      value: tareasPendientes.length,
      icon: "bi-list-task",
      color: "#6f42c1",
      bg: "#f3e8ff",
    },
    {
      title: "Mantenimientos próximos",
      value: proximos.length,
      icon: "bi-exclamation-triangle-fill",
      color: "#ffc107",
      bg: "#fff8e1",
    },
    {
      title: "Mantenimientos vencidos",
      value: vencidos.length,
      icon: "bi-x-circle-fill",
      color: "#dc3545",
      bg: "#fdecec",
    },
  ];

  return (
    <div className="dashboard-container">

      {cards.map((c, i) => (
        <div
          key={i}
          className="dashboard-card"
          style={{
            borderLeft: `6px solid ${c.color}`,
          }}
        >
          <div className="dashboard-card-content">

            <div>
              <div className="dashboard-title">
                {c.title}
              </div>

              <div className="dashboard-value">
                {c.value}
              </div>
            </div>

            <div
              className="dashboard-icon-box"
              style={{ background: c.bg }}
            >
              <i
                className={`bi ${c.icon}`}
                style={{ color: c.color }}
              />
            </div>

          </div>
        </div>
      ))}

      <div className="dashboard-status">

  {tareasPendientes.length > 0 && (
    <div className="status-card info">
      <div className="status-icon">📝</div>
      <div>
        <div className="status-title">Tareas pendientes</div>
        <div className="status-text">
          {tareasPendientes.length} por realizar
        </div>
      </div>
    </div>
  )}

  {vencidos.length > 0 && (
    <div className="status-card danger">
      <div className="status-icon">⚠️</div>
      <div>
        <div className="status-title">Instrumentos vencidos</div>
        <div className="status-text">
          {vencidos.length} requieren mantenimiento
        </div>
      </div>
    </div>
  )}

  {proximos.length > 0 && (
    <div className="status-card warning">
      <div className="status-icon">⏳</div>
      <div>
        <div className="status-title">Próximos mantenimientos</div>
        <div className="status-text">
          {proximos.length} vencerán en 30 días
        </div>
      </div>
    </div>
  )}

  {tareasPendientes.length === 0 &&
    vencidos.length === 0 &&
    proximos.length === 0 && (
      <div className="status-card success">
        <div className="status-icon">✅</div>
        <div>
          <div className="status-title">Sistema al día</div>
          <div className="status-text">
            No hay alertas pendientes
          </div>
        </div>
      </div>
    )}

</div>

    </div>
  );
}