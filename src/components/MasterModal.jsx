import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function MasterModal({ rowData, headers, onClose, showToast }) {
  const [form, setForm] = useState({});
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [clienteAsociado, setClienteAsociado] = useState(null);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (rowData && headers) {
      const initialValues = {};
      headers.forEach((header, index) => {
        initialValues[header || `Col_${index}`] = rowData[index] || "";
      });
      setForm(initialValues);

      const possiblePartida = rowData[0] || rowData[1];
      if (possiblePartida) {
        buscarInstrumentoYClienteEnBD(possiblePartida);
      }
    }
  }, [rowData, headers]);

  const buscarInstrumentoYClienteEnBD = async (termino) => {
    try {
      setLoadingMatch(true);
      
      const [resIns, resCli] = await Promise.all([
        fetch(`${API_URL}/instrumentos`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/clientes`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!resIns.ok || !resCli.ok) throw new Error("Error al consultar datos en la BD");

      const instrumentos = await resIns.json();
      const clientes = await resCli.json();

      const terminoClean = String(termino).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

      const encontrado = instrumentos.find((i) => {
        const serieClean = String(i.numeroSerie || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const descClean = String(i.descripcion || "").toLowerCase();
        
        return (serieClean && terminoClean && (serieClean.includes(terminoClean) || terminoClean.includes(serieClean))) ||
               descClean.includes(String(termino).toLowerCase());
      });

      setMatchResult(encontrado || null);

      if (encontrado && encontrado.cliente) {
        const clienteId = typeof encontrado.cliente === "object" ? encontrado.cliente._id : encontrado.cliente;
        const cliMatch = clientes.find((c) => c._id === clienteId || c.codigo === clienteId);
        setClienteAsociado(cliMatch || null);
      } else {
        setClienteAsociado(null);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatch(false);
    }
  };

  const handleChange = (header, value) => {
    setForm((prev) => ({ ...prev, [header]: value }));
  };

  const normalizarTexto = (txt) => {
    return String(txt || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  };

  const isFieldMatching = (header, value, isPrimaryField) => {
    if (!matchResult) return true;

    const cleanHeader = normalizarTexto(header).replace(/[^a-z0-9]/g, "");
    
    let dbValue = "";
    let isClientCodeField = false;
    let isClientNameField = false;

    if (cleanHeader.includes("codigosit") || cleanHeader === "codigosit" || (cleanHeader.includes("codigo") && !cleanHeader.includes("cliente") && !cleanHeader.includes("sit"))) {
      dbValue = matchResult.codigo || "";
    } else if (cleanHeader.includes("codigocliente") || (cleanHeader.includes("codigo") && cleanHeader.includes("cliente"))) {
      isClientCodeField = true;
      dbValue = clienteAsociado ? (clienteAsociado.codigoCliente || clienteAsociado._id) : "";
    } else if (cleanHeader.includes("nombre") || cleanHeader.includes("cliente") || cleanHeader.includes("hospital") || cleanHeader.includes("institucion")) {
      isClientNameField = true;
      dbValue = clienteAsociado ? clienteAsociado.nombre : "";
    } else if (cleanHeader.includes("modelo")) {
      dbValue = matchResult.modelo;
    } else if (cleanHeader.includes("marca")) {
      dbValue = matchResult.marca;
    }

    if (!dbValue && !isClientCodeField && !isClientNameField) return true;
    if (isPrimaryField) return true;

    const valNorm = normalizarTexto(value);
    const dbNorm = normalizarTexto(dbValue);

    if (isClientNameField || isClientCodeField) {
      if (!clienteAsociado) return true;
      return valNorm === dbNorm || valNorm.includes(dbNorm) || dbNorm.includes(valNorm);
    }

    const valClean = valNorm.replace(/[^a-z0-9]/g, "");
    const dbClean = dbNorm.replace(/[^a-z0-9]/g, "");

    return valClean === dbClean || valClean.includes(dbClean) || dbClean.includes(valClean);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast?.("Valores analizados correctamente", "success");
      onClose();
    }, 500);
  };

  return (
    <div className="p-2" style={{ fontSize: "0.8rem" }}>
      {/* Cabecera más compacta */}
      <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1">
        <h6 className="fw-bold text-dark mb-0 fs-6">
          <i className="bi bi-search me-1"></i> Analizar Registro y Validación
        </h6>
        <button type="button" className="btn-close btn-sm" onClick={onClose}></button>
      </div>

      <form onSubmit={handleSave}>
        <p className="text-muted small mb-2" style={{ fontSize: "0.75rem" }}>
          Los campos que no coincidan con la Base de Datos se marcarán en rojo.
        </p>

        {/* Zona de inputs con altura máxima reducida y scroll limpio */}
        <div className="row g-1.5 mb-2" style={{ maxHeight: "240px", overflowY: "auto", paddingRight: "4px" }}>
          {headers.map((header, idx) => {
            const fieldKey = header || `Col_${idx}`;
            const currentValue = form[fieldKey] || "";
            const isPrimary = idx === 0 || idx === 1;
            const matches = matchResult ? isFieldMatching(header, currentValue, isPrimary) : true;

            const cleanHeaderForMsg = normalizarTexto(header);
            const esCodigo = cleanHeaderForMsg.includes("codigo");

            return (
              <div className="col-md-6" key={idx}>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light text-muted" style={{ fontSize: "0.7rem", width: "35%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={header || `Col ${idx + 1}`}>
                    {header || `Col ${idx + 1}`}
                  </span>
                  <input
                    type="text"
                    className={`form-control form-control-sm ${matchResult && !matches ? "is-invalid border-danger text-danger fw-bold" : ""}`}
                    style={{ fontSize: "0.8rem", height: "31px" }}
                    value={currentValue}
                    onChange={(e) => handleChange(fieldKey, e.target.value)}
                  />
                  {matchResult && !matches && (
                    <div className="invalid-feedback" style={{ fontSize: "0.65rem" }}>
                      {cleanHeaderForMsg.includes("cliente") || cleanHeaderForMsg.includes("sit")
                        ? `BD: ${esCodigo ? (clienteAsociado?.codigo || "Sin código") : (clienteAsociado?.nombre || "Sin cliente")}`
                        : `BD: ${matchResult.numeroSerie || "N/A"}`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* SECCIÓN DE ESTADO EN BASE DE DATOS MÁS COMPACTA */}
        <div className="card bg-light border-0 shadow-sm mb-2 rounded-2">
          <div className="card-body p-1.5">
            <h6 className="fw-bold text-secondary mb-1" style={{ fontSize: "0.75rem" }}>
              <i className="bi bi-hdd-stack me-1"></i> Estado en Base de Datos (MongoDB)
            </h6>

            {loadingMatch ? (
              <div className="text-center py-1">
                <div className="spinner-border spinner-border-sm text-primary me-1" role="status" />
                <span className="small text-muted" style={{ fontSize: "0.7rem" }}>Verificando datos en BD...</span>
              </div>
            ) : matchResult ? (
              <div className="d-flex flex-column gap-1">
                <div className="alert alert-success py-1 px-2 mb-0" style={{ fontSize: "0.7rem" }}>
                  <i className="bi bi-check-circle-fill text-success me-1"></i>
                  <strong>Instrumento:</strong> {matchResult.descripcion} (S/N: {matchResult.numeroSerie})
                </div>
                <div className={`alert ${clienteAsociado ? "alert-info" : "alert-warning"} py-1 px-2 mb-0`} style={{ fontSize: "0.7rem" }}>
                  <i className={`bi ${clienteAsociado ? "bi-building-fill" : "bi-exclamation-triangle-fill"} me-1`}></i>
                  <strong>Cliente:</strong> {clienteAsociado ? `${clienteAsociado.nombre} (Cod: ${clienteAsociado.codigo || "N/A"})` : "Sin cliente asignado."}
                </div>
              </div>
            ) : (
              <div className="alert alert-warning py-1 px-2 mb-0" style={{ fontSize: "0.7rem" }}>
                <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i>
                No se encontró ningún instrumento en la base de datos con este código/partida.
              </div>
            )}
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="d-flex gap-2 pt-1 border-top">
          <button
            type="button"
            className="btn btn-secondary btn-sm flex-fill py-1 fw-semibold shadow-sm"
            style={{ fontSize: "0.75rem" }}
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-sm flex-fill py-1 fw-semibold shadow-sm"
            style={{ fontSize: "0.75rem" }}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}