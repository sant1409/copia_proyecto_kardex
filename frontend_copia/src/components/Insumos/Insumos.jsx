/**
 * 📦 Insumos.jsx
 * 
 * Formulario para registrar o editar insumos.
 * Carga datos desde la API (insumos, laboratorios, proveedores, etc.),
 * permite crear nuevos registros o actualizar existentes,
 * y envía los datos al backend con autenticación por token.
 */


import { useState, useEffect } from "react";
import CreatableSelect from "react-select/creatable";
import "./Insumos.css";


function formatDate(fecha) {
  if (!fecha) return "";
  return String(fecha).split("T")[0]; // YYYY-MM-DD
}

export default function Insumos({ preData, onBack, onNuevoRegistro }) {
  const [categorias, setCategorias] = useState([]);
  const valorMesRegistro = preData?.mes_registro || "";
  const [formData, setFormData] = useState({
    fecha: "",
    temperatura: "",
    cantidad: "",
    salida: "",
    saldo: "",
    id_nombre_del_insumo: "",
    id_presentacion: "",
    id_laboratorio: "",
    id_proveedor: "",
    lote: "",
    fecha_de_vto: "",
    registro_invima: "",
    expediente_invima: "",
    id_clasificacion: "",
    estado_de_revision: "",
    salida_fecha: "",
    inicio: "",
    termino: "",
    lab_sas: "",
    factura: "",
    costo_global: "",
    costo: "",
    costo_prueba: "",
    costo_unidad: "",
    iva: "",
    consumible: "",
 
  });

  const [insumos, setInsumos] = useState([]);
  const [presentaciones, setPresentaciones] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const camposVisibles = [
    "fecha", "temperatura", "cantidad", "salida", "saldo",
    "id_nombre_del_insumo", "id_presentacion", "id_laboratorio", "id_proveedor",
    "lote", "fecha_de_vto", "registro_invima", "expediente_invima",
    "id_clasificacion", "estado_de_revision", "salida_fecha",
    "inicio", "termino", "lab_sas", "factura", "costo_global",
    "costo", "costo_prueba", "costo_unidad", "iva", "consumible",
    "mes_registro", "categoria" 
  ];

  useEffect(() => {
  const cargarDatos = async () => {  
    try {
      const idSede = localStorage.getItem("id_sede");
      const token = localStorage.getItem("token");
      // 🔹 Insumos
      const insumosRes = await fetch(`http://localhost:3000/nombre_del_insumo?id_sede=${idSede}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const insumosData = await insumosRes.json();
      const insumosOpciones = insumosData.map(item => ({
        value: item.id_nombre_del_insumo,
        label: item.nombre_del_insumo 
      }));
      setInsumos(insumosOpciones);
      console.log("Insumos cargados:", insumosOpciones);

      // 🔹 Presentaciones
       const presentacionesRes = await fetch(`http://localhost:3000/presentacion?id_sede=${idSede}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const presentacionesData = await presentacionesRes.json();
      const presentacionesOpciones = presentacionesData.map(item => ({
        value: item.id_presentacion,
        label: item.presentacion
      }));
      setPresentaciones(presentacionesOpciones);

      // 🔹 Laboratorios
       const labsRes = await fetch(`http://localhost:3000/laboratorio?id_sede=${idSede}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const labsData = await labsRes.json();
      const labsOpciones = labsData.map(item => ({
        value: item.id_laboratorio,
        label: item.laboratorio
      }));
      setLaboratorios(labsOpciones);

      // 🔹 Proveedores
      const proveedoresRes = await fetch(`http://localhost:3000/proveedor?id_sede=${idSede}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const proveedoresData = await proveedoresRes.json();
      const proveedoresOpciones = proveedoresData.map(item => ({
        value: item.id_proveedor,
        label: item.nombre
      }));
      setProveedores(proveedoresOpciones);

      // 🔹 Clasificaciones
        const clasificacionesRes = await fetch(`http://localhost:3000/clasificacion?id_sede=${idSede}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const clasificacionesData = await clasificacionesRes.json();
      const clasificacionesOpciones = clasificacionesData.map(item => ({
        value: item.id_clasificacion,
        label: item.clasificacion
      }));
      setClasificaciones(clasificacionesOpciones);

      // 🔹 Categorías
      const categoriasRes = await fetch(`http://localhost:3000/categoria?id_sede=${idSede}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const categoriasData = await categoriasRes.json();
      const categoriasOpciones = categoriasData.map(item => ({
        value: item.id_categoria,
        label: item.categoria
      }));
      setCategorias(categoriasOpciones);

      // 🔹 Si estamos en modo editar (preData trae id_insumo), precargamos SOLO los campos del form
      if (preData && preData.id_insumo) {
        console.log("preData recibido (editar):", preData);

        // resolver ids para selects (si existen labels en preData)
        const valorNombreInsumo = insumosOpciones.find(i => i.label === preData.nombre_del_insumo);
        const valorPresentacion = presentacionesOpciones.find(i => i.label === preData.presentacion);
        const valorLaboratorio = labsOpciones.find(i => i.label === preData.laboratorio);
        const valorProveedor = proveedoresOpciones.find(i => i.label === preData.proveedor);
        const valorClasificacion = clasificacionesOpciones.find(i => i.label === preData.clasificacion);

        // lista de keys que SI deben ir al form (evita repetir campos que trae el backend)
        const camposForm = [
          "fecha", "temperatura", "cantidad", "salida", "saldo",
          "id_nombre_del_insumo", "id_presentacion", "id_laboratorio", "id_proveedor",
          "lote", "fecha_de_vto", "registro_invima", "expediente_invima",
          "id_clasificacion", "estado_de_revision", "salida_fecha",
          "inicio", "termino", "lab_sas", "factura", "costo_global",
          "costo", "costo_prueba", "costo_unidad", "iva", "consumible"
        ];

        // construir el objeto filtrado con formato de fechas
        const filtrados = {};
        camposForm.forEach(key => {
          if (["fecha", "fecha_de_vto", "salida_fecha", "inicio", "termino"].includes(key)) {
            filtrados[key] = preData[key] ? formatDate(preData[key]) : "";
          } else {
            filtrados[key] = preData[key] ?? "";
          }
        });

        // sustituir los FK por los valores (ids) que resolvimos para los creatable selects
        filtrados.id_nombre_del_insumo = valorNombreInsumo ? valorNombreInsumo.value : (preData.id_nombre_del_insumo ?? "");
        filtrados.id_presentacion = valorPresentacion ? valorPresentacion.value : (preData.id_presentacion ?? "");
        filtrados.id_laboratorio = valorLaboratorio ? valorLaboratorio.value : (preData.id_laboratorio ?? "");
        filtrados.id_proveedor = valorProveedor ? valorProveedor.value : (preData.id_proveedor ?? "");
        filtrados.id_clasificacion = valorClasificacion ? valorClasificacion.value : (preData.id_clasificacion ?? "");
        // categoría viene del mini-form en preData.categoria (o puede venir como id_categoria)
        filtrados.id_categoria = preData?.categoria ?? preData?.id_categoria ?? "";

        console.log("formData precargado (filtrado):", filtrados);
        setFormData(filtrados);
      }

    } catch (err) {
      console.error("Error cargando datos en Insumos:", err);
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

     if (preData && preData.id_insumo) {
    const oldLab = String(preData.id_laboratorio ?? "");
    const oldInsumo = String(preData.id_nombre_del_insumo ?? "");
    const newLab = String(formData.id_laboratorio ?? "");
    const newInsumo = String(formData.id_nombre_del_insumo ?? "");

    if (newLab !== oldLab || newInsumo !== oldInsumo) {
      alert("⚠️ Sugerencia: cambiar Laboratorio o Nombre de Insumo puede causar inconsistencias. Se recomienda eliminar y crear un nuevo registro.");
      // ❌ Ojo: no ponemos return, dejamos que siga
    }
  }

       // Preguntar confirmación al usuario
  const confirmado = window.confirm("¿Estás seguro de que los datos son correctos y quieres crear el registro?");
  if (!confirmado) {
    return; // si cancela, no se manda nada
  }

   const idCat = formData.id_categoria || preData?.categoria || null;
   const nombreCat = categorias.find(c => c.value === idCat)?.label || "";
   const datosFinales = {
      ...formData,
      id_categoria: idCat,
      mes_registro: valorMesRegistro,
      usuarioId: idUsuarioLogueado,
      id_sede: idSede, 
      id_nombre_del_insumo: formData.id_nombre_del_insumo,
      id_presentacion: formData.id_presentacion,
      id_laboratorio: formData.id_laboratorio,
      id_proveedor: formData.id_proveedor,
      id_clasificacion: formData.id_clasificacion
    };

    try {
       // ✅ Si hay preData.id → actualizar, sino crear
      const url = preData && preData.id_insumo
        ? `http://localhost:3000/insumos/${preData.id_insumo}`
        : "http://localhost:3000/insumos";
      const metodo = preData && preData.id_insumo ? "PUT" : "POST";
         
      const res = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
         body: JSON.stringify(datosFinales)
});
        
      const data = await res.json();
      console.log("Respuesta completa del backend:", data);

      if (!res.ok) {
        console.error("Error del backend:", data);
        setMensaje("Error al enviar: " + (data.error || JSON.stringify(data)));
        return;
      }

      const tirilla = {
        detalle: {
           id_insumo: data.id_insumo || preData.id_insumo,
          nombre_del_insumo: insumos.find(i => i.value === formData.id_nombre_del_insumo)?.label || "",
          presentacion: presentaciones.find(i => i.value === formData.id_presentacion)?.label || "",
          laboratorio:laboratorios.find(i => i.value === formData.id_laboratorio)?.label || "",
          proveedor: proveedores.find(i => i.value === formData.id_proveedor)?.label || "",
          lote: formData.lote || "",
          categoria: nombreCat,
          mes_registro: valorMesRegistro,
          ...camposVisibles.reduce((acc, campo) => {
            acc[campo] = datosFinales[campo] ?? "";
            return acc;
          }, {})
        }
      };

      if (typeof onNuevoRegistro === "function") onNuevoRegistro(tirilla);

      setFormData({
        fecha: "",
        temperatura: "",
        cantidad: "",
        salida: "",
        saldo: "",
        id_nombre_del_insumo: "",
        id_presentacion: "",
        id_laboratorio: "",
        id_proveedor: "",
        lote: "",
        fecha_de_vto: "",
        registro_invima: "",
        expediente_invima: "",
        id_clasificacion: "",
        estado_de_revision: "",
        salida_fecha: "",
        inicio: "",
        termino: "",
        lab_sas: "",
        factura: "",
        costo_global: "",
        costo: "",
        costo_prueba: "",
        costo_unidad: "",
        iva: "",
        consumible: ""
      });

      //mostrar mensaje en la página
      setMensaje("¡Formulario de Insumos enviado correctamente!");
    } catch (err) {
      console.error("Error inesperado:", err);
      setMensaje("Ocurrió un error inesperado al enviar el formulario.");
    }
  };


  return (
    <div className="insumos-container">
      {mensaje && <div className="mensaje">{mensaje}</div>}
      <h2 className="insumos-title">Registrar Insumos</h2>

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

      <form onSubmit={handleSubmit} className="insumos-form">
        {Object.keys(formData).map((key) => {
          return (
            <div key={key} className="form-group">
              <label>{key.replaceAll("_", " ")}</label>


              

              {key === "id_nombre_del_insumo" ? (
                <CreatableSelect
                  isClearable
                  options={insumos}
                  onChange={makeHandler("id_nombre_del_insumo")}
                  placeholder="Escribe o selecciona un insumo"
                  value={
                    formData.id_nombre_del_insumo
                      ? insumos.find(i => i.value === formData.id_nombre_del_insumo) ||{ value: formData.id_nombre_del_insumo, label: formData.id_nombre_del_insumo }
                      : null
                  }
                />
              ) : key === "id_presentacion" ? (
                <CreatableSelect
                  isClearable
                  options={presentaciones}
                  onChange={makeHandler("id_presentacion")}
                  placeholder="Escribe o selecciona una presentación"
                  value={
                    formData.id_presentacion
                      ? presentaciones.find(i => i.value === formData.id_presentacion) ||
                        { value: formData.id_presentacion, label: formData.id_presentacion }
                      : null
                  }
                />
              ) : key === "id_laboratorio" ? (
                <CreatableSelect
                  isClearable
                  options={laboratorios}
                  onChange={makeHandler("id_laboratorio")}
                  placeholder="Escribe o selecciona un laboratorio"
                  value={
                    formData.id_laboratorio
                      ? laboratorios.find(i => i.value === formData.id_laboratorio) ||
                        { value: formData.id_laboratorio, label: formData.id_laboratorio }
                      : null
                  }
                />
              ) : key === "id_proveedor" ? (
                <CreatableSelect
                  isClearable
                  options={proveedores}
                  onChange={makeHandler("id_proveedor")}
                  placeholder="Escribe o selecciona un proveedor"
                  value={
                    formData.id_proveedor
                      ? proveedores.find(i => i.value === formData.id_proveedor) ||
                        { value: formData.id_proveedor, label: formData.id_proveedor }
                      : null
                  }
                />
              ) : key === "id_clasificacion" ? (
                   <>
                  <CreatableSelect
                     isClearable
                     options={clasificaciones}
                     onChange={makeHandler("id_clasificacion")}
                     placeholder="Escribe o selecciona una clasificación"
                     value={
                   formData.id_clasificacion
                   ? clasificaciones.find(i => i.value === formData.id_clasificacion) ||
                   { value: formData.id_clasificacion, label: formData.id_clasificacion }
                      : null
                  }

                />
                    {/* 🔗 Enlace debajo del select */}
                    <a
                     href="https://www.invima.gov.co/riesgos"
                     target="_blank"
                     rel="noopener noreferrer"
                  >
                     Ver clasificación de riesgo en INVIMA
                     </a>
                </>
                  
                  ) : key === "id_categoria" ? (
                    <>
                  <CreatableSelect
                    isClearable
                    options={categorias}
                    onChange={makeHandler("id_categoria")}
                    placeholder="Escribe o selecciona una categoría"
                    value={
                      formData.id_categoria
                        ? categorias.find(c => c.value === formData.id_categoria) ||
                            { value: formData.id_categoria, label: formData.id_categoria }
                              : null
                               }
                    />
                </>
              ) : key === "expediente_invima" ? (
                <>
                  <input
                    type="text"
                    name={key}
                    value={formData[key] || ""}
                    onChange={handleChange}
                  />
                  <a
                    href="https://consultaregistro.invima.gov.co/Consultas/consultas/consreg_encabcum.jsp"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Consultar expediente en INVIMA
                  </a>
                </>
              ) : ["fecha", 
                "fecha_de_vto", 
                "salida_fecha", 
                "inicio", 
                "termino",
              ].includes(key) ? (
                <input type="date" name={key} value={formData[key] || ""} onChange={handleChange} />
              ) : (
                <input type="text" name={key} value={formData[key] || ""} onChange={handleChange} />
              )}
            </div>
          );
        })}

        <div className="insumos-button">
          <button type="submit">Guardar</button>
        </div>
      </form>
    </div>
  );
}