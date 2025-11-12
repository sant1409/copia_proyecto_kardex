/**
 * 📘 KardexPage.jsx
 * 
 * Página principal del módulo Kardex.
 * Permite registrar, buscar, editar y eliminar tirillas de inventario.
 * 
 * - Carga datos desde la API protegida con token.
 * - Contiene formularios dinámicos para nuevos registros y filtros de búsqueda.
 * - Integra exportación de Kardex a Excel (LAB o SAS).
 * - Muestra una lista interactiva de tirillas con opciones de edición y eliminación.
 */


import { useState, useEffect } from "react";
import Kardex from "../../components/Kardex/Kardex";
import KardexListaTirillas from "../../components/Kardex/KardexListaTirillas";
import './Kardex.css';
import { useNavigate, useSearchParams } from "react-router-dom";
import { exportarKardex } from "../../exportar/ExportarKardex";

export default function KardexPage() {
  // 🔹 Estados principales
 const [tirillas, setTirillas] = useState([]);
  const [tipo, setTipo] = useState("");
  const [mes, setMes] = useState("");
  const [preData, setPreData] = useState({ mes_registro: "", lab_sas: "" });
  const [showMiniForm, setShowMiniForm] = useState(false);
  const [showKardexForm, setShowKardexForm] = useState(false);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroCasa, setFiltroCasa] = useState("");
  const [filtroLote, setFiltroLote] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const openId = searchParams.get("open");

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

  // 🔹 Carga inicial de todas las tirillas
useEffect(() => {
  const cargarTirillas = async () => {
    try {
      const res = await fetch(`http://localhost:3000/kardex?id_sede=${idSede}`, {
          headers: { "Authorization": `Bearer ${token}` }
         });
      const data = await res.json();
      const todasTirillas = data.map(r => ({
          fecha: r.fecha_recepcion,
          descripcion: r.nombre_insumo || r.lote || "Registro kardex",
          detalle: r
        }));

      setTirillas(todasTirillas);
    } catch (err) {
      console.error("Error cargando tirillas:", err);
    }
  };

  cargarTirillas(); // ✅ Ejecuta la función al montar el componente
}, []);

  // 🔹 Confirmar mini formulario
  const handleConfirmarMiniForm = () => {
    if (!preData.mes_registro || !preData.lab_sas) return alert("Seleccioná mes y tipo (lab/sas).");
    setShowKardexForm(true);
    setShowMiniForm(false);
  };
  // 🔹 Agregar o actualizar tirilla en estado
  const handleNuevaTirilla = (nuevaTirilla) => {
    if (!nuevaTirilla.detalle.id_kardex) {
      console.error("Falta id_kardex en la tirilla");
      return;
    }

    setTirillas(prev => {
      const index = prev.findIndex(
        t => t.detalle.id_kardex === nuevaTirilla.detalle.id_kardex
      );
      if (index !== -1) {
        const copia = [...prev];
        copia[index] = nuevaTirilla; // reemplaza tirilla existente
        return copia;
      }
      return [...prev, nuevaTirilla]; // agrega tirilla nueva
    });
  };
// 🔹 Función para buscar tirillas del Kardex
const buscarKardex = async () => {
  const params = new URLSearchParams();
  if (filtroNombre) params.append("nombre", filtroNombre);
  if (filtroCasa) params.append("casa_comercial", filtroCasa);
  if (filtroLote) params.append("lote", filtroLote);
  if (desde) params.append("desde", desde);
  if (hasta) params.append("hasta", hasta);

  try {
    const res = await fetch(`http://localhost:3000/kardex/buscar_kardex?${params.toString()}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await res.json();

    const tirillasCargadas = data.map(r => ({
      fecha: r.fecha_recepcion,
      descripcion: r.nombre_insumo || r.lote || r.casa_comercial || "Registro kardex",
      detalle: r,
    }));

    setTirillas(tirillasCargadas);
  } catch (err) {
    console.error("Error buscando kardex:", err);
  }
};
  

return (
  <div className="kardex-page">
    {/* 🔹 Botones superiores */}
    <div className="botones-top">
      <button className="btn-volver" onClick={handleVolver}>
        ← Volver
      </button>

      <button
        className="btn-registrar"
        onClick={() => setShowMiniForm(!showMiniForm)}
      >
        Registrar nuevo Kardex
      </button>
    </div>

    {/* 🔹 Mini formulario */}
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
          Lab / Sas:
          <select
            value={preData.lab_sas}
            onChange={e => setPreData({ ...preData, lab_sas: e.target.value })}
          >
            <option value="">Seleccione...</option>
            <option value="lab">lab</option>
            <option value="sas">sas</option>
          </select>
        </label>
        <button className="btn-confirmar" onClick={handleConfirmarMiniForm}>
          Confirmar
        </button>
      </div>
    )}

    {/* 🔹 Buscador */}
    <div className="buscar-kardex">
      <input
        placeholder="Nombre"
        value={filtroNombre}
        onChange={e => setFiltroNombre(e.target.value)}
      />
      <input
        placeholder="Casa comercial"
        value={filtroCasa}
        onChange={e => setFiltroCasa(e.target.value)}
      />
      <input
        placeholder="Lote"
        value={filtroLote}
        onChange={e => setFiltroLote(e.target.value)}
      />
      <input
        type="date"
        value={desde}
        onChange={e => setDesde(e.target.value)}
      />
      <input
        type="date"
        value={hasta}
        onChange={e => setHasta(e.target.value)}
      />
      <button onClick={buscarKardex}>Buscar</button>
    </div>

    {/* 🔹 Formulario completo del Kardex */}
    {showKardexForm && (
      <Kardex
        preData={preData}
        onNuevoRegistro={handleNuevaTirilla}
        onBack={() => setShowKardexForm(false)}
      />
    )}

    {/* 📤 Exportar a Excel */}
    <div className="Exportar">
      <select value={tipo} onChange={e => setTipo(e.target.value)}>
        <option value="">Seleccionar tipo</option>
        <option value="lab">LAB</option>
        <option value="sas">SAS</option>
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
      </select>

      <select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(e.target.value)}>
       {años.map((anio) => (
     <option key={anio} value={anio}>
      {anio}
     </option>
    ))}
    </select>

      <button
        className="btn-exportar"
        onClick={() => exportarKardex(tirillas, tipo, mes, anioSeleccionado)}
        disabled={!tipo || !mes || !anioSeleccionado}
     >
      Exportar
    </button>

    </div>

    {/* 🔹 Lista de tirillas */}
    <KardexListaTirillas
      tirillas={tirillas}
      onActualizarTirilla={tirilla => {
        setShowKardexForm(true);
        setPreData({
          ...tirilla.detalle,
          id_kardex: tirilla.detalle.id_kardex,
        });
      }}
      onEliminarTirilla={async tirilla => {
        if (!window.confirm("¿Seguro que quieres eliminar esta tirilla?")) return;

        try {
          const res = await fetch(`http://localhost:3000/kardex/${tirilla.detalle.id_kardex}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify({
                usuarioId: localStorage.getItem("usuarioId"),
              }),
            }
          );

          const data = await res.json();

          if (res.ok) {
            setTirillas(prev =>
              prev.filter(t => t.detalle.id_kardex !== tirilla.detalle.id_kardex)
            );
          } else {
            alert("Error eliminando tirilla: " + data.message);
          }
        } catch (error) {
          console.error("Error al eliminar kardex:", error);
          alert("Error eliminando tirilla");
        }
      }}
    />
  </div>
);
}