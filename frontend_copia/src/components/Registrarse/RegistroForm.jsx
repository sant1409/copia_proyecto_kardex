/**
 * 🧾 Registro.jsx
 *
 * Componente de registro y verificación de usuario.
 */

import './RegistroForm.css';
import { useState, useEffect } from "react";

export default function Registro() {

  const [correo, setCorreo] = useState("");
  const [nombre, setNombre] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [id_sede, setId_sede] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [paso, setPaso] = useState("registro"); 
  const [codigo, setCodigo] = useState(""); 
  const [sedes, setSedes] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/sede`)
      .then(res => res.json())
      .then(data => setSedes(data))
      .catch(err => console.error(err));

  }, []);

  const handleSubmitRegistro = async (e) => {
    e.preventDefault();

    if (!correo || !nombre || !contraseña || !id_sede) {
      setMensaje("Todos los campos son obligatorios");
      return;
    }

    if (contraseña.length < 6) {
      setMensaje("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/registrarse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, nombre, contraseña, id_sede }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje(data.message || "Usuario registrado, revisa tu correo");
        setPaso("verificar");
      } else {
        setMensaje(data.error || "Error al registrarse");
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error de conexión con el servidor");
    }
  };

  const handleSubmitVerificacion = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/verificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, codigo }),
      });

      const data = await res.json();
      if (res.ok) {
        setMensaje("Cuenta verificada correctamente");
        setPaso("verificado");
      } else {
        setMensaje(data.error || "Código incorrecto");
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error de conexión con el servidor");
    }
  };

  const reenviarCodigo = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/reenviar_codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje("Código reenviado al correo");
      } else {
        setMensaje(data.error || "No se pudo reenviar el código");
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error de conexión con el servidor");
    }
  };


  return (
    <div>

      {/* 🟦 PASO 1: REGISTRO */}
      {paso === "registro" && (
        <div className="registrarse-container">
          <form className="registro-form" onSubmit={handleSubmitRegistro}>
            <h2>Registro de usuario</h2>

            <input
              type="email"
              placeholder="Correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />

            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
            />

            <select value={id_sede} onChange={e => setId_sede(e.target.value)}>
              <option value="">Selecciona tu sede</option>
              {sedes.map(sede => (
                <option key={sede.id_sede} value={sede.id_sede}>
                  {sede.nombre}
                </option>
              ))}
            </select>

            {mensaje && <p className="mensaje">{mensaje}</p>}

            <button type="submit">Registrarse</button>
          </form>
        </div>
      )}


      {/* 🟩 PASO 2: VERIFICAR */}
      {paso === "verificar" && (
        <div className="registrarse-container">
          <form className="registro-form" onSubmit={handleSubmitVerificacion}>
            <h2>Verificar correo</h2>

            <input
              type="text"
              placeholder="Código de verificación"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />

            {mensaje && <p className="mensaje">{mensaje}</p>}

            <button type="submit">Verificar</button>

            {/* 🔁 Reenviar código SOLO AQUÍ */}
            <button 
              type="button" 
              onClick={reenviarCodigo}
              style={{ marginTop: "10px" }}
            >
              Reenviar código
            </button>
          </form>
        </div>
      )}


      {/* 🟨 PASO 3: VERIFICADO */}
      {paso === "verificado" && (
        <div className="registro-form">
          <p>¡Registro completo!</p>
        </div>
      )}

    </div>
  );
}
