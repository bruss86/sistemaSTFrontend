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

  const [selectedRepuesto, setSelectedRepuesto] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(null);

  // 🔎 BÚSQUEDA
  const [search, setSearch] = useState("");

  // 🏭 FILTROS
  const [fabricanteFilter, setFabricanteFilter] = useState("");
  const [modeloFilter, setModeloFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("todos");

  // 📄 PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 🔀 ORDEN
  const [sortField, setSortField] = useState("nombre");
  const [sortDirection, setSortDirection] = useState("asc");

  // 📥 IMPORTACIÓN
  const [importPreview, setImportPreview] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importFileName, setImportFileName] = useState("");

  const fileInputRef = useRef(null);
  const token = localStorage.getItem("token");

  // =========================================================
  // 📊 ESTADO DEL STOCK
  // =========================================================

  const getStockStatus = (repuesto) => {
    const stock = Number(repuesto.stock) || 0;
    const minimo = Number(repuesto.stockMinimo) || 0;

    if (stock <= 0) return "sin-stock";
    if (stock <= minimo) return "bajo";
    return "normal";
  };

  // =========================================================
  // 📊 RESUMEN STOCK (KPIs)
  // =========================================================

  const stockSummary = useMemo(() => {
    let normal = 0;
    let bajo = 0;
    let sinStock = 0;

    repuestos.forEach((r) => {
      const estado = getStockStatus(r);
      if (estado === "normal") normal++;
      if (estado === "bajo") bajo++;
      if (estado === "sin-stock") sinStock++;
    });

    return {
      total: repuestos.length,
      normal,
      bajo,
      sinStock,
    };
  }, [repuestos]);

  // =========================================================
  // 🏭 FABRICANTES Y MODELOS
  // =========================================================

  const fabricantes = useMemo(() => {
    return [
      ...new Set(
        repuestos
          .map((r) => r.fabricante?.trim())
          .filter(Boolean)
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [repuestos]);

  const modelos = useMemo(() => {
    const modelosFiltrados = repuestos
      .filter((r) => {
        if (!fabricanteFilter) return true;
        return r.fabricante?.trim() === fabricanteFilter;
      })
      .map((r) => r.modelo?.trim())
      .filter(Boolean);

    return [...new Set(modelosFiltrados)].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [repuestos, fabricanteFilter]);

  // =========================================================
  // 🔎 FILTRO + ORDEN
  // =========================================================

  const filteredRepuestos = useMemo(() => {
    const text = search.toLowerCase().trim();

    let data = repuestos.filter((r) => {
      if (text) {
        const nombre = r.nombre?.toLowerCase() || "";
        const codigo = r.codigo?.toLowerCase() || "";
        const fabricante = r.fabricante?.toLowerCase() || "";
        const modelo = r.modelo?.toLowerCase() || "";
        const descripcion = r.descripcion?.toLowerCase() || "";

        const coincide =
          nombre.includes(text) ||
          codigo.includes(text) ||
          fabricante.includes(text) ||
          modelo.includes(text) ||
          descripcion.includes(text);

        if (!coincide) return false;
      }

      if (fabricanteFilter && r.fabricante?.trim() !== fabricanteFilter) {
        return false;
      }

      if (modeloFilter && r.modelo?.trim() !== modeloFilter) {
        return false;
      }

      if (stockFilter !== "todos" && getStockStatus(r) !== stockFilter) {
        return false;
      }

      return true;
    });

    data.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "stock" || sortField === "stockMinimo") {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
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

  const totalPages = Math.ceil(filteredRepuestos.length / itemsPerPage);

  const paginatedRepuestos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRepuestos.slice(start, start + itemsPerPage);
  }, [filteredRepuestos, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, fabricanteFilter, modeloFilter, stockFilter, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // =========================================================
  // 🔀 ORDENAR
  // =========================================================

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  // =========================================================
  // 🗑️ ELIMINAR
  // =========================================================

  const handleDelete = async (id) => {
    if (!token) {
      alert("Sesión expirada");
      return;
    }

    if (!window.confirm("¿Está seguro de eliminar este repuesto?")) {
      return;
    }

    try {
      setLoadingDelete(id);

      const res = await fetch(`${API_URL}/repuestos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Error eliminando repuesto");
      }

      onRefresh?.();
    } catch (err) {
      console.error(err);
      alert("Error eliminando repuesto");
    } finally {
      setLoadingDelete(null);
    }
  };

  // =========================================================
  // 📊 EXPORTAR STOCK BAJO
  // =========================================================

  const exportLowStock = () => {
    const data = filteredRepuestos
      .filter(
        (r) => (Number(r.stock) || 0) <= (Number(r.stockMinimo) || 0)
      )
      .map((r) => ({
        Nombre: r.nombre || "",
        Código: r.codigo || "",
        Fabricante: r.fabricante || "",
        Modelo: r.modelo || "",
        Descripción: r.descripcion || "",
        Stock: Number(r.stock) || 0,
        "Stock mínimo": Number(r.stockMinimo) || 0,
        Faltante: Math.max(
          0,
          (Number(r.stockMinimo) || 0) - (Number(r.stock) || 0)
        ),
        Estado: Number(r.stock) <= 0 ? "Sin stock" : "Stock bajo",
      }));

    if (data.length === 0) {
      alert("No hay repuestos con stock bajo");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Bajo");
    XLSX.writeFile(wb, "repuestos_stock_bajo.xlsx");
  };

  // =========================================================
  // 🎨 BADGE STOCK
  // =========================================================

  const renderStockBadge = (repuesto) => {
    const stock = Number(repuesto.stock) || 0;
    const estado = getStockStatus(repuesto);

    if (estado === "sin-stock") {
      return (
        <span className="badge rounded-pill bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 fw-bold">
          🔴 {stock}
        </span>
      );
    }

    if (estado === "bajo") {
      return (
        <span className="badge rounded-pill bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 px-2 py-1 fw-bold">
          🟡 {stock}
        </span>
      );
    }

    return (
      <span className="badge rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 fw-bold">
        🟢 {stock}
      </span>
    );
  };

  // =========================================================
  // 📥 LEER ARCHIVO XLSX
  // =========================================================

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const movimientos = [];

      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        });

        let headerRow = -1;
        let codigoCol = -1;
        let cantidadCol = -1;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const codigoIndex = row.findIndex(
            (cell) =>
              String(cell).trim().toUpperCase() === "CODIGO ARTICULO"
          );
          const cantidadIndex = row.findIndex(
            (cell) => String(cell).trim().toUpperCase() === "CANTIDAD"
          );

          if (codigoIndex !== -1 && cantidadIndex !== -1) {
            headerRow = i;
            codigoCol = codigoIndex;
            cantidadCol = cantidadIndex;
            break;
          }
        }

        if (headerRow === -1) return;

        for (let i = headerRow + 1; i < rows.length; i++) {
          const row = rows[i];
          const codigo = String(row[codigoCol] ?? "").trim();
          const cantidad = Number(row[cantidadCol]);

          if (!codigo || !Number.isFinite(cantidad) || cantidad <= 0) {
            continue;
          }

          movimientos.push({
            codigo,
            cantidad,
            hoja: sheetName,
            fila: i + 1,
          });
        }
      });

      if (movimientos.length === 0) {
        alert(
          "No se encontraron datos válidos debajo de las columnas CODIGO ARTICULO y CANTIDAD."
        );
        return;
      }

      const agrupados = {};
      movimientos.forEach(({ codigo, cantidad }) => {
        const key = codigo.trim().toLowerCase();
        if (!agrupados[key]) {
          agrupados[key] = { codigo, cantidad: 0 };
        }
        agrupados[key].cantidad += cantidad;
      });

      const resumen = Object.values(agrupados);

      const preview = resumen.map(({ codigo, cantidad }) => {
        const repuesto = repuestos.find(
          (r) =>
            r.codigo?.trim().toLowerCase() === codigo.trim().toLowerCase()
        );

        const stockActual = Number(repuesto?.stock) || 0;

        return {
          codigo,
          cantidad,
          encontrado: !!repuesto,
          id: repuesto?._id || null,
          nombre: repuesto?.nombre || "",
          fabricante: repuesto?.fabricante || "",
          modelo: repuesto?.modelo || "",
          stockActual,
          stockNuevo: repuesto ? stockActual + cantidad : null,
        };
      });

      setImportFileName(file.name);
      setImportPreview(preview);
    } catch (error) {
      console.error(error);
      alert("No se pudo leer el archivo Excel.");
    } finally {
      e.target.value = "";
    }
  };

  // =========================================================
  // 📥 CONFIRMAR IMPORTACIÓN
  // =========================================================

  const confirmImport = async () => {
    if (!importPreview || importPreview.length === 0) return;

    if (!token) {
      alert("Sesión expirada");
      return;
    }

    const encontrados = importPreview.filter((r) => r.encontrado);

    if (encontrados.length === 0) {
      alert("No hay códigos válidos para importar.");
      return;
    }

    try {
      setImportLoading(true);

      const movimientos = encontrados.map((r) => ({
        codigo: r.codigo,
        cantidad: r.cantidad,
      }));

      const res = await fetch(`${API_URL}/repuestos/importar-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ movimientos }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Error importando stock");
      }

      setImportPreview(null);
      setImportFileName("");
      onRefresh?.();

      alert(
        `Importación realizada correctamente.\n\n` +
          `Repuestos actualizados: ${encontrados.length}\n` +
          `Unidades incorporadas: ${encontrados.reduce(
            (total, r) => total + r.cantidad,
            0
          )}`
      );
    } catch (error) {
      console.error(error);
      alert(error.message || "Ocurrió un error al importar el stock.");
    } finally {
      setImportLoading(false);
    }
  };

  const cancelImport = () => {
    if (importLoading) return;
    setImportPreview(null);
    setImportFileName("");
  };

  // =========================================================
  // 📊 RANGO PAGINACIÓN
  // =========================================================

  const startRecord =
    filteredRepuestos.length === 0
      ? 0
      : (currentPage - 1) * itemsPerPage + 1;

  const endRecord = Math.min(
    currentPage * itemsPerPage,
    filteredRepuestos.length
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="container-fluid p-0">
      {/* INPUT OCULTO PARA XLSX */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={handleImportFile}
      />

      {/* TARJETAS DE RESUMEN (KPIS) CLICKEABLES */}
      <div className="row g-2 mb-3">
        <div className="col">
          <div
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 kpi-card ${
              stockFilter === "todos" ? "border-start border-4 border-primary" : ""
            }`}
            onClick={() => setStockFilter("todos")}
            style={{ cursor: "pointer" }}
            title="Ver todos"
          >
            <span className="text-muted small fw-semibold">Total Repuestos</span>
            <span className="fs-4 fw-bold text-dark">{stockSummary.total}</span>
          </div>
        </div>

        <div className="col">
          <div
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 kpi-card ${
              stockFilter === "normal" ? "border-start border-4 border-success" : ""
            }`}
            onClick={() => setStockFilter("normal")}
            style={{ cursor: "pointer" }}
            title="Filtrar Normales"
          >
            <span className="text-success small fw-semibold">Stock Normal</span>
            <span className="fs-4 fw-bold text-success">{stockSummary.normal}</span>
          </div>
        </div>

        <div className="col">
          <div
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 kpi-card ${
              stockFilter === "bajo" ? "border-start border-4 border-warning" : ""
            }`}
            onClick={() => setStockFilter("bajo")}
            style={{ cursor: "pointer" }}
            title="Filtrar Stock Bajo"
          >
            <span className="text-warning small fw-semibold">Stock Bajo</span>
            <span className="fs-4 fw-bold text-warning">{stockSummary.bajo}</span>
          </div>
        </div>

        <div className="col">
          <div
            className={`card border-0 shadow-sm p-3 bg-white rounded-3 kpi-card ${
              stockFilter === "sin-stock" ? "border-start border-4 border-danger" : ""
            }`}
            onClick={() => setStockFilter("sin-stock")}
            style={{ cursor: "pointer" }}
            title="Filtrar Sin Stock"
          >
            <span className="text-danger small fw-semibold">Sin Stock</span>
            <span className="fs-4 fw-bold text-danger">{stockSummary.sinStock}</span>
          </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="card p-3 shadow-sm border-0 rounded-3">
        {/* CABECERA Y BUSCADOR */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="m-0 text-dark fw-bold">
            ⚙️ Inventario de Repuestos{" "}
            <span className="text-muted fs-6">({filteredRepuestos.length})</span>
          </h5>

          <div className="d-flex gap-2 flex-grow-1 justify-content-end flex-wrap">
            <input
              type="text"
              className="form-control"
              placeholder="🔎 Buscar por nombre, código, fabricante o modelo..."
              style={{ maxWidth: 320, minWidth: 200 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              type="button"
              className="btn btn-outline-info d-flex align-items-center gap-1 text-nowrap"
              onClick={() => fileInputRef.current?.click()}
              title="Importar desde archivo XLSX"
            >
              <i className="bi bi-box-arrow-in-down"></i> Importar
            </button>

            <button
              type="button"
              className="btn btn-outline-warning text-dark d-flex align-items-center gap-1 text-nowrap"
              onClick={exportLowStock}
              title="Exportar stock bajo a XLSX"
            >
              <i className="bi bi-box-arrow-up"></i> Exportar Bajo Stock
            </button>

            <button
              type="button"
              className="btn btn-success d-flex align-items-center gap-1 text-nowrap px-3"
              onClick={() => setSelectedRepuesto({})}
              title="Nuevo repuesto"
            >
              <i className="bi bi-plus-circle"></i> Nuevo
            </button>
          </div>
        </div>

        {/* FILTROS SECUNDARIOS */}
        <div className="d-flex gap-2 mb-3 flex-wrap">
          <select
            className="form-select"
            style={{ maxWidth: 220 }}
            value={fabricanteFilter}
            onChange={(e) => {
              setFabricanteFilter(e.target.value);
              setModeloFilter("");
            }}
          >
            <option value="">Todos los fabricantes</option>
            {fabricantes.map((fabricante) => (
              <option key={fabricante} value={fabricante}>
                {fabricante}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ maxWidth: 220 }}
            value={modeloFilter}
            onChange={(e) => setModeloFilter(e.target.value)}
          >
            <option value="">Todos los modelos</option>
            {modelos.map((modelo) => (
              <option key={modelo} value={modelo}>
                {modelo}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ maxWidth: 200 }}
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="todos">Todos los stocks</option>
            <option value="normal">🟢 Stock normal</option>
            <option value="bajo">🟡 Stock bajo</option>
            <option value="sin-stock">🔴 Sin stock</option>
          </select>
        </div>

        {/* TABLA DE REPUESTOS */}
        <div className="table-responsive border rounded-3 shadow-sm">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-dark text-nowrap">
              <tr>
                <th
                  style={{ width: "25%" }}
                  className="py-3"
                  role="button"
                  onClick={() => handleSort("nombre")}
                >
                  Nombre {getSortIcon("nombre")}
                </th>
                <th
                  style={{ width: "15%" }}
                  className="py-3"
                  role="button"
                  onClick={() => handleSort("codigo")}
                >
                  Código {getSortIcon("codigo")}
                </th>
                <th
                  style={{ width: "20%" }}
                  className="py-3"
                  role="button"
                  onClick={() => handleSort("fabricante")}
                >
                  Fabricante {getSortIcon("fabricante")}
                </th>
                <th
                  style={{ width: "18%" }}
                  className="py-3"
                  role="button"
                  onClick={() => handleSort("modelo")}
                >
                  Modelo {getSortIcon("modelo")}
                </th>
                <th
                  style={{ width: "10%" }}
                  className="text-center py-3"
                  role="button"
                  onClick={() => handleSort("stock")}
                >
                  Stock {getSortIcon("stock")}
                </th>
                <th style={{ width: "12%" }} className="text-center py-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRepuestos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-5">
                    <i className="bi bi-box-seam fs-1 d-block mb-2 opacity-50"></i>
                    No se encontraron repuestos con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedRepuestos.map((r) => (
                  <tr key={r._id}>
                    <td className="fw-semibold text-dark text-truncate" style={{ maxWidth: 220 }} title={r.nombre}>
                      {r.nombre}
                    </td>
                    <td className="text-muted text-truncate" style={{ maxWidth: 120 }} title={r.codigo}>
                      <code>{r.codigo || "—"}</code>
                    </td>
                    <td className="text-truncate" style={{ maxWidth: 180 }} title={r.fabricante}>
                      {r.fabricante || "—"}
                    </td>
                    <td className="text-truncate" style={{ maxWidth: 160 }} title={r.modelo}>
                      {r.modelo || "—"}
                    </td>
                    <td className="text-center">{renderStockBadge(r)}</td>
                    <td className="text-center text-nowrap">
                      <div className="d-flex justify-content-center gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-light border text-primary shadow-sm"
                          title="Editar repuesto"
                          onClick={() => setSelectedRepuesto(r)}
                        >
                          <i className="bi bi-pencil-fill"></i>
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-light border text-danger shadow-sm"
                          title="Eliminar repuesto"
                          disabled={loadingDelete === r._id}
                          onClick={() => handleDelete(r._id)}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top flex-wrap gap-2">
            <span className="text-muted small">
              Mostrando <b>{startRecord}</b> - <b>{endRecord}</b> de <b>{filteredRepuestos.length}</b> repuestos
            </span>

            <div className="d-flex gap-1 align-items-center">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <i className="bi bi-chevron-left"></i> Anterior
              </button>

              <span className="mx-2 small fw-bold">
                Página {currentPage} de {totalPages}
              </span>

              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Siguiente <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FORMULARIO MODAL EDICIÓN/CREACIÓN */}
      {selectedRepuesto && (
        <Modal onClose={() => setSelectedRepuesto(null)}>
          <RepuestoForm
            repuesto={selectedRepuesto}
            onSaved={() => {
              setSelectedRepuesto(null);
              onRefresh?.();
            }}
            onClose={() => setSelectedRepuesto(null)}
          />
        </Modal>
      )}

      {/* MODAL PREVIEW DE IMPORTACIÓN DESDE EXCEL */}
      {importPreview && (
        <Modal onClose={cancelImport}>
          <div className="p-3">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-file-earmark-excel text-success me-2"></i>
              Previsualizar Importación de Stock ({importFileName})
            </h5>

            <div className="alert alert-info py-2 small mb-3">
              Se encontraron <b>{importPreview.length}</b> códigos en el archivo Excel.
            </div>

            <div className="table-responsive border rounded mb-3" style={{ maxHeight: "300px" }}>
              <table className="table table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th className="text-center">Cant. Importar</th>
                    <th className="text-center">Stock Actual</th>
                    <th className="text-center">Nuevo Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.map((item, idx) => (
                    <tr key={idx} className={!item.encontrado ? "table-warning" : ""}>
                      <td><code>{item.codigo}</code></td>
                      <td>{item.encontrado ? item.nombre : <span className="text-danger small">No encontrado en BD</span>}</td>
                      <td className="text-center fw-bold text-primary">+{item.cantidad}</td>
                      <td className="text-center">{item.encontrado ? item.stockActual : "—"}</td>
                      <td className="text-center fw-bold text-success">{item.encontrado ? item.stockNuevo : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary btn-sm px-3" onClick={cancelImport} disabled={importLoading}>
                Cancelar
              </button>
              <button className="btn btn-success btn-sm px-4" onClick={confirmImport} disabled={importLoading}>
                {importLoading ? "Importando..." : "Confirmar Importación"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}