// EN esta parte se puede observar los botones principales, kardex, insumos, inventario
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Dashboard.css";

export default function HomeDashboard() {
  const navigate = useNavigate();
  const [mostrarMedia, setMostrarMedia] = useState(false);
  const [mostrarPDF, setMostrarPDF] = useState(false);

  return (
    <div className="home-dashboard">
      <div className="home-content">
        <div className="image-wrapper">
          {/* Imagen del laboratorio */}
          <img
            src="/visual/panel principal.png"
            alt="Laboratorio Clínico Silvio Alfonso Marín Uribe"
            className="home-image"
          />

          {/* Botón para abrir/cerrar el panel */}
          <button
            className="toggle-overlay"
            onClick={() => setMostrarMedia(!mostrarMedia)}
          >
            {mostrarMedia
              ? "🔒 Ocultar funcionamiento del sistema"
              : "👉 Mostrar funcionamiento del sistema"}
          </button>

          {/* Panel corredizo con video y PDF */}
          <div className={`media-overlay ${!mostrarMedia ? "hidden" : ""}`}>
            {/* Video */}
            <video
              className="dashboard-video"
              src="/visual/Sistema de kardex funcionamiento.mp4"
              controls
              width="300"
              onError={(e) => {
                e.target.style.display = "none"; // Oculta el video si no carga
              }}
            >
              Tu navegador no soporta video.
            </video>

            {/* Placeholder si el video no existe */}
            <div className="video-placeholder">
              🎬 Video no disponible
            </div>

            {/* PDF pequeño */}
            <iframe
              src="/visual/Como usar el sistema de kardex.pdf"
              className="dashboard-pdf"
              title="Manual completo"
              onError={(e) => {
                e.target.style.display = "none"; // Oculta si no existe
              }}
            ></iframe>

            {/* Botón para abrir el PDF grande */}
            <button className="pdf-button" onClick={() => setMostrarPDF(true)}>
              📄 Ver manual en pantalla completa
            </button>

            {/* Botón para descargar PDF */}
            <a
              href="/visual/Como usar el sistema de kardex.pdf"
              download="Manual del Sistema de Kardex.pdf"
              className="pdf-download"
            >
              ⬇️ Descargar manual
            </a>
          </div>

          {/* Modal PDF */}
          {mostrarPDF && (
            <div className="pdf-modal">
              <div className="pdf-modal-content">
                <button
                  className="cerrar-pdf"
                  onClick={() => setMostrarPDF(false)}
                >
                  ✖
                </button>
                <iframe
                  src="/visual/Como usar el sistema de kardex.pdf"
                  className="pdf-viewer"
                  title="Manual completo"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                ></iframe>
              </div>
            </div>
          )}

          {/* Botones principales */}
          <div className="home-actions-overlay">
            <button
              onClick={() => navigate("/dashboard/kardex")}
              className="home-btn kardex-btn"
            >
              <img
                src="https://www.pngfind.com/pngs/m/69-697004_png-file-svg-icono-de-laboratorio-png-transparent.png"
                alt="Kardex Icon"
                width="24"
                height="24"
                style={{ marginRight: "8px" }}
              />
              Kardex
            </button>

            <button
              onClick={() => navigate("/dashboard/insumos")}
              className="home-btn insumos-btn"
            >
              <img
                src="https://static.vecteezy.com/system/resources/previews/032/041/947/non_2x/clinical-analysis-result-icon-lab-blood-test-medicine-report-medical-check-up-health-check-png.png"
                alt="Insumos Icon"
                width="24"
                height="24"
                style={{ marginRight: "8px" }}
              />
              Insumos
            </button>

            <button
              onClick={() => navigate("/dashboard/inventario")}
              className="home-btn inventario-btn"
            >
              <img
                src="https://tse4.mm.bing.net/th/id/OIP.ngWVJN0P6rafIjyHts9xCAHaIn?pid=ImgDet&w=206&h=239&c=7&dpr=1,6&o=7&rm=3"
                alt="Inventario Icon"
                width="24"
                height="24"
                style={{ marginRight: "8px" }}
              />
              Inventario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
