
const API_URL = import.meta.env.VITE_API_URL;
//const API_URL = "http://localhost:3000";
//const API_URL = "https://sistemast.onrender.com";

export async function getClientes() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/clientes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
   if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.reload();
    return;
  }
  return res.json();
}

export async function createCliente(data) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/clientes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
   if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.reload();
    return;
  }
  return res.json();
}
   

export async function updateCliente(id, data) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/clientes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
   if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.reload();
    return;
  }
  return res.json();
}


export async function getInstrumentos() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/instrumentos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await res.json();
   if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.reload();
    return;
  }
  return data;
}

export async function createInstrumento(data) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/instrumentos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
   if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.reload();
    return;
  }
  return res.json();
}

export async function updateInstrumento(id, data) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/instrumentos/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
   if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.reload();
    return;
  }
  return res.json();
}
    

export const getInstrumentosByCliente = async (id) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/clientes/${id}/instrumentos`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
   if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.reload();
    return;
  }
  return res.json();
};

export async function obtenerTareas() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/tareas`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
    if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.reload();
    return;
  }
  return res.json();
}

