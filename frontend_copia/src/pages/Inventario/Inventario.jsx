/**
 * 🔹 Inventario.jsx
 * Página que muestra el inventario general del sistema.
 * Permite filtrar, visualizar y acceder al detalle de insumos y reactivos.
 * Además, indica visualmente el estado de vencimiento y si un elemento ha terminado.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Inventario.css";


export default function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [tirillaSeleccionada, setTirillaSeleccionada] = useState(null);
  const [filtros, setFiltros] = useState({
    tipo: "",
    nombre: "",
    mes: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async (filtrosQuery) => {
    try {
      const idSede = localStorage.getItem("id_sede");
      const token = localStorage.getItem("token");

      if (!idSede || !token) {
        console.error("Falta id_sede o token en localStorage");
        return;
      }

      const params = new URLSearchParams({
        ...filtrosQuery,
        id_sede: idSede,
      }).toString();

      const res = await   fetch(`${import.meta.env.VITE_API_URL}/inventario?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);

      const data = await res.json();
      const inventarioData = Array.isArray(data) ? data : [];
      setInventario(inventarioData);
    } catch (error) {
      console.error("Error cargando inventario:", error);
      setInventario([]);
    }
  };

  const obtenerColorVencimiento = (tipo, fechaVenc) => {
    if (!fechaVenc) return "white";

    const hoy = new Date();
    const venc = new Date(fechaVenc);

    let diffMeses = (venc.getFullYear() - hoy.getFullYear()) * 12;
    diffMeses += venc.getMonth() - hoy.getMonth();
    if (venc.getDate() < hoy.getDate()) diffMeses -= 1;

    if (diffMeses <= 3) return "rgba(255, 0, 0, 0.3)";
    if (diffMeses <= 5) return "rgba(255, 255, 0, 0.3)";
    return "rgba(0, 128, 0, 0.3)";
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "";
    return fechaISO.split("T")[0];
  };

  const handleFiltroChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const aplicarFiltros = () => {
    cargarInventario(filtros);
  };

  const handleVolver = () => {
    navigate(-1);
  };

  const estaTerminado = (item) => {
  let fechaTerminoStr = null;

  if (item.tipo === "INSUMO") {
    fechaTerminoStr = item.termino;
  } else if (item.tipo === "REACTIVO") {
    fechaTerminoStr = item.fecha_terminacion;
  }

  if (!fechaTerminoStr) return false;

  // 🔹 Convertimos ambas fechas a formato "YYYY-MM-DD"
  const hoyStr = new Date().toISOString().split("T")[0];
  const fechaTerminoStrNorm = new Date(fechaTerminoStr).toISOString().split("T")[0];

  // 🔹 Marcar como terminado si la fecha de terminación es HOY o anterior
  return fechaTerminoStrNorm <= hoyStr;
};

  return (
    <div className="inventario-container">
      <h2>Inventario</h2>

      <div className="botones-top">
        <button className="btn-volver" onClick={handleVolver}>
          ← Volver
        </button>
        <button
          className="btn-stock"
          onClick={() => navigate("/dashboard/stockinventario")}
        >
          Stock Inventario
        </button>

        <div className="inventario-filtros">
          <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange}>
            <option value="">Todos</option>
            <option value="INSUMO">Insumo</option>
            <option value="REACTIVO">Reactivo</option>
          </select>
          <input
            type="text"
            name="nombre"
            placeholder="Buscar por nombre"
            value={filtros.nombre}
            onChange={handleFiltroChange}
          />
          <input
            type="number"
            name="mes"
            placeholder="Mes"
            value={filtros.mes}
            onChange={handleFiltroChange}
          />
          <button onClick={aplicarFiltros}>Filtrar</button>
        </div>
      </div>

      <div className="inventario-grid">
        <h3>Insumos</h3>
        {inventario
          .filter((item) => item.tipo === "INSUMO")
          .map((i, index) => (
            <div
              key={`INSUMO-${i.id_insumo}-${index}`}
              className="inventario-card"
              style={{
                backgroundColor: obtenerColorVencimiento(i.tipo, i.fecha_de_vto),
                position: "relative",
              }}
              onClick={() => navigate(`/dashboard/insumos/${i.id}`)}
            >
              {estaTerminado(i) && (
                <div
                  style={{
                    position: "absolute",
                    top: "5px",
                    right: "5px",
                    backgroundColor: "black",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Terminado
                </div>
              )}
              <strong>{i.nombre}</strong>
              <span>Fecha de recepcion: {formatearFecha(i.fecha)}</span>
              <span>Cantidad actual: {i.cantidad ?? 0}</span>
            </div>
          ))}

        <h3>Reactivos</h3>
        {inventario
          .filter((item) => item.tipo === "REACTIVO")
          .map((i, index) => (
            <div
              key={`REACTIVO-${i.id_kardex}-${index}`}
              className="inventario-card"
              style={{
                backgroundColor: obtenerColorVencimiento(i.tipo, i.fecha_vencimiento),
                position: "relative",
              }}
              onClick={() => navigate(`/dashboard/kardex/${i.id}`)}
            >
              {estaTerminado(i) && (
                <div
                  style={{
                    position: "absolute",
                    top: "5px",
                    right: "5px",
                    backgroundColor: "black",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  Terminado
                </div>
              )}
              <strong>{i.nombre}</strong>
              <span>Fecha de recepción: {formatearFecha(i.fecha_recepcion)}</span>
              <span>Cantidad actual: {i.cantidad ?? 0}</span>
            </div>
          ))}
      </div>

      {tirillaSeleccionada && (
        <div className="tirilla-modal">
          <div className="tirilla-modal-content">
            <button
              className="tirilla-close"
              onClick={() => setTirillaSeleccionada(null)}
            >
              X
            </button>
            <h3>{tirillaSeleccionada.nombre}</h3>
            <p>Tipo: {tirillaSeleccionada.tipo}</p>
            <p>
              Fecha:{" "}
              {tirillaSeleccionada.tipo === "INSUMO"
                ? tirillaSeleccionada.fecha
                : tirillaSeleccionada.fecha_recepcion}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
