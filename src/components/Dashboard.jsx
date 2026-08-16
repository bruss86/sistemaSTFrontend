import { useEffect, useMemo, useState } from "react";
import {
  getInstrumentos,
  getClientes,
  obtenerTareas,
} from "../api/api";
import "../styles/Dashboard.css";

export default function Dashboard({ refresh, onNavigate }) {
  const [instrumentos, setInstrumentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tareas, setTareas] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [ins, cli, tar] = await Promise.all([
          getInstrumentos(),
          getClientes(),
          obtenerTareas(),
        ]);

        setInstrumentos(
          Array.isArray(ins) ? ins : ins?.instrumentos || []
        );

        setClientes(
          Array.isArray(cli) ? cli : cli?.clientes || []
        );

        setTareas(
          Array.isArray(tar) ? tar : tar?.tareas || []
        );
      } catch (error) {
        console.error("Error dashboard:", error);
      }
    };

    cargar();
  }, [refresh]);

  // ---------------------------------------------------------
  // Convierte una fecha a Date de forma segura
  // ---------------------------------------------------------
  const parseDateSafe = (value) => {
    if (!value) return null;

    // Si viene como YYYY-MM-DD evitamos problemas de zona horaria
    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      const [year, month, day] = value.split("-").map(Number);

      return new Date(year, month - 1, day);
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return null;
    }

    date.setHours(0, 0, 0, 0);

    return date;
  };

  // ---------------------------------------------------------
  // Calcula la fecha de próximo mantenimiento
  // Último mantenimiento + 12 meses
  // ---------------------------------------------------------
  const getFechaProximoMantenimiento = (fechaUltimo) => {
    const fecha = parseDateSafe(fechaUltimo);

    if (!fecha) return null;

    const proxima = new Date(fecha);

    proxima.setMonth(proxima.getMonth() + 12);

    return proxima;
  };

  // ---------------------------------------------------------
  // Calcula diferencia de días entre una fecha y hoy
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
  // Estadísticas del dashboard
  // ---------------------------------------------------------
  const {
    vencidos,
    proximos,
    tareasPendientes,
  } = useMemo(() => {
    const vencidos = [];
    const proximos = [];

    instrumentos.forEach((instrumento) => {
      const fechaProximo = getFechaProximoMantenimiento(
        instrumento.fechaUltimoMantenimiento
      );

      if (!fechaProximo) return;

      const dias = getDiasDiferencia(fechaProximo);

      if (dias === null) return;

      // Ya venció
      if (dias < 0) {
        vencidos.push({
          ...instrumento,
          fechaProximoMantenimiento: fechaProximo,
          diasVencido: Math.abs(dias),
        });
      }

      // Vence dentro de los próximos 30 días
      else if (dias <= 30) {
        proximos.push({
          ...instrumento,
          fechaProximoMantenimiento: fechaProximo,
          diasRestantes: dias,
        });
      }
    });

    const tareasPendientes = tareas.filter(
      (t) => t.estado === "Pendiente" || !t.estado
    );

    return {
      vencidos,
      proximos,
      tareasPendientes,
    };
  }, [instrumentos, tareas]);

  // ---------------------------------------------------------
  // Tarjetas principales
  // ---------------------------------------------------------
  const cards = [
    {
      title: "Clientes registrados",
      value: clientes.length,
      icon: "bi-people-fill",
      color: "#0d6efd",
      bg: "#e7f1ff",
      view: "clientes",
    },
    {
      title: "Instrumentos registrados",
      value: instrumentos.length,
      icon: "bi-tools",
      color: "#198754",
      bg: "#e9f7ef",
      view: "instrumentos",
    },
    {
      title: "Tareas pendientes",
      value: tareasPendientes.length,
      icon: "bi-list-task",
      color: "#6f42c1",
      bg: "#f3e8ff",
      view: "tareas",
    },
    {
      title: "Mantenimientos próximos",
      value: proximos.length,
      icon: "bi-exclamation-triangle-fill",
      color: "#ffc107",
      bg: "#fff8e1",
      view: "mantenimientos",
      filtro: "proximo",
    },
    {
      title: "Mantenimientos vencidos",
      value: vencidos.length,
      icon: "bi-x-circle-fill",
      color: "#dc3545",
      bg: "#fdecec",
      view: "mantenimientos",
      filtro: "vencido",
    },
  ];

  return (
    <div className="dashboard-container">

      {/* -------------------------------------------------- */}
      {/* TARJETAS PRINCIPALES                               */}
      {/* -------------------------------------------------- */}

      {cards.map((c, i) => (
        <button
          key={i}
          type="button"
          className="dashboard-card"
          onClick={() => onNavigate(c.view, c.filtro)}
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
              style={{
                background: c.bg,
              }}
            >
              <i
                className={`bi ${c.icon}`}
                style={{
                  color: c.color,
                }}
              />
            </div>

          </div>
        </button>
      ))}

      {/* -------------------------------------------------- */}
      {/* ALERTAS                                            */}
      {/* -------------------------------------------------- */}

      <div className="dashboard-status">

        {/* Tareas pendientes */}
        {tareasPendientes.length > 0 && (
          <div className="status-card info">

            <div className="status-icon">
              📝
            </div>

            <div>
              <div className="status-title">
                Tareas pendientes
              </div>

              <div className="status-text">
                {tareasPendientes.length} por realizar
              </div>
            </div>

          </div>
        )}

        {/* Instrumentos vencidos */}
        {vencidos.length > 0 && (
          <div className="status-card danger">

            <div className="status-icon">
              ⚠️
            </div>

            <div>
              <div className="status-title">
                Instrumentos vencidos
              </div>

              <div className="status-text">
                {vencidos.length} requieren mantenimiento
              </div>
            </div>

          </div>
        )}

        {/* Próximos mantenimientos */}
        {proximos.length > 0 && (
          <div className="status-card warning">

            <div className="status-icon">
              ⏳
            </div>

            <div>
              <div className="status-title">
                Próximos mantenimientos
              </div>

              <div className="status-text">
                {proximos.length} vencerán en 30 días
              </div>
            </div>

          </div>
        )}

        {/* Sistema al día */}
        {tareasPendientes.length === 0 &&
          vencidos.length === 0 &&
          proximos.length === 0 && (
            <div className="status-card success">

              <div className="status-icon">
                ✅
              </div>

              <div>
                <div className="status-title">
                  Sistema al día
                </div>

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