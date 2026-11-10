// test-sheet.js
const SCRIPT_WEB_URL = "https://script.google.com/a/macros/bioars.com.ar/s/AKfycbzN4Om039k6yA9VQ_9hNzu6-RDwDMYAfDhJcfjFY-hODw_NO8RVr4u2sMl4tmbdPgMk/exec";

async function probarConexion() {
  try {
    console.log("Probando conexión con Google Sheets...");
    
    const response = await fetch(SCRIPT_WEB_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accion: "crear",
        id: "TEST-999",
        fecha: new Date(),
        cliente: "Cliente de Prueba",
        tarea: "Verificar conexión",
        prioridad: "Baja",
        estado: "Prueba",
        responsable: "Sistema"
      })
    });

    const resultado = await response.json();
    console.log("¡Respuesta recibida con éxito!", resultado);
  } catch (error) {
    console.error("Error en la comunicación:", error);
  }
}

probarConexion();