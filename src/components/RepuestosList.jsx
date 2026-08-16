import {
  useState,
  useMemo,
  useEffect,
  useRef,
} from "react";

import Modal from "./Modal";
import RepuestoForm from "./RepuestoForm";
import * as XLSX from "xlsx";

const API_URL = import.meta.env.VITE_API_URL;

export default function RepuestosList({
  repuestos = [],
  onRefresh,
}) {
  // =========================================================
  // ESTADOS
  // =========================================================

  const [selectedRepuesto, setSelectedRepuesto] =
    useState(null);

  const [loadingDelete, setLoadingDelete] =
    useState(null);

  // 🔎 BÚSQUEDA
  const [search, setSearch] = useState("");

  // 🏭 FILTRO FABRICANTE
  const [fabricanteFilter, setFabricanteFilter] =
    useState("");

  // 🔧 FILTRO MODELO
  const [modeloFilter, setModeloFilter] =
    useState("");

  // 📊 FILTRO STOCK
  const [stockFilter, setStockFilter] =
    useState("todos");

  // 📄 PAGINACIÓN
  const [currentPage, setCurrentPage] =
    useState(1);

  const [itemsPerPage, setItemsPerPage] =
    useState(10);

  // 🔀 ORDEN
  const [sortField, setSortField] =
    useState("nombre");

  const [sortDirection, setSortDirection] =
    useState("asc");

  // 📥 IMPORTACIÓN
  const [importPreview, setImportPreview] =
    useState(null);

  const [importLoading, setImportLoading] =
    useState(false);

  const [importFileName, setImportFileName] =
    useState("");

  const fileInputRef = useRef(null);

  const token =
    localStorage.getItem("token");

  // =========================================================
  // 📊 ESTADO DEL STOCK
  // =========================================================

  const getStockStatus = (repuesto) => {
    const stock =
      Number(repuesto.stock) || 0;

    const minimo =
      Number(repuesto.stockMinimo) || 0;

    if (stock <= 0) {
      return "sin-stock";
    }

    if (stock <= minimo) {
      return "bajo";
    }

    return "normal";
  };

  // =========================================================
  // 📊 RESUMEN STOCK
  // =========================================================

  const stockSummary = useMemo(() => {
    let normal = 0;
    let bajo = 0;
    let sinStock = 0;

    repuestos.forEach((r) => {
      const estado =
        getStockStatus(r);

      if (estado === "normal") {
        normal++;
      }

      if (estado === "bajo") {
        bajo++;
      }

      if (estado === "sin-stock") {
        sinStock++;
      }
    });

    return {
      total: repuestos.length,
      normal,
      bajo,
      sinStock,
    };
  }, [repuestos]);

  // =========================================================
  // 🏭 FABRICANTES
  // =========================================================

  const fabricantes = useMemo(() => {
    return [
      ...new Set(
        repuestos
          .map((r) =>
            r.fabricante?.trim()
          )
          .filter(Boolean)
      ),
    ].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [repuestos]);

  // =========================================================
  // 🔧 MODELOS
  // =========================================================

  const modelos = useMemo(() => {
    const modelosFiltrados =
      repuestos
        .filter((r) => {
          if (!fabricanteFilter) {
            return true;
          }

          return (
            r.fabricante?.trim() ===
            fabricanteFilter
          );
        })
        .map((r) =>
          r.modelo?.trim()
        )
        .filter(Boolean);

    return [
      ...new Set(modelosFiltrados),
    ].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [
    repuestos,
    fabricanteFilter,
  ]);

  // =========================================================
  // 🔎 FILTRO + ORDEN
  // =========================================================

  const filteredRepuestos = useMemo(() => {
    const text =
      search.toLowerCase().trim();

    let data = repuestos.filter((r) => {
      // 🔎 BÚSQUEDA GENERAL
      if (text) {
        const nombre =
          r.nombre?.toLowerCase() || "";

        const codigo =
          r.codigo?.toLowerCase() || "";

        const fabricante =
          r.fabricante?.toLowerCase() ||
          "";

        const modelo =
          r.modelo?.toLowerCase() || "";

        const descripcion =
          r.descripcion?.toLowerCase() ||
          "";

        const coincide =
          nombre.includes(text) ||
          codigo.includes(text) ||
          fabricante.includes(text) ||
          modelo.includes(text) ||
          descripcion.includes(text);

        if (!coincide) {
          return false;
        }
      }

      // 🏭 FABRICANTE
      if (
        fabricanteFilter &&
        r.fabricante?.trim() !==
          fabricanteFilter
      ) {
        return false;
      }

      // 🔧 MODELO
      if (
        modeloFilter &&
        r.modelo?.trim() !==
          modeloFilter
      ) {
        return false;
      }

      // 📊 STOCK
      if (
        stockFilter !== "todos" &&
        getStockStatus(r) !==
          stockFilter
      ) {
        return false;
      }

      return true;
    });

    // 🔀 ORDEN
    data.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (
        sortField === "stock" ||
        sortField === "stockMinimo"
      ) {
        valA =
          Number(valA) || 0;

        valB =
          Number(valB) || 0;
      }

      if (typeof valA === "string") {
        valA =
          valA.toLowerCase();
      }

      if (typeof valB === "string") {
        valB =
          valB.toLowerCase();
      }

      if (valA < valB) {
        return sortDirection === "asc"
          ? -1
          : 1;
      }

      if (valA > valB) {
        return sortDirection === "asc"
          ? 1
          : -1;
      }

      return 0;
    });

    return data;
  }, [
    repuestos,
    search,
    fabricanteFilter,
    modeloFilter,
    stockFilter,
    sortField,
    sortDirection,
  ]);

  // =========================================================
  // 📄 PAGINACIÓN
  // =========================================================

  const totalPages = Math.ceil(
    filteredRepuestos.length /
      itemsPerPage
  );

  const paginatedRepuestos =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        itemsPerPage;

      return filteredRepuestos.slice(
        start,
        start + itemsPerPage
      );
    }, [
      filteredRepuestos,
      currentPage,
      itemsPerPage,
    ]);

  // =========================================================
  // 🔁 RESET PAGINACIÓN
  // =========================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    fabricanteFilter,
    modeloFilter,
    stockFilter,
    itemsPerPage,
  ]);

  // =========================================================
  // 🔁 EVITAR PÁGINA VACÍA
  // =========================================================

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

  // =========================================================
  // 🔀 ORDENAR
  // =========================================================

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) =>
        prev === "asc"
          ? "desc"
          : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return "";
    }

    return sortDirection === "asc"
      ? " ↑"
      : " ↓";
  };

  // =========================================================
  // 🗑️ ELIMINAR
  // =========================================================

  const handleDelete = async (id) => {
    if (!token) {
      alert("Sesión expirada");
      return;
    }

    if (
      !window.confirm(
        "¿Eliminar repuesto?"
      )
    ) {
      return;
    }

    try {
      setLoadingDelete(id);

      const res = await fetch(
        `${API_URL}/repuestos/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(
          "Error eliminando repuesto"
        );
      }

      onRefresh?.();

    } catch (err) {
      console.error(err);

      alert(
        "Error eliminando repuesto"
      );

    } finally {
      setLoadingDelete(null);
    }
  };

  // =========================================================
  // 📊 EXPORTAR STOCK BAJO
  // =========================================================

  const exportLowStock = () => {
    const data =
      filteredRepuestos
        .filter(
          (r) =>
            (Number(r.stock) || 0) <=
            (Number(
              r.stockMinimo
            ) || 0)
        )
        .map((r) => ({
          Nombre:
            r.nombre || "",

          Código:
            r.codigo || "",

          Fabricante:
            r.fabricante || "",

          Modelo:
            r.modelo || "",

          Descripción:
            r.descripcion || "",

          Stock:
            Number(r.stock) || 0,

          "Stock mínimo":
            Number(
              r.stockMinimo
            ) || 0,

          Faltante: Math.max(
            0,
            (Number(
              r.stockMinimo
            ) || 0) -
              (Number(
                r.stock
              ) || 0)
          ),

          Estado:
            Number(r.stock) <= 0
              ? "Sin stock"
              : "Stock bajo",
        }));

    if (data.length === 0) {
      alert(
        "No hay repuestos con stock bajo"
      );
      return;
    }

    const ws =
      XLSX.utils.json_to_sheet(
        data
      );

    const wb =
      XLSX.utils.book_new();

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

  // =========================================================
  // 🎨 BADGE STOCK
  // =========================================================

  const renderStockBadge = (
    repuesto
  ) => {
    const stock =
      Number(repuesto.stock) || 0;

    const estado =
      getStockStatus(repuesto);

    if (estado === "sin-stock") {
      return (
        <span className="badge bg-danger">
          🔴 {stock}
        </span>
      );
    }

    if (estado === "bajo") {
      return (
        <span className="badge bg-warning text-dark">
          🟡 {stock}
        </span>
      );
    }

    return (
      <span className="badge bg-success">
        🟢 {stock}
      </span>
    );
  };

  // =========================================================
  // 📥 LEER ARCHIVO XLSX
  // =========================================================

  const handleImportFile = async (e) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const buffer =
        await file.arrayBuffer();

      const workbook =
        XLSX.read(buffer, {
          type: "array",
        });

      const movimientos = [];

      // =====================================================
      // RECORRER TODAS LAS HOJAS
      // =====================================================

      workbook.SheetNames.forEach(
        (sheetName) => {
          const sheet =
            workbook.Sheets[
              sheetName
            ];

          const rows =
            XLSX.utils.sheet_to_json(
              sheet,
              {
                header: 1,
                defval: "",
              }
            );

          let headerRow = -1;
          let codigoCol = -1;
          let cantidadCol = -1;

          // =================================================
          // BUSCAR CABECERAS
          // =================================================

          for (
            let i = 0;
            i < rows.length;
            i++
          ) {
            const row =
              rows[i];

            const codigoIndex =
              row.findIndex(
                (cell) =>
                  String(cell)
                    .trim()
                    .toUpperCase() ===
                  "CODIGO ARTICULO"
              );

            const cantidadIndex =
              row.findIndex(
                (cell) =>
                  String(cell)
                    .trim()
                    .toUpperCase() ===
                  "CANTIDAD"
              );

            if (
              codigoIndex !== -1 &&
              cantidadIndex !== -1
            ) {
              headerRow = i;
              codigoCol =
                codigoIndex;
              cantidadCol =
                cantidadIndex;

              break;
            }
          }

          // No se encontraron las cabeceras
          if (headerRow === -1) {
            return;
          }

          // =================================================
          // LEER DATOS
          // =================================================

          for (
            let i = headerRow + 1;
            i < rows.length;
            i++
          ) {
            const row =
              rows[i];

            const codigo =
              String(
                row[codigoCol] ??
                  ""
              ).trim();

            const cantidad =
              Number(
                row[cantidadCol]
              );

            if (
              !codigo ||
              !Number.isFinite(
                cantidad
              ) ||
              cantidad <= 0
            ) {
              continue;
            }

            movimientos.push({
              codigo,
              cantidad,
              hoja: sheetName,
              fila: i + 1,
            });
          }
        }
      );

      // =====================================================
      // VALIDAR
      // =====================================================

      if (
        movimientos.length === 0
      ) {
        alert(
          "No se encontraron datos debajo de las columnas CODIGO ARTICULO y CANTIDAD."
        );

        return;
      }

      // =====================================================
      // AGRUPAR CÓDIGOS REPETIDOS
      // =====================================================

      const agrupados = {};

      movimientos.forEach(
        ({
          codigo,
          cantidad,
        }) => {
          const key =
            codigo
              .trim()
              .toLowerCase();

          if (!agrupados[key]) {
            agrupados[key] = {
              codigo,
              cantidad: 0,
            };
          }

          agrupados[key].cantidad +=
            cantidad;
        }
      );

      const resumen =
        Object.values(
          agrupados
        );

      // =====================================================
      // CRUZAR CON REPUESTOS
      // =====================================================

      const preview =
        resumen.map(
          ({
            codigo,
            cantidad,
          }) => {
            const repuesto =
              repuestos.find(
                (r) =>
                  r.codigo
                    ?.trim()
                    .toLowerCase() ===
                  codigo
                    .trim()
                    .toLowerCase()
              );

            const stockActual =
              Number(
                repuesto?.stock
              ) || 0;

            return {
              codigo,
              cantidad,

              encontrado:
                !!repuesto,

              id:
                repuesto?._id ||
                null,

              nombre:
                repuesto?.nombre ||
                "",

              fabricante:
                repuesto?.fabricante ||
                "",

              modelo:
                repuesto?.modelo ||
                "",

              stockActual,

              stockNuevo:
                repuesto
                  ? stockActual +
                    cantidad
                  : null,
            };
          }
        );

      // =====================================================
      // GUARDAR PREVIEW
      // =====================================================

      setImportFileName(
        file.name
      );

      setImportPreview(
        preview
      );

    } catch (error) {
      console.error(error);

      alert(
        "No se pudo leer el archivo Excel."
      );

    } finally {
      // Permite volver a seleccionar
      // el mismo archivo
      e.target.value = "";
    }
  };

  // =========================================================
  // 📥 CONFIRMAR IMPORTACIÓN
  // =========================================================

  const confirmImport = async () => {
    if (
      !importPreview ||
      importPreview.length === 0
    ) {
      return;
    }

    if (!token) {
      alert("Sesión expirada");
      return;
    }

    const encontrados =
      importPreview.filter(
        (r) => r.encontrado
      );

    if (encontrados.length === 0) {
      alert(
        "No hay códigos válidos para importar."
      );

      return;
    }

    try {
      setImportLoading(true);

      const movimientos =
        encontrados.map(
          (r) => ({
            codigo: r.codigo,
            cantidad: r.cantidad,
          })
        );

      const res = await fetch(
        `${API_URL}/repuestos/importar-stock`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            movimientos,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message ||
            "Error importando stock"
        );
      }

      // Cerrar preview
      setImportPreview(null);

      setImportFileName("");

      // Actualizar lista
      onRefresh?.();

      alert(
        `Importación realizada correctamente.\n\n` +
        `Repuestos actualizados: ${encontrados.length}\n` +
        `Unidades incorporadas: ${encontrados.reduce(
          (total, r) =>
            total + r.cantidad,
          0
        )}`
      );

    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Ocurrió un error al importar el stock."
      );

    } finally {
      setImportLoading(false);
    }
  };

  // =========================================================
  // ❌ CANCELAR IMPORTACIÓN
  // =========================================================

  const cancelImport = () => {
    if (importLoading) {
      return;
    }

    setImportPreview(null);
    setImportFileName("");
  };

  // =========================================================
  // 📊 DATOS DEL PREVIEW
  // =========================================================

  const importStats =
    useMemo(() => {
      if (!importPreview) {
        return {
          total: 0,
          encontrados: 0,
          noEncontrados: 0,
          unidades: 0,
        };
      }

      const encontrados =
        importPreview.filter(
          (r) => r.encontrado
        );

      const noEncontrados =
        importPreview.filter(
          (r) => !r.encontrado
        );

      const unidades =
        encontrados.reduce(
          (total, r) =>
            total + r.cantidad,
          0
        );

      return {
        total:
          importPreview.length,

        encontrados:
          encontrados.length,

        noEncontrados:
          noEncontrados.length,

        unidades,
      };
    }, [importPreview]);

  // =========================================================
  // 📊 RANGO PAGINACIÓN
  // =========================================================

  const startRecord =
    filteredRepuestos.length === 0
      ? 0
      : (currentPage - 1) *
          itemsPerPage +
        1;

  const endRecord = Math.min(
    currentPage * itemsPerPage,
    filteredRepuestos.length
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div>

      {/* =====================================================
          📥 INPUT OCULTO PARA XLSX
      ====================================================== */}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={
          handleImportFile
        }
      />

      {/* =====================================================
          🔎 FILA 1 — BUSCADOR + ACCIONES
      ====================================================== */}

      <div className="d-flex gap-2 mb-2">

        <input
          type="text"
          className="form-control"
          placeholder="Buscar por nombre, código, fabricante o modelo..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        {/* NUEVO */}

        <button
          type="button"
          className="btn btn-success"
          style={{
            whiteSpace:
              "nowrap",
          }}
          onClick={() =>
            setSelectedRepuesto(
              {}
            )
          }
        >
          ➕ Nuevo
        </button>

        {/* IMPORTAR */}

        <button
          type="button"
          className="btn btn-info text-white"
          style={{
            whiteSpace:
              "nowrap",
          }}
          onClick={() =>
            fileInputRef.current?.click()
          }
        >
          📥 Importar
        </button>

        {/* EXPORTAR */}

        <button
          type="button"
          className="btn btn-warning"
          style={{
            whiteSpace:
              "nowrap",
          }}
          onClick={
            exportLowStock
          }
        >
          📊 Exportar
        </button>

      </div>

      {/* =====================================================
          🔽 FILA 2 — FILTROS
      ====================================================== */}

      <div className="d-flex gap-2 mb-3">

        {/* FABRICANTE */}

        <select
          className="form-select"
          style={{
            width: "220px",
          }}
          value={
            fabricanteFilter
          }
          onChange={(e) => {
            setFabricanteFilter(
              e.target.value
            );

            setModeloFilter("");
          }}
        >
          <option value="">
            Todos los fabricantes
          </option>

          {fabricantes.map(
            (fabricante) => (
              <option
                key={fabricante}
                value={fabricante}
              >
                {fabricante}
              </option>
            )
          )}
        </select>

        {/* MODELO */}

        <select
          className="form-select"
          style={{
            width: "220px",
          }}
          value={modeloFilter}
          onChange={(e) =>
            setModeloFilter(
              e.target.value
            )
          }
        >
          <option value="">
            Todos los modelos
          </option>

          {modelos.map(
            (modelo) => (
              <option
                key={modelo}
                value={modelo}
              >
                {modelo}
              </option>
            )
          )}
        </select>

        {/* STOCK */}

        <select
          className="form-select"
          style={{
            width: "180px",
          }}
          value={stockFilter}
          onChange={(e) =>
            setStockFilter(
              e.target.value
            )
          }
        >
          <option value="todos">
            Todos los stocks
          </option>

          <option value="normal">
            🟢 Stock normal
          </option>

          <option value="bajo">
            🟡 Stock bajo
          </option>

          <option value="sin-stock">
            🔴 Sin stock
          </option>
        </select>

      </div>

      {/* =====================================================
          📊 RESUMEN
      ====================================================== */}

      <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">

        <span className="text-muted small">
          📦{" "}
          <strong>
            {stockSummary.total}
          </strong>{" "}
          repuestos
        </span>

        <span className="text-success small">
          🟢{" "}
          <strong>
            {stockSummary.normal}
          </strong>{" "}
          normales
        </span>

        <span className="text-warning small">
          🟡{" "}
          <strong>
            {stockSummary.bajo}
          </strong>{" "}
          bajo stock
        </span>

        <span className="text-danger small">
          🔴{" "}
          <strong>
            {stockSummary.sinStock}
          </strong>{" "}
          sin stock
        </span>

      </div>

      {/* =====================================================
          📋 TABLA
      ====================================================== */}

      <div className="table-responsive">

        <table
          className="table table-bordered table-hover table-sm align-middle"
          style={{
            tableLayout:
              "fixed",
          }}
        >

          <thead className="table-dark">

            <tr>

              <th
                style={{
                  width: "22%",
                }}
                role="button"
                onClick={() =>
                  handleSort(
                    "nombre"
                  )
                }
              >
                Nombre
                {getSortIcon(
                  "nombre"
                )}
              </th>

              <th
                style={{
                  width: "14%",
                }}
                role="button"
                onClick={() =>
                  handleSort(
                    "codigo"
                  )
                }
              >
                Código
                {getSortIcon(
                  "codigo"
                )}
              </th>

              <th
                style={{
                  width: "20%",
                }}
                role="button"
                onClick={() =>
                  handleSort(
                    "fabricante"
                  )
                }
              >
                Fabricante
                {getSortIcon(
                  "fabricante"
                )}
              </th>

              <th
                style={{
                  width: "18%",
                }}
                role="button"
                onClick={() =>
                  handleSort(
                    "modelo"
                  )
                }
              >
                Modelo
                {getSortIcon(
                  "modelo"
                )}
              </th>

              <th
                style={{
                  width: "11%",
                }}
                className="text-center"
                role="button"
                onClick={() =>
                  handleSort(
                    "stock"
                  )
                }
              >
                Stock
                {getSortIcon(
                  "stock"
                )}
              </th>

              <th
                style={{
                  width: "15%",
                }}
                className="text-center"
              >
                Acciones
              </th>

            </tr>

          </thead>

          <tbody>

            {paginatedRepuestos.length ===
            0 ? (

              <tr>

                <td
                  colSpan="6"
                  className="text-center text-muted py-4"
                >
                  No se encontraron
                  resultados
                </td>

              </tr>

            ) : (

              paginatedRepuestos.map(
                (r) => (

                  <tr key={r._id}>

                    <td
                      style={{
                        whiteSpace:
                          "nowrap",
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                      }}
                      title={
                        r.nombre
                      }
                    >
                      <strong>
                        {r.nombre}
                      </strong>
                    </td>

                    <td
                      style={{
                        whiteSpace:
                          "nowrap",
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                      }}
                      title={
                        r.codigo ||
                        ""
                      }
                    >
                      {r.codigo ||
                        "—"}
                    </td>

                    <td
                      style={{
                        whiteSpace:
                          "nowrap",
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                      }}
                      title={
                        r.fabricante ||
                        ""
                      }
                    >
                      {r.fabricante ||
                        "—"}
                    </td>

                    <td
                      style={{
                        whiteSpace:
                          "nowrap",
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                      }}
                      title={
                        r.modelo ||
                        ""
                      }
                    >
                      {r.modelo ||
                        "—"}
                    </td>

                    <td className="text-center">
                      {renderStockBadge(
                        r
                      )}
                    </td>

                    <td className="text-center">

                      <button
                        type="button"
                        className="btn btn-sm btn-primary me-1"
                        title="Editar repuesto"
                        onClick={() =>
                          setSelectedRepuesto(
                            r
                          )
                        }
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        title="Eliminar repuesto"
                        disabled={
                          loadingDelete ===
                          r._id
                        }
                        onClick={() =>
                          handleDelete(
                            r._id
                          )
                        }
                      >
                        {loadingDelete ===
                        r._id
                          ? "..."
                          : "🗑️"}
                      </button>

                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>

      {/* =====================================================
          📄 PAGINACIÓN
      ====================================================== */}

      <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-3">

        <div className="d-flex align-items-center gap-2">

          <span className="small">
            Mostrar:
          </span>

          <select
            className="form-select form-select-sm"
            style={{
              width: "75px",
            }}
            value={itemsPerPage}
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

        <div className="text-muted small">

          Mostrando{" "}

          <strong>
            {startRecord}
          </strong>

          –

          <strong>
            {endRecord}
          </strong>

          {" "}de{" "}

          <strong>
            {
              filteredRepuestos.length
            }
          </strong>

        </div>

        <div className="d-flex align-items-center gap-2">

          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            disabled={
              currentPage === 1
            }
            onClick={() =>
              setCurrentPage(
                (p) => p - 1
              )
            }
          >
            ⬅
          </button>

          <span className="small">

            Página{" "}

            <b>
              {currentPage}
            </b>

            {" "}de{" "}

            <b>
              {totalPages || 1}
            </b>

          </span>

          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            disabled={
              totalPages === 0 ||
              currentPage ===
                totalPages
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

      {/* =====================================================
          🪟 MODAL EDITAR / NUEVO
      ====================================================== */}

      {selectedRepuesto !== null && (

        <Modal
          onClose={() =>
            setSelectedRepuesto(
              null
            )
          }
        >

          <RepuestoForm
            repuesto={
              selectedRepuesto._id
                ? selectedRepuesto
                : null
            }

            onClose={() =>
              setSelectedRepuesto(
                null
              )
            }

            onCreated={() => {
              setSelectedRepuesto(
                null
              );

              onRefresh?.();
            }}
          />

        </Modal>

      )}

      {/* =====================================================
          📥 MODAL PREVISUALIZACIÓN IMPORTACIÓN
      ====================================================== */}

      {importPreview !== null && (
        <Modal onClose={cancelImport}>
          <div>

            {/* CABECERA */}
            <div className="mb-2">
              <h5 className="mb-1">
                📥 Importar stock
              </h5>

              <div className="text-muted small">
                {importFileName}
              </div>
            </div>

            {/* RESUMEN */}
            <div className="d-flex gap-2 flex-wrap mb-2">

              <span className="badge bg-primary">
                📦 {importStats.total}
              </span>

              <span className="badge bg-success">
                ✅ {importStats.encontrados}
              </span>

              {importStats.noEncontrados > 0 && (
                <span className="badge bg-danger">
                  ⚠️ {importStats.noEncontrados}
                </span>
              )}

              <span className="badge bg-info text-dark">
                ➕ {importStats.unidades}
              </span>

            </div>

            {/* TABLA */}
            <div
              className="table-responsive border rounded"
              style={{
                maxHeight: "280px",
                overflowY: "auto",
              }}
            >
              <table className="table table-sm table-bordered table-hover align-middle mb-0">

                <thead
                  className="table-dark"
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  <tr>
                    <th>Código</th>
                    <th>Repuesto</th>
                    <th className="text-center">
                      Cant.
                    </th>
                    <th className="text-center">
                      Actual
                    </th>
                    <th className="text-center">
                      Nuevo
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {importPreview.map(
                    (r, index) => (
                      <tr
                        key={`${r.codigo}-${index}`}
                        className={
                          !r.encontrado
                            ? "table-danger"
                            : ""
                        }
                      >

                        <td>
                          <strong>
                            {r.codigo}
                          </strong>
                        </td>

                        <td>
                          {r.encontrado
                            ? r.nombre
                            : "No encontrado"}
                        </td>

                        <td className="text-center">
                          <span className="badge bg-info text-dark">
                            +{r.cantidad}
                          </span>
                        </td>

                        <td className="text-center">
                          {r.encontrado
                            ? r.stockActual
                            : "—"}
                        </td>

                        <td className="text-center">
                          {r.encontrado ? (
                            <strong className="text-success">
                              {r.stockNuevo}
                            </strong>
                          ) : (
                            <span className="text-danger">
                              —
                            </span>
                          )}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>
            </div>

            {/* AVISO */}
            {importStats.noEncontrados > 0 && (
              <div className="alert alert-warning py-2 px-3 mt-2 mb-2 small">

                <strong>
                  ⚠️ Atención:
                </strong>{" "}

                {importStats.noEncontrados}{" "}
                códigos no existen en la base
                de datos y serán ignorados.

              </div>
            )}

            {/* BOTONES */}
            <div className="d-flex justify-content-end gap-2 mt-2">

              <button
                type="button"
                className="btn btn-secondary"
                disabled={importLoading}
                onClick={cancelImport}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn btn-success"
                disabled={
                  importLoading ||
                  importStats.encontrados === 0
                }
                onClick={confirmImport}
              >
                {importLoading
                  ? "Importando..."
                  : `✅ Confirmar (${importStats.encontrados})`}
              </button>

            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}