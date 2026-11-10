import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({ children, onClose }) {
  // cerrar con ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return createPortal(
    <div style={backdropStyle} onClick={onClose}>
      <div
        style={modalStyle}
        onClick={(e) => e.stopPropagation()} // evita cerrar al hacer click dentro
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

const backdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  overflowY: "auto", // 💡 Permite scroll si la pantalla es pequeña
  padding: "20px",
};

const modalStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "10px",
  width: "100%",
  maxWidth: "850px", // 💡 Aumentado para que entren holgadamente las dos columnas
  maxHeight: "90vh",  // 💡 Evita que el modal sea más alto que la pantalla
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
};