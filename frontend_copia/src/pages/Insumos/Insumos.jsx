/**
 * 📄 InsumosPage.jsx
 * Página principal para la gestión de insumos.
 * Permite:
 * - Registrar nuevos insumos (con selección de mes y categoría).
 * - Buscar insumos por nombre, laboratorio, lote o fecha.
 * - Exportar registros filtrados a Excel.
 * - Editar o eliminar insumos existentes.
 * - Cargar automáticamente las categorías e insumos desde la API.
 */

import { useState, useEffect } from "react";
import Insumos from "../../components/Insumos/Insumos";
import InsumosListaTirillas from "../../components/Insumos/InsumosListaTirillas";
import './Insumos.css';
import { useNavigate, useSearchParams } from "react-router-dom";
import { exportarInsumos } from "../../exportar/ExportarInsumos";

export default function InsumosPage() {
  // 🔹 Estados principales
  const [showMiniForm, setShowMiniForm] = useState(false);
  const [preData, setPreData] = useState({ mes_registro: "", categoria: "" });
  const [tirillas, setTirillas] = useState([]);
   const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
   const [mes, setMes] = useState("");
  const [showInsumosForm, setShowInsumosForm] = useState(false);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroLaboratorio, setFiltroLaboratorio] = useState("");
  const [filtroLote, setFiltroLote] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const openId = searchParams.get("open"); // puede ser null

  //  Año actual y lista de años dinámicos (desde año actual hasta 3000)
  const anioActual = new Date().getFullYear(); 
  const años = Array.from({ length: 3000 - anioActual + 1 }, (_, i) => anioActual + i); 
  
  //Estado para el año seleccionado (inicial = año actual)
  const [anioSeleccionado, setAnioSeleccionado] = useState(String(anioActual)); 

  

  const handleVolver = () => {
  navigate(-1); // esto hace que vaya a la página anterior en la historia
};
   const idSede = localStorage.getItem("id_sede");
   const token = localStorage.getItem("token"); 

  // 🔹 Carga inicial de categorías
  useEffect(() => {
    const cargarCategorias = async () => {
      try {

        const res = await fetch(`http://localhost:3000/categoria?id_sede=${idSede}`, {
          headers: { "Authorization": `Bearer ${token}` }
         });
        const data = await res.json();
        const opciones = data.map(cat => ({ id_categoria: cat.id_categoria, nombre: cat.categoria }));
        setCategorias(opciones);
        
      } catch (error) {
        console.error("Error cargando categorías:", error);
      }
    };
    cargarCategorias();
  }, []);

  // 🔹 Carga inicial de todas las tirillas
  useEffect(() => {
    const cargarTirillas = async () => {
      try {

        const res = await fetch(`http://localhost:3000/insumos?id_sede=${idSede}`,{
          headers: {
          "Authorization": `Bearer ${token}`
        }
      });
        const data = await res.json();
        const tirillasCargadas = data.map(r => ({
          fecha: r.fecha,
          descripcion: r.id_nombre_del_insumo || r.lote || "Registro insumo",
          
          detalle: {
            ...r,
            categoria: categorias.find(c => c.id_categoria === r.id_categoria)?.nombre || r.categoria || ""
          }
        }));
        setTirillas(tirillasCargadas);
      } catch (err) {
        console.error("Error cargando tirillas:", err);
      }
    };
    if (categorias.length > 0) cargarTirillas(); // espera a que categorías estén listas
  }, [categorias]);

  // 🔹 Confirmar mini formulario
  const handleConfirmarMiniForm = () => {
    if (!preData.mes_registro) return alert("Seleccioná el mes.");
    setShowInsumosForm(true);
    setShowMiniForm(false);
  };

  // 🔹 Agregar o actualizar tirilla
  const handleNuevaTirilla = (nuevaTirilla) => {
    if (!nuevaTirilla.detalle.id_insumo) {
      console.error("Falta id_insumo en la tirilla");
      return;
    }

    setTirillas(prev => {
      const index = prev.findIndex(t => t.detalle.id_insumo === nuevaTirilla.detalle.id_insumo);
      if (index !== -1) {
        const copia = [...prev];
        copia[index] = nuevaTirilla;
        return copia;
      }
      return [...prev, nuevaTirilla];
    });
  };

  // 🔹 Función para buscar tirillas
  const buscarInsumos = async () => {
    const params = new URLSearchParams();
    if (filtroNombre) params.append("nombre", filtroNombre);
    if (filtroLaboratorio) params.append("laboratorio", filtroLaboratorio);
    if (filtroLote) params.append("lote", filtroLote);
    if (busqueda) params.append("q", busqueda);
    if (desde) params.append("desde", desde);
    if (hasta) params.append("hasta", hasta);

    try {
      const res = await fetch(`http://localhost:3000/insumos/buscar_insumos?${params.toString()}`,{
          headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      const tirillasCargadas = data.map(r => ({
        fecha: r.fecha,
        descripcion: r.nombre_del_insumo || r.lote || r.laboratorio || "Registro insumo",
        detalle: {
          ...r,
          categoria: categorias.find(c => c.id_categoria === r.id_categoria)?.nombre || r.categoria || ""
        }
      }));
      setTirillas(tirillasCargadas);
    } catch (err) {
      console.error("Error buscando insumos:", err);
    }
  };

  return (   
    
    <div className="insumos-page">
      {/* 🔹 Botón de volver */}
       <div className="botones-top">
    <button className="btn-volver" onClick={handleVolver}>
      ← Volver
    </button>
    
      <button className="btn-registrar" onClick={() => setShowMiniForm(!showMiniForm)} >
        Registrar nuevo Insumo
      </button>
      </div>

      {showMiniForm && (
        <div className="form-mini">
          <label>
            Mes:
            <input
              type="month"
              value={preData.mes_registro}
              onChange={e => setPreData({ ...preData, mes_registro: e.target.value })}
            />
          </label>
          <label>
            Categoría:
            <select
              value={preData.categoria}
              onChange={e => setPreData({ ...preData, categoria: e.target.value ? parseInt(e.target.value) : "" })}
            >
              <option value="">Seleccione...</option>
              {categorias.map(c => (
                <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
              ))}
            </select>
          </label>
          <button className="btn-confirmar" onClick={handleConfirmarMiniForm}>
            Confirmar
          </button>
        </div>
      )}
        
        {/*Buscar kardex*/}
      <div className="buscar-insumos">
        <input placeholder="Nombre" value={filtroNombre} onChange={e => setFiltroNombre(e.target.value)} />
        <input placeholder="Laboratorio" value={filtroLaboratorio} onChange={e => setFiltroLaboratorio(e.target.value)} />
        <input placeholder="Lote" value={filtroLote} onChange={e => setFiltroLote(e.target.value)} />
        <input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
        <button onClick={buscarInsumos}>Buscar</button>
      </div>

      {showInsumosForm && (
      <Insumos preData={preData} onNuevoRegistro={handleNuevaTirilla} 
      onBack={() => setShowInsumosForm(false)} />
      )}

         {/* 📤 Exportar a Excel */}
      <div className="Exportar">
        <select
          value={categoriaSeleccionada}
          onChange={e => setCategoriaSeleccionada(e.target.value)}
        >
          <option value="">Seleccionar categoría</option>
          {categorias.map(c => (
            <option key={c.id_categoria} value={c.nombre}>{c.nombre}</option>
          ))}
        </select>
     
            <select value={mes} onChange={e => setMes(e.target.value)}>
              <option value="">Seleccionar mes</option>
              <option value="Enero">Enero</option>
              <option value="Febrero">Febrero</option>
              <option value="Marzo">Marzo</option>
              <option value="Abril">Abril</option>
              <option value="Mayo">Mayo</option>
              <option value="Junio">Junio</option>
              <option value="Julio">Julio</option>
               <option value="Agosto">Agosto</option>
               <option value="Septiembre">Septiembre</option>
              <option value="Octubre">Octubre</option>
              <option value="Noviembre">Noviembre</option>
                <option value="Diciembre">Diciembre</option>
              {/* ...los demás meses */}
            </select>

            <select value={anioSeleccionado} onChange={e => setAnioSeleccionado(e.target.value)}>
             {años.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
              </select>

          <button
               className="btn-exportar"
              onClick={() => exportarInsumos(tirillas, categoriaSeleccionada, mes, anioSeleccionado)}
               disabled={!categoriaSeleccionada || !mes || !anioSeleccionado}

                 >
               Exportar
               </button>
         </div>
              
      <InsumosListaTirillas
        tirillas={tirillas}
          initialSelectedId={openId}
        onActualizarTirilla={(tirilla) => {
          setShowInsumosForm(true);
          setPreData({
            ...tirilla.detalle,
            id_insumo: tirilla.detalle.id_insumo,
            categoria: tirilla.detalle.id_categoria || ""
          });
        }}
        onEliminarTirilla={async (tirilla) => {
          if (!window.confirm("¿Seguro que quieres eliminar este insumo?")) return;

          try {
            const res = await fetch(`http://localhost:3000/insumos/${tirilla.detalle.id_insumo}`, {
              method: "DELETE",
               headers: { 
                       "Content-Type": "application/json",
                       "Authorization": `Bearer ${token}`},
               body: JSON.stringify({ usuarioId: localStorage.getItem("usuarioId") 
                
              })
            });

            if (res.ok) {
              setTirillas(prev => prev.filter(t => t.detalle.id_insumo !== tirilla.detalle.id_insumo));
            } else {
              const data = await res.json();
              alert("Error eliminando insumo: " + data.message);
            }
          } catch (error) {
            console.error("Error al eliminar insumo:", error);
            alert("Error eliminando insumo");
          }
        }}
      />
    </div>
  );
}
