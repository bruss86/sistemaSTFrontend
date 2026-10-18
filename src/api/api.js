const API_URL = import.meta.env.VITE_API_URL;

// ==========================================
// HELPER PRIVADO PARA PETICIONES AUTORIZADAS
// ==========================================
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token");
  
  const headers = {
    ...options.headers,
    Authorization: token ? `Bearer ${token}` : "",
  };

  if (!(options.body instanceof FormData) && options.method && options.method !== "GET") {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const res = await fetch(url, { ...options, headers });

  // Manejo centralizado de sesión expirada
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.reload();
    return;
  }

  return res;
}

// ==========================================
// CLIENTES
// ==========================================

export async function getClientes() {
  const res = await fetchWithAuth(`${API_URL}/clientes`);
  if (!res) return;
  return res.json();
}

export async function createCliente(data) {
  const res = await fetchWithAuth(`${API_URL}/clientes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res) return;
  return res.json();
}

export async function updateCliente(id, data) {
  const res = await fetchWithAuth(`${API_URL}/clientes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res) return;
  return res.json();
}

// ==========================================
// INSTRUMENTOS
// ==========================================

export async function getInstrumentos() {
  const res = await fetchWithAuth(`${API_URL}/instrumentos`);
  if (!res) return;
  return res.json();
}

export async function createInstrumento(data) {
  const res = await fetchWithAuth(`${API_URL}/instrumentos`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res) return;

  const resultado = await res.json();
  if (!res.ok) {
    throw new Error(resultado.error || "Error al crear instrumento");
  } 

  return resultado;
}

export async function updateInstrumento(id, data) {
  const res = await fetchWithAuth(`${API_URL}/instrumentos/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res) return;

  const resultado = await res.json();
  if (!res.ok) {
    throw new Error(resultado.error || "Error al actualizar instrumento");
  }
  return resultado;
}

export const getInstrumentosByCliente = async (id) => {
  const res = await fetchWithAuth(`${API_URL}/clientes/${id}/instrumentos`);
  if (!res) return;
  return res.json();
};

// ==========================================
// TAREAS
// ==========================================

export async function obtenerTareas() {
  const res = await fetchWithAuth(`${API_URL}/tareas`);
  if (!res) return;
  return res.json();
}