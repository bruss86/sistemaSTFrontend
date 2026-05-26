import { useEffect, useMemo, useState } from "react";
import { getInstrumentos, getClientes, obtenerTareas } from "../api/api";

export default function Dashboard({ refresh }) {
  const [instrumentos, setInstrumentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tareas, setTareas] = useState([]);

  // =========================
  // CARGA DATOS
  // =========================
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

  // =========================
  // HELPERS FECHAS
  // =========================
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

  // =========================
  // VENCIMIENTOS
  // =========================
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

  // =========================
  // TAREAS PENDIENTES
  // =========================
  const tareasPendientes = useMemo(() => {
    return tareas.filter(t =>
      t.estado === "Pendiente" ||
      !t.estado
    );
  }, [tareas]);

  // =========================
  // CARDS
  // =========================
  const cards = [
    {
      title: "Clientes",
      value: clientes.length,
      icon: "bi-people-fill",
      color: "#0d6efd",
      bg: "#e7f1ff",
    },
    {
      title: "Instrumentos",
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
      title: "Próximos",
      value: proximos.length,
      icon: "bi-exclamation-triangle-fill",
      color: "#ffc107",
      bg: "#fff8e1",
    },
    {
      title: "Vencidos",
      value: vencidos.length,
      icon: "bi-x-circle-fill",
      color: "#dc3545",
      bg: "#fdecec",
    },
  ];

  return (
    <div
      className="d-flex flex-column gap-3"
      style={{ position: "sticky", top: "85px" }}
    >
      {cards.map((c, i) => (
        <div
          key={i}
          className="dashboard-card"
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "18px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
            borderLeft: `6px solid ${c.color}`,
            transition: "0.2s",
          }}
        >
          <div className="d-flex justify-content-between align-items-center">

            <div>
              <div style={{ fontSize: "13px", color: "#666" }}>
                {c.title}
              </div>

              <div style={{ fontSize: "32px", fontWeight: "700" }}>
                {c.value}
              </div>
            </div>

            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "16px",
                background: c.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i
                className={`bi ${c.icon}`}
                style={{
                  fontSize: "28px",
                  color: c.color,
                }}
              />
            </div>

          </div>
        </div>
      ))}

      {/* ALERTAS */}
      <div className="d-flex flex-column gap-2">

        {tareasPendientes.length > 0 && (
          <div className="alert alert-info m-0">
            📝 {tareasPendientes.length} tareas pendientes
          </div>
        )}

        {vencidos.length > 0 && (
          <div className="alert alert-danger m-0">
            ⚠️ {vencidos.length} instrumentos vencidos
          </div>
        )}

        {proximos.length > 0 && (
          <div className="alert alert-warning m-0">
            ⏳ {proximos.length} próximos a mantenimiento
          </div>
        )}

        {tareasPendientes.length === 0 &&
          vencidos.length === 0 &&
          proximos.length === 0 && (
            <div className="alert alert-success m-0">
              ✔ Todo en orden
            </div>
        )}

      </div>

      <style>
        {`
          .dashboard-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 22px rgba(0,0,0,0.12);
          }
        `}
      </style>
    </div>
  );
}