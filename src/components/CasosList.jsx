// components/CasosList.jsx

import { useState, useMemo, useEffect } from "react";
import Modal from "./Modal";

export default function CasosList({
  casos = [],
  onRefresh,
}) {

  const API_URL = import.meta.env.VITE_API_URL;

  const [casoSeleccionado, setCasoSeleccionado] = useState(null);

  const [search, setSearch] = useState("");

  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortField, setSortField] = useState("fechaCreacion");

  const [sortDirection, setSortDirection] = useState("desc");


  //Función para actualizar el estado del caso
  const actualizarEstado = async (
        id,
        estado
        ) => {

        try {

            const token =
            localStorage.getItem("token");

            await fetch(
            `${API_URL}/casos/${id}/estado`,
            {
                method: "PUT",
                headers: {
                "Content-Type":
                    "application/json",
                Authorization:
                    `Bearer ${token}`,
                },
                body: JSON.stringify({
                estado,
                }),
            }
            );

            onRefresh?.();

        } catch (error) {
            console.error(error);
            alert(
            "Error actualizando estado"
            );
        }
        };

  const getEstadoBadge = (
  estado
        ) => {

        switch (estado) {

            case "Abierto":
            return "bg-danger";

            case "En Proceso":
            return "bg-warning text-dark";

            case "Pendiente Cliente":
            return "bg-info";

            case "Cerrado":
            return "bg-success";

            default:
            return "bg-secondary";
        }
        };

  // 🔎 FILTRO + ORDEN
  const filteredCasos = useMemo(() => {

    let data = casos.filter((c) => {

      const texto =
        search.toLowerCase().trim();

      const coincideBusqueda =
        !texto ||
        c.numero?.toLowerCase()
          .includes(texto) ||
        c.asunto?.toLowerCase()
          .includes(texto) ||
        c.remitente?.toLowerCase()
          .includes(texto);

      const coincideEstado =
        estadoFiltro === "todos"
          ? true
          : c.estado === estadoFiltro;

      return (
        coincideBusqueda &&
        coincideEstado
      );
    });

    data.sort((a, b) => {

      let valA = a[sortField];
      let valB = b[sortField];

      if (
        sortField === "fechaCreacion"
      ) {
        valA = new Date(valA);
        valB = new Date(valB);
      }

      if (
        typeof valA === "string"
      ) {
        valA = valA.toLowerCase();
      }

      if (
        typeof valB === "string"
      ) {
        valB = valB.toLowerCase();
      }

      if (valA < valB)
        return sortDirection === "asc"
          ? -1
          : 1;

      if (valA > valB)
        return sortDirection === "asc"
          ? 1
          : -1;

      return 0;
    });

    return data;

  }, [
    casos,
    search,
    estadoFiltro,
    sortField,
    sortDirection,
  ]);

  // 📄 PAGINACIÓN
  const totalPages = Math.ceil(
    filteredCasos.length /
      itemsPerPage
  );

  const paginatedCasos =
    useMemo(() => {

      const start =
        (currentPage - 1) *
        itemsPerPage;

      return filteredCasos.slice(
        start,
        start + itemsPerPage
      );

    }, [
      filteredCasos,
      currentPage,
      itemsPerPage,
    ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    estadoFiltro,
    itemsPerPage,
  ]);

  useEffect(() => {
    if (
      currentPage > totalPages &&
      totalPages > 0
    ) {
      setCurrentPage(totalPages);
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const handleSort = (
    field
  ) => {

    if (
      sortField === field
    ) {

      setSortDirection(
        (prev) =>
          prev === "asc"
            ? "desc"
            : "asc"
      );

    } else {

      setSortField(field);

      setSortDirection(
        "asc"
      );
    }
  };

  return (
    <div>

      {/* 🔎 BUSCADOR */}
      <div className="d-flex gap-2 mb-3">

        <input
          type="text"
          className="form-control"
          placeholder="Buscar por caso, asunto o remitente..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        <select
          className="form-select"
          style={{
            width: "180px",
          }}
          value={estadoFiltro}
          onChange={(e) =>
            setEstadoFiltro(
              e.target.value
            )
          }
        >
          <option value="todos">
            Todos
          </option>

          <option value="Abierto">
            Abiertos
          </option>

          <option value="Cerrado">
            Cerrados
          </option>

        </select>

      </div>

      {/* 📊 INFO */}
      <div className="mb-2 text-muted small">
        {
          filteredCasos.length
        }{" "}
        casos encontrados
      </div>

      {/* 📋 TABLA */}
      <div className="table-responsive">

        <table className="table table-bordered table-hover table-sm align-middle">

          <thead className="table-dark">

            <tr>

              <th
                role="button"
                onClick={() =>
                  handleSort(
                    "numero"
                  )
                }
              >
                Caso
              </th>

              <th
                role="button"
                onClick={() =>
                  handleSort(
                    "fechaCreacion"
                  )
                }
              >
                Fecha
              </th>

              <th
                role="button"
                onClick={() =>
                  handleSort(
                    "estado"
                  )
                }
              >
                Estado
              </th>

              <th
                role="button"
                onClick={() =>
                  handleSort(
                    "remitente"
                  )
                }
              >
                Remitente
              </th>

              <th>
                Asunto
              </th>

              <th>
                Mensajes
              </th>

              <th className="text-center">
                Acciones
              </th>

            </tr>

          </thead>

          <tbody>

            {paginatedCasos.length ===
            0 ? (

              <tr>

                <td
                  colSpan="7"
                  className="text-center text-muted py-3"
                >
                  No se encontraron casos
                </td>

              </tr>

            ) : (

              paginatedCasos.map(
                (c) => (

                  <tr
                    key={c._id}
                    onDoubleClick={() =>
                      setCasoSeleccionado(
                        c
                      )
                    }
                    style={{
                      cursor:
                        "pointer",
                    }}
                  >

                    <td>
                      <strong>
                        {
                          c.numero
                        }
                      </strong>
                    </td>

                    <td>
                      {new Date(
                        c.fechaCreacion
                      ).toLocaleDateString()}
                    </td>

                    <td>

                     <span
                        className={`badge ${getEstadoBadge(
                            c.estado
                        )}`}
                        >
                        {c.estado}
                        </span>

                    </td>

                    <td>
                      {
                        c.remitente
                      }
                    </td>

                    <td>
                      {
                        c.asunto
                      }
                    </td>

                    <td>
                      {c
                        .mensajes
                        ?.length ||
                        0}
                    </td>

                    <td className="text-center">

                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() =>
                          setCasoSeleccionado(
                            c
                          )
                        }
                      >
                        👁️
                      </button>

                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>

      {/* 📄 PAGINACIÓN */}
      <div className="d-flex justify-content-between align-items-center mt-3">

        <div className="d-flex align-items-center gap-2">

          <span>
            Mostrar:
          </span>

          <select
            className="form-select form-select-sm"
            style={{
              width: "80px",
            }}
            value={
              itemsPerPage
            }
            onChange={(e) =>
              setItemsPerPage(
                Number(
                  e.target.value
                )
              )
            }
          >
            <option value={10}>
              10
            </option>

            <option value={20}>
              20
            </option>

            <option value={50}>
              50
            </option>

          </select>

        </div>

        <div className="d-flex align-items-center gap-2">

          <button
            className="btn btn-sm btn-outline-primary"
            disabled={
              currentPage ===
              1
            }
            onClick={() =>
              setCurrentPage(
                (p) => p - 1
              )
            }
          >
            ⬅
          </button>

          <span>
            Página{" "}
            <b>
              {
                currentPage
              }
            </b>{" "}
            de{" "}
            <b>
              {totalPages ||
                1}
            </b>
          </span>

          <button
            className="btn btn-sm btn-outline-primary"
            disabled={
              currentPage ===
                totalPages ||
              totalPages ===
                0
            }
            onClick={() =>
              setCurrentPage(
                (p) => p + 1
              )
            }
          >
            ➡
          </button>

        </div>

      </div>

      {/* 🪟 DETALLE CASO */}
      {casoSeleccionado && (

        <Modal
          onClose={() =>
            setCasoSeleccionado(
              null
            )
          }
        >

          <h4>
            {
              casoSeleccionado.numero
            }
          </h4>

          <p>
            <strong>
              Asunto:
            </strong>{" "}
            {
              casoSeleccionado.asunto
            }
          </p>

          <p>
            <strong>
              Remitente:
            </strong>{" "}
            {
              casoSeleccionado.remitente
            }
          </p>

          <div className="mb-3">

            <label className="form-label">
                Estado
            </label>

            <select
                className="form-select"
                value={
                casoSeleccionado.estado
                }
                onChange={async (e) => {

                const nuevoEstado =
                    e.target.value;

                setCasoSeleccionado({
                    ...casoSeleccionado,
                    estado:
                    nuevoEstado,
                });

                await actualizarEstado(
                    casoSeleccionado._id,
                    nuevoEstado
                );
                }}
            >

                <option value="Abierto">
                Abierto
                </option>

                <option value="En Proceso">
                En Proceso
                </option>

                <option value="Pendiente Cliente">
                Pendiente Cliente
                </option>

                <option value="Cerrado">
                Cerrado
                </option>

            </select>

            </div>

          <hr />

          <h5>
            Historial
          </h5>

          {casoSeleccionado
            .mensajes
            ?.length ===
          0 ? (

            <p>
              Sin mensajes
            </p>

          ) : (

            casoSeleccionado.mensajes.map(
              (
                m,
                index
              ) => (

                <div
                  key={
                    index
                  }
                  className="card mb-2"
                >

                  <div className="card-body">

                    <div className="small text-muted mb-2">
                      {new Date(
                        m.fecha
                      ).toLocaleString()}
                    </div>

                    <div>
                      <strong>
                        {
                          m.remitente
                        }
                      </strong>
                    </div>

                    <div>
                      {
                        m.texto
                      }
                    </div>

                  </div>

                </div>

              )
            )

          )}

        </Modal>

      )}

    </div>
  );
}