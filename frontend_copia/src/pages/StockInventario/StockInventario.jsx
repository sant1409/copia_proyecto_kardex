/**
 * 🧾 StockInventario.jsx
 * 
 * Página que muestra el stock actual de insumos y reactivos.
 * Permite buscar, filtrar y visualizar la cantidad disponible de cada producto.
 * 
 * 🔹 Usa useEffect para cargar los datos desde el backend al iniciar.
 * 🔹 Los filtros permiten buscar por tipo, nombre o casa comercial/laboratorio.
 * 🔹 Incluye botón de "Volver" para regresar a la vista anterior.
 * 🔹 Los datos se dividen en dos tablas: una para insumos y otra para reactivos.
 */


import { useEffect, useState } from "react";
import "./StockInventario.css";
import { useNavigate } from "react-router-dom";

export default function StockInventario() {
  const [insumos, setInsumos] = useState([]);
  const [reactivos, setReactivos] = useState([]);

  // valores que realmente se aplican al filtro
  const [filtros, setFiltros] = useState({
    tipo: "",
    nombre: "",
    casaComercial: "",
  });

  // valores que se escriben en los inputs
  const [inputs, setInputs] = useState({
    tipo: "",
    nombre: "",
    casaComercial: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    cargarStock();
  }, []);

  

  const cargarStock = async () => {
    try {
      const token = localStorage.getItem("token");
      const idSede = localStorage.getItem("id_sede");

      if (!token || !idSede) {
        console.error("Falta token o id_sede en localStorage");
        return;
      }
      const res = await fetch("http://localhost:3000/stock_inventario", {
         headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
          }
        });
       if (!res.ok) {
        throw new Error(`Error del servidor: ${res.status}`);
      }
      const data = await res.json();
      setInsumos(data.insumos || []);
      setReactivos(data.reactivos || []);
    } catch (error) {
      console.error("Error cargando stock:", error);
    }
  };

  // manejar inputs sin aplicar de inmediato
  const handleInputChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  // aplicar filtros cuando se oprime "Buscar"
  const aplicarFiltros = () => {
    setFiltros(inputs);
  };

  const filtrarDatos = (lista, tipo) => {
    return lista.filter((item) => {
      const matchNombre = filtros.nombre
        ? item.nombre_producto.toLowerCase().includes(filtros.nombre.toLowerCase())
        : true;

      const matchCasaLab = filtros.casaComercial
        ? (item.casa_comercial || item.laboratorio || "")
            .toLowerCase()
            .includes(filtros.casaComercial.toLowerCase())
        : true;

      const matchTipo =
        filtros.tipo === "" ? true : filtros.tipo === tipo; // compara INSUMO o REACTIVO

      return matchNombre && matchCasaLab && matchTipo;
    });
  };

  const insumosFiltrados = filtrarDatos(insumos, "INSUMO");
  const reactivosFiltrados = filtrarDatos(reactivos, "REACTIVO");

    // 🔹 Esta es la clave: función para el botón de volver
  const handleVolver = () => {
    navigate(-1);
  };
  

  return (
    <div>

      <button className="btn-volver" onClick={handleVolver}>
        ← Volver
      </button>
      
      {/* Listado */}
      <div className="stock-container">
        <h2>Stock Inventario</h2>

      <div className="stock-filtros">
        <select name="tipo" value={inputs.tipo} onChange={handleInputChange}>
          <option value="">Todos</option>
          <option value="INSUMO">Insumo</option>
          <option value="REACTIVO">Reactivo</option>
        </select>

        <input
          type="text"
          name="nombre"
          placeholder="Buscar por nombre"
          value={inputs.nombre}
          onChange={handleInputChange}
        />

        <input
          type="text"
          name="casaComercial"
          placeholder="Buscar por Casa Comercial / Laboratorio"
          value={inputs.casaComercial}
          onChange={handleInputChange}
        />

        <button onClick={aplicarFiltros}>Buscar</button>
      </div>

        {/* Insumos */}
        <h3>Insumos</h3>
        <table>
          <thead>
            <tr>
              <th>Nombre del Insumo</th>
              <th>Cantidad</th>
              <th>Laboratorio</th>
            </tr>
          </thead>
          <tbody>
           {insumosFiltrados.map((i) => (
             <tr key={`${i.nombre_producto}-${i.laboratorio}`}>
               <td>{i.nombre_producto}</td>
               <td>{i.cantidad_total}</td>
               <td>{i.laboratorio || "-"}</td>
            </tr>
           ))}
         </tbody>
        </table>

        {/* Reactivos */}
        <h3>Reactivos</h3>
        <table>
          <thead>
            <tr>
              <th>Nombre del Reactivo</th>
              <th>Cantidad</th>
              <th>Casa Comercial</th>
            </tr>
          </thead>
        <tbody>
          {reactivosFiltrados.map((r) => (
           <tr key={`${r.nombre_producto}-${r.casa_comercial}`}>
            <td>{r.nombre_producto}</td>
            <td>{r.cantidad_total}</td> 
            <td>{r.casa_comercial || "-"}</td>
          </tr>
           ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
