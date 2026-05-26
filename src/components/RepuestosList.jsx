import { useState, useMemo, useEffect } from "react";
import Modal from "./Modal";
import RepuestoForm from "./RepuestoForm";
import * as XLSX from "xlsx";

//const API_URL = "http://localhost:3000";
const API_URL = "https://sistemast.onrender.com";

export default function RepuestosList({
  repuestos = [],
  onRefresh,
}) {
  const [selectedRepuesto, setSelectedRepuesto] =
    useState(null);

  const [loadingDelete, setLoadingDelete] =
    useState(null);

  const [search, setSearch] = useState("");

  // 📄 PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage, setItemsPerPage] =
    useState(10);

  // 🔀 ORDEN
  const [sortField, setSortField] =
    useState("nombre");

  const [sortDirection, setSortDirection] =
    useState("asc");

  const token = localStorage.getItem("token");

  // 🔎 FILTRO + ORDEN
  const filteredRepuestos = useMemo(() => {
    const text = search.toLowerCase().trim();

    let data = repuestos.filter((r) => {
      if (!text) return true;

      const nombre =
        r.nombre?.toLowerCase() || "";

      const codigo =
        r.codigo?.toLowerCase() || "";

      return (
        nombre.includes(text) ||
        codigo.includes(text)
      );
    });

    data.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === "string")
        valA = valA.toLowerCase();

      if (typeof valB === "string")
        valB = valB.toLowerCase();

      if (valA < valB)
        return sortDirection === "asc" ? -1 : 1;

      if (valA > valB)
        return sortDirection === "asc" ? 1 : -1;

      return 0;
    });

    return data;
  }, [
    repuestos,
    search,
    sortField,
    sortDirection,
  ]);

  // 📄 PAGINACIÓN
  const totalPages = Math.ceil(
    filteredRepuestos.length / itemsPerPage
  );

  const paginatedRepuestos = useMemo(() => {
    const start =
      (currentPage - 1) * itemsPerPage;

    return filteredRepuestos.slice(
      start,
      start + itemsPerPage
    );
  }, [
    filteredRepuestos,
    currentPage,
    itemsPerPage,
  ]);

  // 🔁 reset página
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  // 🔁 evitar página vacía
  useEffect(() => {
    if (
      currentPage > totalPages &&
      totalPages > 0
    ) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // 🔀 ordenar
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) =>
        prev === "asc" ? "desc" : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // 🗑️ eliminar
  const handleDelete = async (id) => {
    if (!token) {
      alert("Sesión expirada");
      return;
    }

    if (!window.confirm("¿Eliminar repuesto?"))
      return;

    try {
      setLoadingDelete(id);

      const res = await fetch(
        `${API_URL}/repuestos/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok)
        throw new Error(
          "Error eliminando repuesto"
        );

      onRefresh?.();

    } catch (err) {
      console.error(err);

      alert("Error eliminando repuesto");
    } finally {
      setLoadingDelete(null);
    }
  };

  // 📊 EXPORTAR STOCK BAJO
  const exportLowStock = () => {
    const data = filteredRepuestos
      .filter(
        (r) =>
          (r.stock || 0) <
          (r.stockMinimo || 0)
      )
      .map((r) => ({
        Nombre: r.nombre,
        Código: r.codigo || "",
        Stock: r.stock || 0,
        "Stock mínimo":
          r.stockMinimo || 0,
        Faltante:
          (r.stockMinimo || 0) -
          (r.stock || 0),
      }));

    if (data.length === 0) {
      alert(
        "No hay repuestos con stock bajo"
      );
      return;
    }

    const ws =
      XLSX.utils.json_to_sheet(data);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Stock Bajo"
    );

    XLSX.writeFile(
      wb,
      "repuestos_stock_bajo.xlsx"
    );
  };

  // 🎨 color stock
  const getStockClass = (r) => {
    const stock = Number(r.stock) || 0;

    const min =
      Number(r.stockMinimo) || 0;

    if (stock <= 0)
      return "text-danger fw-bold";

    if (stock <= min)
      return "text-warning fw-bold";

    return "";
  };

  return (
    <div>

      {/* 🔎 BUSCADOR */}
      <div className="d-flex gap-2 mb-3">

        <input
          type="text"
          className="form-control"
          placeholder="Buscar por nombre o código..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <button
          className="btn btn-success"
          onClick={() =>
            setSelectedRepuesto({})
          }
        >
          ➕ Nuevo
        </button>

        <button
          className="btn btn-warning"
          onClick={exportLowStock}
        >
          Exportar ↓
        </button>

      </div>

      {/* 📊 INFO */}
      <div className="mb-2 text-muted small">
        {filteredRepuestos.length} repuestos encontrados
      </div>

      {/* 📋 TABLA */}
      <div className="table-responsive">

        <table className="table table-bordered table-hover table-sm align-middle">

          <thead className="table-dark">
            <tr>

              <th
                role="button"
                onClick={() =>
                  handleSort("nombre")
                }
              >
                Nombre
              </th>

              <th
                role="button"
                onClick={() =>
                  handleSort("codigo")
                }
              >
                Código
              </th>

              <th
                role="button"
                onClick={() =>
                  handleSort("stock")
                }
              >
                Stock
              </th>

              <th
                role="button"
                onClick={() =>
                  handleSort("stockMinimo")
                }
              >
                Stock mínimo
              </th>

              <th className="text-center">
                Acciones
              </th>

            </tr>
          </thead>

          <tbody>

            {paginatedRepuestos.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="text-center text-muted py-3"
                >
                  No se encontraron resultados
                </td>
              </tr>
            ) : (
              paginatedRepuestos.map((r) => {

                const lowStock =
                  (r.stock || 0) <=
                  (r.stockMinimo || 0);

                return (
                  <tr key={r._id}>

                    <td>
                      {r.nombre}

                      {lowStock && (
                        <span className="badge bg-warning text-dark ms-2">
                          Bajo
                        </span>
                      )}
                    </td>

                    <td>
                      {r.codigo || "—"}
                    </td>

                    <td
                      className={getStockClass(r)}
                    >
                      {r.stock ?? 0}
                    </td>

                    <td>
                      {r.stockMinimo ?? 0}
                    </td>

                    <td className="text-center">

                      <button
                        className="btn btn-sm btn-primary me-1"
                        onClick={() =>
                          setSelectedRepuesto(r)
                        }
                      >
                        ✏️
                      </button>

                      <button
                        className="btn btn-sm btn-danger"
                        disabled={
                          loadingDelete === r._id
                        }
                        onClick={() =>
                          handleDelete(r._id)
                        }
                      >
                        {loadingDelete === r._id
                          ? "..."
                          : "🗑️"}
                      </button>

                    </td>

                  </tr>
                );
              })
            )}

          </tbody>

        </table>

      </div>

      {/* 📄 PAGINACIÓN */}
      <div className="d-flex justify-content-between align-items-center mt-3">

        <div className="d-flex align-items-center gap-2">

          <span>Mostrar:</span>

          <select
            className="form-select form-select-sm"
            style={{ width: "80px" }}
            value={itemsPerPage}
            onChange={(e) =>
              setItemsPerPage(
                Number(e.target.value)
              )
            }
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>

        </div>

        <div className="d-flex align-items-center gap-2">

          <button
            className="btn btn-sm btn-outline-primary"
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((p) => p - 1)
            }
          >
            ⬅
          </button>

          <span>
            Página <b>{currentPage}</b> de{" "}
            <b>{totalPages || 1}</b>
          </span>

          <button
            className="btn btn-sm btn-outline-primary"
            disabled={
              currentPage === totalPages ||
              totalPages === 0
            }
            onClick={() =>
              setCurrentPage((p) => p + 1)
            }
          >
            ➡
          </button>

        </div>

      </div>

      {/* 🪟 MODAL */}
      {selectedRepuesto !== null && (
        <Modal
          onClose={() =>
            setSelectedRepuesto(null)
          }
        >
          <RepuestoForm
            repuesto={
              selectedRepuesto._id
                ? selectedRepuesto
                : null
            }
            onClose={() =>
              setSelectedRepuesto(null)
            }
            onCreated={() => {
              setSelectedRepuesto(null);
              onRefresh?.();
            }}
          />
        </Modal>
      )}

    </div>
  );
}