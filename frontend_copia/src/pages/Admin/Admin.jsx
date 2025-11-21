/**
 * 🧩 Admin.jsx
 *
 * Panel principal del administrador del sistema.
 *
 * 🔹 Funcionalidad:
 *  - Verifica la clave de acceso de administrador.
 *  - Permite gestionar múltiples entidades del sistema:
 *      • Categorías
 *      • Suscripciones de notificaciones
 *      • Casas comerciales
 *      • Clasificaciones de insumos y reactivos
 *      • Laboratorios
 *      • Nombres de insumos y reactivos
 *      • Presentaciones
 *      • Proveedores
 *      • Auditorías del sistema
 *  - Implementa operaciones CRUD (crear, leer, actualizar, eliminar) para cada sección.
 *  - Permite limpiar registros antiguos de auditorías.
 *  - Usa autenticación mediante token almacenado en localStorage.
 *
 * 🔹 Hooks:
 *  - useState → manejo de estados de formularios y listas.
 *  - useEffect → carga inicial de datos tras autenticación.
 *  - useNavigate → navegación entre vistas.
 *
 * 🔹 Backend:
 *  - Conecta con una API Node.js/Express en `localhost:3000`.
 *  - Cada endpoint protegido con token JWT.
 */


import { useState, useEffect } from "react";
import "./Admin.css";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [clave, setClave] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [modoAdmin, setModoAdmin] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Estados Categorías
  const [categorias, setCategorias] = useState([]);
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [editando, setEditando] = useState(null);

  // Estados Suscripción Notificaciones
  const [suscripciones, setSuscripciones] = useState([]);
  const [correo, setCorreo] = useState("");
  const [editandoSus, setEditandoSus] = useState(null);

  // Estados Casa Comercial
const [casa, setCasa] = useState([]);

  // Estados Clasificación de reactivos
const [clasifir, setClasificacionR] = useState([]);

  // Estados Clasificación de insumos
const [clasifInsumo, setClasificacionInsumo] = useState([]);

// Estados Laboratorio
const [laboratorios, setLaboratorios] = useState([]);

// Estados Nombre del Insumo
const [nombreInsumos, setNombreInsumos] = useState([]);

// Estados Nombre Insumo (Reactivos)
const [nombreReactivos, setNombreReactivos] = useState([]);

// Estados Presentación (Insumos)
const [presentaciones, setPresentaciones] = useState([]);

// Estados Presentación (Reactivos)
const [presentacionesK, setPresentacionesK] = useState([]);

// Estados Proveedor (Insumos)
const [proveedores, setProveedores] = useState([]);

// Estados Proveedor (Reactivos)
const [proveedoresK, setProveedoresK] = useState([]);

  // Auditorías
  const [opcionLimpieza, setOpcionLimpieza] = useState("tres_meses");
  const [limpiando, setLimpiando] = useState(false);
  const [auditoria, setAuditoria] = useState([]);
  

  const navigate = useNavigate();
  const handleVolver = () => navigate(-1);

  // ✅ Verificar clave de administrador
  const verificarClave = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/verificar-admin`,{ 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ clave }),
      });
      const data = await res.json();
      if (data.acceso) {
        setMensaje(`✅ ${data.mensaje}`);
        setModoAdmin(true);
        localStorage.setItem("modoAdmin", "true");
        obtenerCategorias();  obtenerSuscripciones(); obtenerCasaComercial(); obtenerClasificacionR(); obtenerClasificacionInsumo();
        obtenerLaboratorios(); obtenerNombreInsumos(); obtenerNombreReactivos(); obtenerPresentaciones(); obtenerPresentacionesK();
        obtenerProveedores(); obtenerProveedoresK(); obtenerAuditorias();
      } else setMensaje("❌ Clave incorrecta");
    } catch {
      setMensaje("Error al verificar la clave");
    } finally {
      setCargando(false);
    }
  };
  

  // === CRUD Categorías ===
  const obtenerCategorias = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/categoria`,{
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setCategorias(await res.json());
    } catch (err) {
      console.error("Error categorías:", err);
    }
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    try {
      const metodo = editando ? "PUT" : "POST";
      const url = editando
     ? `${import.meta.env.VITE_API_URL}/categoria/${editando}`
     : `${import.meta.env.VITE_API_URL}/categoria`;

      const res = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ nombre: nombreCategoria }),
      });
      const data = await res.json();
      setMensaje(data.message || "Operación realizada");
      setNombreCategoria("");
      setEditando(null);
      obtenerCategorias();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const eliminarCategoria = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta categoría?")) return;
    await fetch(`${import.meta.env.VITE_API_URL}/categoria/${id}`,{ 
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    obtenerCategorias();
  };

  // === CRUD Suscripciones ===
  const obtenerSuscripciones = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/suscripcion_notificaciones`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setSuscripciones(await res.json());
    } catch (err) {
      console.error("Error suscripciones:", err);
    }
  };

  const manejarEnvioSuscripcion = async (e) => {
    e.preventDefault();
    try {
      const metodo = editandoSus ? "PUT" : "POST";
      const url = editandoSus
        ? `${import.meta.env.VITE_API_URL}/suscripcion_notificaciones/${editandoSus}`
        : `${import.meta.env.VITE_API_URL}/suscripcion_notificaciones`;

      const res = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ correo }),
      });
      await res.json();
      setCorreo("");
      setEditandoSus(null);
      obtenerSuscripciones();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const eliminarSuscripcion = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este correo?")) return;
    await fetch(`${import.meta.env.VITE_API_URL}/suscripcion_notificaciones/${id}`,{
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    obtenerSuscripciones();
  };

  //Obtener casa
const obtenerCasaComercial = async () => {
  try {const res = await  fetch(`${import.meta.env.VITE_API_URL}/casa_comercial`,{
       headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setCasa(await res.json());
  } catch (err) {
    console.error("Error casa comercial:", err);
  }
};

//Eliminar casa
const eliminarCasa = async (id) => {if (!window.confirm("¿Seguro que deseas eliminar esta casa comercial?"))
    return;
  await fetch(`${import.meta.env.VITE_API_URL}/casa_comercial/${id}`,{
    method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
     obtenerCasaComercial();
};

  // clasificacion de reactivo
  const obtenerClasificacionR = async () => {
    try {const res = await fetch(`${import.meta.env.VITE_API_URL}/clasificacion_riesgo`,{
        headers: {Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setClasificacionR(await res.json());
    } catch (err) {
      console.error("Error en la clasificación de los reactivos:", err);
    }
  };
  

   //Eliminar clasificacion de reactivos
  const eliminarClasifir = async (id) => { if (!window.confirm("¿Seguro que deseas eliminar la clasificación?"))
     return;
    await fetch(`${import.meta.env.VITE_API_URL}/clasificacion_riesgo/${id}`,{
     method: "DELETE", headers: {Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    obtenerClasificacionR();
  };


  //  Clasificación de insumos
const obtenerClasificacionInsumo = async () => {
  try { const res = await fetch(`${import.meta.env.VITE_API_URL}/clasificacion`,{
      headers: {Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setClasificacionInsumo(await res.json());
  } catch (err) {
    console.error("Error en la clasificación de los insumos:", err);
  }
};


 //Clasificacion de insumos
const eliminarClasifInsumo = async (id) => {
  if (!window.confirm("¿Seguro que deseas eliminar la clasificación?")) return;
  await fetch(`${import.meta.env.VITE_API_URL}/clasificacion/${id}`,{
    method: "DELETE", headers: {  Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  obtenerClasificacionInsumo();
};


 //Laboratorio es de insumos 
const obtenerLaboratorios = async () => {
  try {const res = await fetch(`${import.meta.env.VITE_API_URL}/laboratorio`,{
      headers: {Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setLaboratorios(await res.json());
  } catch (err) {
    console.error("Error al obtener laboratorios:", err);
  }
};
  

// eliminar laboratorio
const eliminarLaboratorio = async (id) => {
  if (!window.confirm("¿Seguro que deseas eliminar este laboratorio?")) return;
  await fetch(`${import.meta.env.VITE_API_URL}/laboratorio/${id}`,{
    method: "DELETE",headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  obtenerLaboratorios();
};

   //Nombre del Insumo 
const obtenerNombreInsumos = async () => {
  try {const res = await fetch(`${import.meta.env.VITE_API_URL}/nombre_del_insumo`,{
      headers: {Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setNombreInsumos(await res.json());
  } catch (err) {
    console.error("Error al obtener nombres de insumos:", err);
  }
};
  
   //Eliminar insumo
const eliminarNombreInsumo = async (id) => {
  if (!window.confirm("¿Seguro que deseas eliminar este nombre de insumo?")) return;
  await fetch(`${import.meta.env.VITE_API_URL}/nombre_del_insumo/${id}`,{
    method: "DELETE",headers: {Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  obtenerNombreInsumos();
};

  // Nombre Insumo Reactivos
const obtenerNombreReactivos = async () => {
  try {const res = await fetch(`${import.meta.env.VITE_API_URL}/nombre_insumo`,{
      headers: {Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setNombreReactivos(await res.json());
  } catch (err) {
    console.error("Error al obtener nombres de reactivos:", err);
  }
};
    
 // ¿Eliminar reactivo
const eliminarNombreReactivo = async (id) => {
  if (!window.confirm("¿Seguro que deseas eliminar este nombre de reactivo?"))
    return;
  await fetch(`${import.meta.env.VITE_API_URL}/nombre_insumo/${id}`,{
    method: "DELETE", headers: {Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  obtenerNombreReactivos();
};

// === Presentación (Insumos) ===
const obtenerPresentaciones = async () => {
  try {const res = await fetch(`${import.meta.env.VITE_API_URL}/presentacion`,{
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setPresentaciones(await res.json());
  } catch (err) {
    console.error("Error al obtener presentaciones de insumos:", err);
  }
};
    
    //Eliminar presentacion insumos
const eliminarPresentacion = async (id) => {
  if (!window.confirm("¿Seguro que deseas eliminar la presentación?")) return;
  await fetch(`${import.meta.env.VITE_API_URL}/presentacion/${id}`,{
    method: "DELETE",headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  obtenerPresentaciones();
};

  //Presentación de reactivos
const obtenerPresentacionesK = async () => {
  try {const res = await fetch(`${import.meta.env.VITE_API_URL}/presentacion_k`,{
      headers: {Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setPresentacionesK(await res.json());
  } catch (err) {
    console.error("Error al obtener presentaciones de reactivos:", err);
  }
};
 

//Eliminar presentacion de reactivos
const eliminarPresentacionK = async (id) => {
  if (!window.confirm("¿Seguro que deseas eliminar la presentación de reactivos?")) return;
  await fetch(`${import.meta.env.VITE_API_URL}/presentacion_k/${id}`,{
    method: "DELETE", headers: {Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
   obtenerPresentacionesK();
};
   
   //Proveedor de insumos
const obtenerProveedores = async () => {
  try {const res = await fetch(`${import.meta.env.VITE_API_URL}/proveedor`,{
      headers: {Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setProveedores(await res.json());
  } catch (err) {
    console.error("Error al obtener proveedores:", err);
  }
};
 

//Eliminar proveedor de insumos
const eliminarProveedor = async (id) => {
  if (!window.confirm("¿Seguro que deseas eliminar este proveedor?")) return;
  try { await fetch(`${import.meta.env.VITE_API_URL}/proveedor/${id}`,{
      method: "DELETE",headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    obtenerProveedores();
  } catch (err) {
    console.error("Error al eliminar proveedor de reactivos:", err);
  }
};


   // === Proveedor de reactivos
const obtenerProveedoresK = async () => {
  try {const res = await fetch(`${import.meta.env.VITE_API_URL}/proveedor_k`,{
      headers: {Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setProveedoresK(await res.json());
  } catch (err) {
    console.error("Error al obtener proveedores de reactivos:", err);
  }
};
   

//Eliminar proveedor de reactivos 
const eliminarProveedorK = async (id) => {
  if (!window.confirm("¿Seguro que deseas eliminar este proveedor?")) return;
  try { await fetch(`${import.meta.env.VITE_API_URL}/proveedor_k/${id}`,{
      method: "DELETE",headers: { Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    obtenerProveedoresK();
  } catch (err) {
    console.error("Error al eliminar proveedor de reactivos:", err);
  }
};

  // === Auditorías ===
  const limpiarAuditorias = async () => {
    if (!window.confirm("¿Seguro que quieres limpiar las auditorías seleccionadas?"))
      return;
    setLimpiando(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auditoria/limpiar`,{
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ opcion: opcionLimpieza }),
      });
      const data = await res.json();
      alert(data.mensaje || "Auditorías limpiadas correctamente.");
    } catch (err) {
      alert("Error al limpiar auditorías");
      console.error("Error:", err);
    } finally {
      setLimpiando(false);
    }
  };

  const obtenerAuditorias = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auditoria`,{
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setAuditoria(await res.json());
    } catch (err) {
      console.error("Error auditorías:", err);
    }
  };

  // === Render ===
  if (!modoAdmin) {
    return (
      <div className="admin-container">
        <form className="admin-form" onSubmit={verificarClave}>
          <h2>Acceso Administrador</h2>
          <input
            type="password"
            placeholder="Ingrese clave"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
          />
          <button type="submit" disabled={cargando}>
            {cargando ? "Verificando..." : "Entrar"}
          </button>
          {mensaje && (
            <p className={`mensaje ${mensaje.includes("❌") ? "error" : "exito"}`}>
              {mensaje}
            </p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="panel-admin">
      <button className="btn-volver" onClick={handleVolver}>
        ← Volver
      </button>
      <h1>Bienvenido al Centro de Administrador</h1>

      {/* === Categorías === */}
      <form className="formulario" onSubmit={manejarEnvio}>
        <h3>{editando ? "Actualizar Categoría" : "Crear Categoría"}</h3>
        <input
          type="text"
          placeholder="Nombre de la categoría"
          value={nombreCategoria}
          onChange={(e) => setNombreCategoria(e.target.value)}
          required
        />
        <button type="submit">{editando ? "Actualizar" : "Crear"}</button>
        {editando && (
          <button
            type="button"
            className="cancelar"
            onClick={() => {
              setEditando(null);
              setNombreCategoria("");
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      <h3>📋 Categorías existentes</h3>
      <ul className="lista">
        {categorias.length > 0 ? (
          categorias.map((cat) => (
            <li key={cat.id_categoria}>
              <span>{cat.categoria}</span>
              <div>
                <button
                  onClick={() => {
                    setEditando(cat.id_categoria);
                    setNombreCategoria(cat.categoria);
                  }}
                >
                  ✏️
                </button>
                <button
                  className="eliminar"
                  onClick={() => eliminarCategoria(cat.id_categoria)}
                >
                  🗑️
                </button>
              </div>
            </li>
          ))
        ) : (
          <p>No hay categorías registradas.</p>
        )}
      </ul>

{/*Casa comercial */}
<h3>🏢 Casas comerciales existentes</h3>
<ul className="lista">
  {casa.length > 0 ? (casa.map((c) => {const nombreVisible = c.nombre || c.nombre_casa || Object.values(c)[1] || "Sin nombre";
      return (
        <li key={c.id_casa_comercial || c.id || Math.random()}>
          <span>{nombreVisible}</span>
          <div>
            <button
              className="eliminar"
              onClick={() => eliminarCasa(c.id_casa_comercial || c.id)}
            > 🗑️
            </button>
          </div>
        </li>
      );
    })
  ) : (
    <p>No hay casas comerciales registradas.</p>
  )}
</ul>

      {/* === Clasificación de reactivos === */}
      <h3>⚠️🧪 Clasificación de reactivos existentes</h3>
      <ul className="lista">
        {clasifir.length > 0 ? (clasifir.map((c) => {const nombreVisible =c.nombre || c.nombre_clasifir || Object.values(c)[1] || "Sin nombre";
            return (
              <li key={c.id_clasificacion_riesgo || c.id || Math.random()}>
                <span>{nombreVisible}</span>
                <div>
                  <button
                    className="eliminar"
                    onClick={() => eliminarClasifir(c.id_clasificacion_riesgo || c.id)
                    }
                  >🗑️
                  </button>
                </div>
              </li>
            );
          })
        ) : (
          <p>No hay clasificaciones registradas.</p>
        )}
      </ul>

      {/* Clasificación de insumos */}
   <h3>⚠️📦 Clasificación de insumos existentes</h3>
     <ul className="lista">
      {clasifInsumo.length > 0 ? ( clasifInsumo.map((c) => { const nombreVisible =  c.nombre || c.nombre_clasificacion || Object.values(c)[1] || "Sin nombre";
      return (
        <li key={c.id_clasificacion || c.id || Math.random()}>
          <span>{nombreVisible}</span>
          <div>
            <button
              className="eliminar"
              onClick={() => eliminarClasifInsumo(c.id_clasificacion || c.id)}
            > 🗑️
            </button>
          </div>
        </li>
      );
    })
  ) : (
    <p>No hay clasificaciones de insumos registradas.</p>
  )}
</ul>


    {/*  Laboratorios de insumos  */}
       <h3>🧫 Laboratorios existentes</h3>
         <ul className="lista">
             {laboratorios.length > 0 ? (laboratorios.map((l) => {const nombreVisible = l.nombre || l.nombre_laboratorio || Object.values(l)[1] || "Sin nombre";
         return (
        <li key={l.id_laboratorio || l.id || Math.random()}>
          <span>{nombreVisible}</span>
          <div>
            <button
              className="eliminar"
              onClick={() =>eliminarLaboratorio(l.id_laboratorio || l.id)
              }
            > 🗑️
            </button>
          </div>
        </li>
      );
    })
  ) : (
    <p>No hay laboratorios registrados.</p>
  )}
</ul>

       {/* Nombre del Insumo (Insumos) */}
       <h3>📦 Nombres de insumos existentes</h3>
       <ul className="lista">
        {nombreInsumos.length > 0 ? ( nombreInsumos.map((n) => {const nombreVisible = n.nombre_insumo || Object.values(n)[1] || "Sin nombre";
      return (
        <li key={n.id_nombre_del_insumo || n.id || Math.random()}>
          <span>{nombreVisible}</span>
          <div>
            <button
              className="eliminar"
              onClick={() =>eliminarNombreInsumo(n.id_nombre_del_insumo || n.id)
              }
            > 🗑️
            </button>
          </div>
        </li>
      );
    })
  ) : (
    <p>No hay nombres de insumos registrados.</p>
  )}
</ul>

   {/*Nombre Insumo (Reactivos) */}
     <h3>🧪 Nombres de reactivos existentes</h3>
     <ul className="lista">
      {nombreReactivos.length > 0 ? (nombreReactivos.map((n) => {const nombreVisible =n.nombre_insumo || Object.values(n)[1] || "Sin nombre";
      return (
        <li key={n.id_nombre_insumo || n.id || Math.random()}>
          <span>{nombreVisible}</span>
          <div>
            <button
              className="eliminar"
              onClick={() => eliminarNombreReactivo(n.id_nombre_insumo || n.id)
              }
            > 🗑️
            </button>
          </div>
        </li>
      );
    })
  ) : (
    <p>No hay nombres de reactivos registrados.</p>
  )}
</ul>

{/*Presentación (Insumos)  */}


<h3>📦 Presentaciones de insumos existentes</h3>
<ul className="lista">
  {presentaciones.length > 0 ? (presentaciones.map((p) => {const nombreVisible =p.nombre_presentacion || Object.values(p)[1] || "Sin nombre";
      return (
        <li key={p.id_presentacion || p.id || Math.random()}>
          <span>{nombreVisible}</span>
          <div>
            <button
              className="eliminar"
              onClick={() => eliminarPresentacion(p.id_presentacion || p.id)}
            > 🗑️
            </button>
          </div>
        </li>
      );
    })
  ) : (
    <p>No hay presentaciones registradas.</p>
  )}
</ul>
      
      {/*Presentación (Reactivos)*/}

   <h3>🧪 Presentaciones de reactivos existentes</h3>
      <ul className="lista">
       {presentacionesK.length > 0 ? (presentacionesK.map((p) => {const nombreVisible = p.nombre_presentacion || Object.values(p)[1] || "Sin nombre";
      return (
        <li key={p.id_presentacion_k || p.id || Math.random()}>
          <span>{nombreVisible}</span>
          <div>
            <button
              className="eliminar"
              onClick={() => eliminarPresentacionK(p.id_presentacion_k || p.id)}
            > 🗑️
            </button>
          </div>
        </li>
      );
    })
  ) : (
    <p>No hay presentaciones de reactivos registradas.</p>
  )}
</ul>
     
     {/* Proveedor (Insumos)*/}

    <h3>🏭 Proveedores de Insumos existentes</h3>
      <ul className="lista">
       {proveedores.length > 0 ? (proveedores.map((p) => {const nombreVisible =  p.nombre_proveedor || Object.values(p)[1] || "Sin nombre";
        return (
          <li key={p.id_proveedor || p.id || Math.random()}>
          <span>{nombreVisible}</span>
          <div>
            <button
              className="eliminar"
              onClick={() => eliminarProveedor(p.id_proveedor || p.id)}
            > 🗑️
            </button>
          </div>
        </li>
      );
    })
  ) : (
    <p>No hay proveedores registrados.</p>
  )}
</ul>
   
    {/*Proveedor (Reactivos)*/}
    <h3>🧪 Proveedores de Reactivos existentes</h3>
     <ul className="lista">
     {proveedoresK.length > 0 ? (proveedoresK.map((p) => {const nombreVisible = p.nombre_proveedor || Object.values(p)[1] || "Sin nombre";
      return (
        <li key={p.id_proveedor_k || p.id || Math.random()}>
          <span>{nombreVisible}</span>
          <div>
            <button
              className="eliminar"
              onClick={() => eliminarProveedorK(p.id_proveedor_k || p.id)}
            > 🗑️
            </button>
          </div>
        </li>
      );
    })
  ) : (
    <p>No hay proveedores registrados.</p>
  )}
</ul>

      {/* === Suscripciones === */}
      <form className="formulario" onSubmit={manejarEnvioSuscripcion}>
        <h3>{editandoSus ? "Actualizar Correo" : "Agregar Correo"}</h3>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
        />
        <button type="submit">{editandoSus ? "Actualizar" : "Crear"}</button>
        {editandoSus && (
          <button
            type="button"
            className="cancelar"
            onClick={() => {
              setEditandoSus(null);
              setCorreo("");
            }}
          >
            Cancelar
          </button>
        )}
      </form>

      <h3>📨 Correos suscritos</h3>
      <ul className="lista">
        {suscripciones.length > 0 ? (
          suscripciones.map((s) => (
            <li key={s.id_suscripcion_notificaciones}>
              <span>{s.correo}</span>
              <div>
                <button
                  onClick={() => {
                    setEditandoSus(s.id_suscripcion_notificaciones);
                    setCorreo(s.correo);
                  }}
                >
                  ✏️
                </button>
                <button
                  className="eliminar"
                  onClick={() => eliminarSuscripcion(s.id_suscripcion_notificaciones)}
                >
                  🗑️
                </button>
              </div>
            </li>
          ))
        ) : (
          <p>No hay correos registrados.</p>
        )}
      </ul>

      {/* === Auditorías === */}
      <div className="bloque-limpieza">
        <h3>🧹 Limpieza de Auditorías</h3>
        <select
          value={opcionLimpieza}
          onChange={(e) => setOpcionLimpieza(e.target.value)}
        >
          <option value="este_mes">Eliminar las que no sean de este mes</option>
          <option value="tres_meses">Eliminar mayores a 3 meses</option>
          <option value="todas">Eliminar todas</option>
        </select>
        <button
          className="btn-limpiar"
          onClick={limpiarAuditorias}
          disabled={limpiando}
        >
          {limpiando ? "Eliminando..." : "Ejecutar limpieza"}
        </button>
      </div>

      <h3>🔍 Auditorías registradas</h3>
      <ul className="lista">
        {auditoria.length > 0 ? (
          auditoria.map((au) => (
            <li key={au.id_auditoria}>
              <div style={{ flex: 1 }}>
                <strong>{au.entidad_afectada}</strong> — {au.accion}
                <p style={{ fontSize: "13px", marginTop: "4px", color: "#555" }}>
                  {au.detalle_adicional}
                </p>
                <p style={{ fontSize: "12px", color: "#777", marginTop: "2px" }}>
                  🧍‍♂️ {au.nombre_responsable} | 🕒{" "}
                  {new Date(au.fecha_hora).toLocaleString()} | 🏢 Sede {au.id_sede}
                </p>
              </div>
            </li>
          ))
        ) : (
          <p>No hay auditorías registradas.</p>
        )}
      </ul>
      {mensaje && <p className="mensaje exito">{mensaje}</p>}
    </div>
  );
}
