import { useEffect, useState } from "react";
import Modal from "./Modal";
import MasterModal from "./MasterModal";

const API_URL = import.meta.env.VITE_API_URL;

export default function MasterList({ showToast }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nombresHojas, setNombresHojas] = useState([]);
  const [contenidoHojas, setContenidoHojas] = useState({});
  const [pestanaActiva, setPestanaActiva] = useState("");

  // Estados de Buscador y Paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Estado para el Modal de Análisis
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const token = localStorage.getItem("token");

  const fetchMasterList = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}/instrumentos/visor-excel`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Error al obtener los datos de Google Sheets");
      }

      const data = await res.json();

      const hojas = data.nombresHojas || data.nombres || [];
      const contenido = data.contenido || data.data || {};

      setNombresHojas(hojas);
      setContenidoHojas(contenido);
      
      if (hojas.length > 0) {
        setPestanaActiva(hojas[0]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo cargar el visor de Excel.");
      showToast?.("Error al cargar las pestañas de Google Sheets", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterList();
  }, [token]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pestanaActiva, searchTerm]);

  const filasActuales = contenidoHojas[pestanaActiva] || [];
  const cabeceraCompleta = filasActuales.length > 0 ? filasActuales[0] : [];
  const cuerpoCompleto = filasActuales.length > 1 ? filasActuales.slice(1) : [];

  // Primeras 7 columnas (A a la G)
  const cabecera = cabeceraCompleta.slice(0, 7);

  const cuerpoFiltrado = cuerpoCompleto.filter((fila) => {
    if (!searchTerm.trim()) return true;
    return cabecera.some((_, colIndex) => {
      const valorCelda = fila[colIndex];
      return valorCelda && String(valorCelda).toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  const totalPages = Math.ceil(cuerpoFiltrado.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const cuerpoPaginado = cuerpoFiltrado.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="container-fluid p-3">
      {/* TÍTULO Y BOTÓN DE ACTUALIZAR */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold text-dark mb-1">📊 Master List - Google Sheets</h4>
          <p className="text-muted small mb-0">Visualizador en tiempo real con análisis de BD</p>
        </div>
        <button
          className="btn btn-outline-primary btn-sm px-3 shadow-sm"
          onClick={fetchMasterList}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-1"></i> Actualizar
        </button>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 small shadow-sm mb-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-1"></i> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-2" role="status" />
          <p className="text-muted small">Cargando datos desde Google Sheets...</p>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
          <div className="card-header bg-light border-bottom px-3 pt-3 pb-0">
            <ul className="nav nav-tabs card-header-tabs">
              {nombresHojas.map((nombre) => (
                <li className="nav-item" key={nombre}>
                  <button
                    type="button"
                    className="nav-link fw-semibold px-3 py-2 active text-primary bg-white border-bottom-0"
                    disabled
                  >
                    <i className="bi bi-file-earmark-spreadsheet me-1"></i>
                    {nombre}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-white border-bottom">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="btn btn-outline-secondary border" type="button" onClick={() => setSearchTerm("")}>
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover table-striped table-sm align-middle mb-0" style={{ fontSize: "0.8rem" }}>
                <thead className="table-dark">
                  <tr>
                    {cabecera.length > 0 ? (
                      cabecera.map((col, idx) => (
                        <th key={idx} className="py-2 px-2 text-truncate" style={{ maxWidth: "150px" }} title={col || `Col ${idx + 1}`}>
                          {col || `Col ${idx + 1}`}
                        </th>
                      ))
                    ) : (
                      <th className="py-2 px-2">Sin datos</th>
                    )}
                    <th className="py-2 px-2 text-center" style={{ width: "90px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cuerpoPaginado.length > 0 ? (
                    cuerpoPaginado.map((fila, rowIndex) => (
                      <tr key={rowIndex}>
                        {cabecera.map((_, colIndex) => {
                          const valorCelda = fila[colIndex] !== undefined && fila[colIndex] !== null ? String(fila[colIndex]) : "";
                          return (
                            <td key={colIndex} className="py-2 px-2 text-truncate" style={{ maxWidth: "150px" }} title={valorCelda}>
                              {valorCelda}
                            </td>
                          );
                        })}
                        <td className="py-2 px-2 text-center">
                          <button
                            className="btn btn-xs btn-outline-primary px-2 py-0 shadow-sm"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => {
                              setSelectedRowData(fila);
                              setShowModal(true);
                            }}
                          >
                            <i className="bi bi-search me-1"></i> Analizar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={cabecera.length + 1} className="text-center py-4 text-muted">
                        {searchTerm ? "No se encontraron resultados para tu búsqueda." : "Esta pestaña está vacía o no tiene registros."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOOTER Y PAGINACIÓN */}
          <div className="card-footer bg-white py-2 px-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
            <span className="text-muted small">
              Mostrando <strong>{cuerpoPaginado.length > 0 ? indexOfFirstItem + 1 : 0}</strong> a{" "}
              <strong>{Math.min(indexOfLastItem, cuerpoFiltrado.length)}</strong> de{" "}
              <strong>{cuerpoFiltrado.length}</strong> registros filtrados
            </span>

            {totalPages > 1 && (
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}>
                      Anterior
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                      <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}>
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE ANÁLISIS */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <MasterModal
            rowData={selectedRowData}
            headers={cabecera}
            onClose={() => setShowModal(false)}
            showToast={showToast}
          />
        </Modal>
      )}
    </div>
  );
}