/**
 * 📘 Kardex.jsx
 *
 * Formulario principal para registrar o actualizar información de un insumo en el Kardex.
 * 
 * 🔹 Funcionalidad:
 *  - Carga datos dinámicos (insumos, presentaciones, casas comerciales, etc.) desde la API.
 *  - Permite crear o editar registros según si recibe `preData`.
 *  - Usa selectores editables (react-select/creatable) para facilitar la gestión de valores.
 *  - Envía datos al backend mediante `fetch` (POST o PUT).
 *  - Muestra mensajes de éxito o error en pantalla.
 * 
 * 🔹 Props:
 *  - preData: datos iniciales para precargar el formulario si se edita.
 *  - onBack: función para volver a la vista anterior.
 *  - onNuevoRegistro: callback al crear o actualizar un registro exitosamente.
 * 
 * 🔹 Hooks usados:
 *  - useState: manejo del estado del formulario y listas de opciones.
 *  - useEffect: carga de datos iniciales y precarga de `preData`.
 */


import { useState,  useEffect } from "react";
import CreatableSelect from "react-select/creatable";
import "./Kardex.css";


function formatDate(fecha) {
  if (!fecha) return "";
  return fecha.split("T")[0]; // 🔹 devuelve solo YYYY-MM-DD
}

export default function Kardex({ preData, onBack, onNuevoRegistro }) {
  const valorLabSas = preData?.lab_sas || ""; 
  const valorMesRegistro = preData?.mes_registro || "";

  const [formData, setFormData] = useState({
    fecha_recepcion: "",
    temperatura_llegada: "",
    maximo: "",
    minimo: "",
    cantidad: "",
    salida: "",
    saldo: "",
    id_nombre_insumo: "",
    id_presentacion_k: "",
    id_casa_comercial: "",
    id_proveedor_k: "",
    lote: "",
    fecha_vencimiento: "",
    registro_invima: "",
    expediente_invima: "",
    estado_revision: "",
    temperatura_almacenamiento: "",
    id_clasificacion_riesgo: "",
    principio_activo: "",
    forma_farmaceutica: "",
    concentracion: "",
    unidad_medida: "",
    fecha_salida: "",
    fecha_inicio: "",
    fecha_terminacion: "",
    area: "",
    factura: "",
    costo_general: "",
    costo_caja: "",
    costo_prueba: "",
    iva: "",
    consumible: "",
  });

  const [insumos, setInsumos] = useState([]);
  const [presentaciones, setPresentaciones] = useState([]);
  const [casasComerciales, setCasasComerciales] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [mensaje, setMensaje] = useState(""); 



   const camposVisibles = [
    "fecha_recepcion", "temperatura_llegada", "maximo", "minimo", "cantidad",
    "salida", "saldo", "id_nombre_insumo", "id_presentacion_k", "id_casa_comercial",
    "id_proveedor_k", "lote", "fecha_vencimiento", "registro_invima", "expediente_invima",
    "estado_revision", "temperatura_almacenamiento", "id_clasificacion_riesgo",
    "principio_activo", "forma_farmaceutica", "concentracion", "unidad_medida",
    "fecha_salida", "fecha_inicio", "fecha_terminacion", "area", "factura",
    "costo_general", "costo_caja", "costo_prueba", "iva", "consumible", 
  ];

useEffect(() => {
  const cargarDatos = async () => {
    try {

      const idSede = localStorage.getItem("id_sede");
      const token = localStorage.getItem("token");

      // 🔹 Fetch de reactivos
      const insumosRes = await fetch(`http://localhost:3000/nombre_insumo?id_sede=${idSede}`, {
        headers: {
         "Authorization": `Bearer ${token}`
          }
        });
      const insumosData = await insumosRes.json();
      const insumosOpciones = insumosData.map(item => ({
        value: item.id_nombre_insumo,
        label: item.nombre_insumo
      }));
      setInsumos(insumosOpciones);
  

      // 🔹 Fetch de presentaciones
      const presentacionesRes = await fetch(`http://localhost:3000/presentacion_k?id_sede=${idSede}`,{
        headers: {
         "Authorization": `Bearer ${token}`
          }
        });
      const presentacionesData = await presentacionesRes.json();
      const presentacionesOpciones = presentacionesData.map(item => ({
        value: item.id_presentacion_k,
        label: item.presentacion_k
      }));
      setPresentaciones(presentacionesOpciones);


      // 🔹 Fetch de casas comerciales
      const casasRes = await fetch(`http://localhost:3000/casa_comercial?id_sede=${idSede}`,{
        headers: {
         "Authorization": `Bearer ${token}`
          }
        });
      const casasData = await casasRes.json();
      const casasOpciones = casasData.map(item => ({
        value: item.id_casa_comercial,
        label: item.casa_comercial
      }));
      setCasasComerciales(casasOpciones);
   

      // 🔹 Fetch de proveedores
      const proveedoresRes = await fetch(`http://localhost:3000/proveedor_k?id_sede=${idSede}`,{
        headers: {
         "Authorization": `Bearer ${token}`
          }
        });
      const proveedoresData = await proveedoresRes.json();
      const proveedoresOpciones = proveedoresData.map(item => ({
        value: item.id_proveedor_k,
        label: item.proveedor_k
      }));
      setProveedores(proveedoresOpciones);
 

      // 🔹 Fetch de clasificaciones de riesgo
      const clasificacionesRes = await fetch(`http://localhost:3000/clasificacion_riesgo?id_sede=${idSede}`,{
        headers: {
         "Authorization": `Bearer ${token}`
          }
        });
      const clasificacionesData = await clasificacionesRes.json();
      const clasificacionesOpciones = clasificacionesData.map(item => ({
        value: item.id_clasificacion_riesgo,
        label: item.clasificacion_riesgo
      }));
      setClasificaciones(clasificacionesOpciones);

    if (preData && preData.id_kardex) {
  // 🔹 Buscar IDs a partir de los nombres
  const valorNombreInsumo = insumosOpciones.find(i => i.label === preData.nombre_insumo);
  const valorPresentacion = presentacionesOpciones.find(i => i.label === preData.presentacion);
  const valorCasaComercial = casasOpciones.find(i => i.label === preData.casa_comercial);
  const valorProveedor = proveedoresOpciones.find(i => i.label === preData.proveedor);
  const valorClasificacion = clasificacionesOpciones.find(i => i.label === preData.clasificacion_riesgo);

  setFormData(prev => ({
    ...prev,
    ...preData,
    fecha_recepcion: formatDate(preData.fecha_recepcion),
    fecha_vencimiento: formatDate(preData.fecha_vencimiento),
    fecha_salida: formatDate(preData.fecha_salida),
    fecha_inicio: formatDate(preData.fecha_inicio),
    fecha_terminacion: formatDate(preData.fecha_terminacion),

    // 🔹 Asignar IDs encontrados
    id_nombre_insumo: valorNombreInsumo ? valorNombreInsumo.value : "",
    id_presentacion_k: valorPresentacion ? valorPresentacion.value : "",
    id_casa_comercial: valorCasaComercial ? valorCasaComercial.value : "",
    id_proveedor_k: valorProveedor ? valorProveedor.value : "",
    id_clasificacion_riesgo: valorClasificacion ? valorClasificacion.value : "",
  }));


        console.log("preData recibido:", preData);
        console.log("Valores precargados FK:", {
          valorNombreInsumo,
          valorPresentacion,
          valorCasaComercial,
          valorProveedor,
          valorClasificacion
        });
      }

    } catch (err) {
      console.error("Error cargando datos en Kardex:", err);
    }
  };

  cargarDatos();
}, [preData]);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const makeHandler = (field) => (newValue) => {
    setFormData({ ...formData, [field]: newValue ? newValue.value : "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const idUsuarioLogueado = localStorage.getItem("usuarioId");
    const idSede = localStorage.getItem("id_sede")

  //Validacion de no actualizar casa o reactivo, esta es debido a que el stock no falle
if (preData && preData.id_kardex) {
    const oldCasa = String(preData.id_casa_comercial ?? "");
    const oldInsumo = String(preData.id_nombre_insumo ?? "");
    const newCasa = String(formData.id_casa_comercial ?? "");
    const newInsumo = String(formData.id_nombre_insumo ?? "");

    if (newCasa !== oldCasa || newInsumo !== oldInsumo) {
      alert("⚠️ Sugerencia: cambiar Casa Comercial o Nombre del reactivo puede causar inconsistencias. Se recomienda eliminar y crear un nuevo registro.");
      // ❌ Ojo: no ponemos return, dejamos que siga
    }
  }

      // Preguntar confirmación al usuario
  const confirmado = window.confirm("¿Estás seguro de que los datos son correctos y quieres crear el registro?");
  if (!confirmado) {
    return; // si cancela, no se manda nada
  }
    const datosFinales = {
      ...formData,
      lab_sas: valorLabSas,
      mes_registro: valorMesRegistro,
      usuarioId: idUsuarioLogueado,
      id_sede: idSede, 
      id_nombre_insumo: formData.id_nombre_insumo,
      id_presentacion_k: formData.id_presentacion_k,
      id_casa_comercial: formData.id_casa_comercial,
      id_proveedor_k: formData.id_proveedor_k,
      id_clasificacion_riesgo: formData.id_clasificacion_riesgo,

    };

    try {
         // ✅ Si hay preData.id → actualizar, sino crear
      const url = preData && preData.id_kardex
        ? `http://localhost:3000/kardex/${preData.id_kardex}`
        : "http://localhost:3000/kardex";
          
      const metodo = preData && preData.id_kardex ? "PUT" : "POST";

      const res = await fetch(url, {
        method: metodo,
         headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
           },
           body: JSON.stringify(datosFinales)
          });
          
      const data = await res.json();
      console.log("📥 Respuesta completa del backend:", data);

      if (!res.ok) {
        console.error("Error del backend:", data);
        setMensaje("Error al enviar: " + (data.error || JSON.stringify(data)));
        return;
      }
    
const tirilla = {
  detalle: {
    id_kardex: data.id_kardex || preData.id_kardex,
    nombre_insumo: insumos.find(i => i.value === formData.id_nombre_insumo)?.label || "",
    presentacion: presentaciones.find(i => i.value === formData.id_presentacion_k)?.label || "",
    casa_comercial: casasComerciales.find(i => i.value === formData.id_casa_comercial)?.label || "",
    proveedor: proveedores.find(i => i.value === formData.id_proveedor_k)?.label || "",
    lote: formData.lote || "",
    lab_sas: valorLabSas,
    mes_registro: valorMesRegistro,
    ...camposVisibles.reduce((acc, campo) => {
      acc[campo] = datosFinales[campo] || "";
      return acc;
    }, {})
  }
};
 
if (typeof onNuevoRegistro === "function") {
  onNuevoRegistro(tirilla);
}
      setFormData({
        fecha_recepcion: "",
        temperatura_llegada: "",
        maximo: "",
        minimo: "",
        cantidad: "",
        salida: "",
        saldo: "",
        id_nombre_insumo: "",
        id_presentacion_k: "",
        id_casa_comercial: "",
        id_proveedor_k: "",
        lote: "",
        fecha_vencimiento: "",
        registro_invima: "",
        expediente_invima: "",
        estado_revision: "",
        temperatura_almacenamiento: "",
        id_clasificacion_riesgo: "",
        principio_activo: "",
        forma_farmaceutica: "",
        concentracion: "",
        unidad_medida: "",
        fecha_salida: "",
        fecha_inicio: "",
        fecha_terminacion: "",
        area: "",
        factura: "",
        costo_general: "",
        costo_caja: "",
        costo_prueba: "",
        iva: "",
        consumible: "",
      });

      //mostrar mensaje en la página
      setMensaje("Formulario enviado correctamenmte!")

    } catch (err) {
      console.error("Error inesperado:", err);
      
      setMensaje("Ocurrió un error inesperado al enviar el formulario.");
   
    }
  };
  
return (
  <div className="kardex-container">
    {mensaje && <div className="mensaje">{mensaje}</div>}
    <h2 className="kardex-title">Registrar Kardex</h2>

    {/* 🔹 Botón cerrar */}
    <div className="btn-cerrar">
      <button
        type="button"
        onClick={onBack}
        style={{ fontSize: "18px", cursor: "pointer" }}
      >
        ← Cerrar
      </button>
    </div>

    <form onSubmit={handleSubmit} className="kardex-form">
      {camposVisibles.map((key) => (
        <div key={key} className="form-group">
          <label>{key.replaceAll("_", " ")}</label>
          
          {key === "id_nombre_insumo" ? (
            <CreatableSelect
              isClearable
              options={insumos}
              onChange={makeHandler("id_nombre_insumo")}
              placeholder="Escribe o selecciona un insumo"
              value={
                formData.id_nombre_insumo
                  ? insumos.find((i) => i.value === formData.id_nombre_insumo) || {
                      value: formData.id_nombre_insumo,
                      label: formData.id_nombre_insumo,
                    }
                  : null
              }
            />
          ) : key === "id_presentacion_k" ? (
            <CreatableSelect
              isClearable
              options={presentaciones}
              onChange={makeHandler("id_presentacion_k")}
              placeholder="Escribe o selecciona una presentación"
              value={
                formData.id_presentacion_k
                  ? presentaciones.find((i) => i.value === formData.id_presentacion_k) || {
                      value: formData.id_presentacion_k,
                      label: formData.id_presentacion_k,
                    }
                  : null
              }
            />
          ) : key === "id_casa_comercial" ? (
            <CreatableSelect
              isClearable
              options={casasComerciales}
              onChange={makeHandler("id_casa_comercial")}
              placeholder="Escribe o selecciona una casa comercial"
              value={
                formData.id_casa_comercial
                  ? casasComerciales.find((i) => i.value === formData.id_casa_comercial) || {
                      value: formData.id_casa_comercial,
                      label: formData.id_casa_comercial,
                    }
                  : null
              }
            />
          ) : key === "id_proveedor_k" ? (
            <CreatableSelect
              isClearable
              options={proveedores}
              onChange={makeHandler("id_proveedor_k")}
              placeholder="Escribe o selecciona un proveedor"
              value={
                formData.id_proveedor_k
                  ? proveedores.find((i) => i.value === formData.id_proveedor_k) || {
                      value: formData.id_proveedor_k,
                      label: formData.id_proveedor_k,
                    }
                  : null
              }
            />
          ) : key === "id_clasificacion_riesgo" ? (
            <>
              <CreatableSelect
                isClearable
                options={clasificaciones}
                onChange={makeHandler("id_clasificacion_riesgo")}
                placeholder="Escribe o selecciona una clasificación"
                value={
                  formData.id_clasificacion_riesgo
                    ? clasificaciones.find((i) => i.value === formData.id_clasificacion_riesgo) || {
                        value: formData.id_clasificacion_riesgo,
                        label: formData.id_clasificacion_riesgo,
                      }
                    : null
                }
              />
              {/* 🔗 Link fijo a clasificación de riesgo */}
              <a
                href="https://www.invima.gov.co/riesgos"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver clasificación de riesgo en INVIMA
              </a>
            </>
          ) : key === "expediente_invima" ? (
            <>
              <input
                type="text"
                name={key}
                value={formData[key] || ""}
                onChange={handleChange}
              />
              {/* 🔗 Link fijo a consulta INVIMA */}
              <a
                href="https://consultaregistro.invima.gov.co/Consultas/consultas/consreg_encabcum.jsp"
                target="_blank"
                rel="noopener noreferrer"
              >
                Consultar expediente en INVIMA
              </a>
            </>
          ) : ["fecha_recepcion", "fecha_vencimiento", "fecha_salida", "fecha_inicio", "fecha_terminacion"].includes(key) ? (
            <input
              type="date"
              name={key}
              value={formData[key] || ""}
              onChange={handleChange}
            />
          ) : (
            <input
              type="text"
              name={key}
              value={formData[key] || ""}
              onChange={handleChange}
            />
          )}
        </div>
      ))}
      <div className="kardex-button">
        <button type="submit">Guardar</button>
      </div>
    </form>
  </div>
);

}