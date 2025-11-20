import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Inventario.css";

export default function Inventario() {
  const [inventario, setInventario] = useState([]);
  const [tirillaSeleccionada, setTirillaSeleccionada] = useState(null);
  const [filtros, setFiltros] = useState({ tipo: "", nombre: "", mes: "" });
  const navigate = useNavigate();

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async (filtrosQuery) => {
    try {
      const idSede = localStorage.getItem("id_sede");
      const token = localStorage.getItem("token");
      if (!idSede || !token) return;

      const params = new URLSearchParams({ ...filtrosQuery, id_sede: idSede }).toString();
       const res = await   fetch(`${import.meta.env.VITE_API_URL}/inventario?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
      const data = await res.json();
      setInventario(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando inventario:", error);
      setInventario([]);
    }
  };

  const handleFiltroChange = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });
  const aplicarFiltros = () => cargarInventario(filtros);
  const handleVolver = () => navigate(-1);

  const obtenerColorVencimiento = (tipo, fechaVenc) => {
    if (!fechaVenc) return "white";
    const hoy = new Date();
    const venc = new Date(fechaVenc);
    let diffMeses = (venc.getFullYear() - hoy.getFullYear()) * 12 + venc.getMonth() - hoy.getMonth();
    if (venc.getDate() < hoy.getDate()) diffMeses -= 1;
    if (diffMeses <= 3) return "rgba(255,0,0,0.3)";
    if (diffMeses <= 5) return "rgba(255,255,0,0.3)";
    return "rgba(0,128,0,0.3)";
  };

  const formatearFecha = (fechaISO) => (fechaISO ? fechaISO.split("T")[0] : "");

  const estaTerminado = (item) => {
    let fechaTerminoStr = item.tipo === "INSUMO" ? item.termino : item.fecha_terminacion;
    if (!fechaTerminoStr) return false;
    const hoyStr = new Date().toISOString().split("T")[0];
    const fechaTerminoStrNorm = new Date(fechaTerminoStr).toISOString().split("T")[0];
    return fechaTerminoStrNorm <= hoyStr;
  };

  return (
    <div className="inventario-container">
     
    
      {/* Botones arriba a la izquierda */}
      <div className="botones-top">

        <button className="btn-volver" onClick={handleVolver}>Volver</button>
        <button className="btn-stock" onClick={() => navigate("/dashboard/stockinventario")}>
          Stock Inventario
        </button>
      </div>
       {/* Título */}
      <h2>Inventario</h2>

      {/* Filtros centrados */}
      <div className="inventario-filtros">
        <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange}>
          <option value="">Todos</option>
          <option value="INSUMO">Insumo</option>
          <option value="REACTIVO">Reactivo</option>
        </select>
        <input type="text" name="nombre" placeholder="Buscar por nombre" value={filtros.nombre} onChange={handleFiltroChange} />
        <input type="number" name="mes" placeholder="Mes" value={filtros.mes} onChange={handleFiltroChange} />
        <button onClick={aplicarFiltros}>Filtrar</button>
      </div>

      {/* GRID */}
      <div className="inventario-grid">
        <h3>Insumos</h3>
        {inventario.filter(i => i.tipo === "INSUMO").map((i, index) => (
          <div key={i.id} className="inventario-card" style={{ backgroundColor: obtenerColorVencimiento(i.tipo, i.fecha_de_vto), position: "relative" }} onClick={() => navigate(`/dashboard/insumos/${i.id}`)}>
            {estaTerminado(i) && <div style={{ position: "absolute", top: "5px", right: "5px", backgroundColor: "black", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>Terminado</div>}
            <strong>{i.nombre}</strong>
            <span>Fecha de recepcion: {formatearFecha(i.fecha)}</span>
            <span>Cantidad actual: {i.cantidad ?? 0}</span>
          </div>
        ))}

        <h3>Reactivos</h3>
        {inventario.filter(i => i.tipo === "REACTIVO").map((i, index) => (
          <div key={i.id} className="inventario-card" style={{ backgroundColor: obtenerColorVencimiento(i.tipo, i.fecha_vencimiento), position: "relative" }} onClick={() => navigate(`/dashboard/kardex/${i.id}`)}>
            {estaTerminado(i) && <div style={{ position: "absolute", top: "5px", right: "5px", backgroundColor: "black", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>Terminado</div>}
            <strong>{i.nombre}</strong>
            <span>Fecha de recepción: {formatearFecha(i.fecha_recepcion)}</span>
            <span>Cantidad actual: {i.cantidad ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
