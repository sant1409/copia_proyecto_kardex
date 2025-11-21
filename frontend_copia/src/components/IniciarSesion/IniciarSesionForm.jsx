/**
 * 🔐 IniciarSesionForm.jsx
 * 
 * Formulario principal de inicio de sesión.
 * Permite:
 *  - Autenticar usuario y guardar token en localStorage.
 *  - Recuperar y restablecer contraseña por correo y código.
 *  - Redirigir al dashboard tras un inicio exitoso.
 * 
 * Usa useState y useNavigate (React Router) para manejar el flujo.
 */


import { useState } from "react";
import './IniciarSesionForm.css';
import { useNavigate } from "react-router-dom";

export default function IniciarSesionForm() {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [paso, setPaso] = useState("iniciar_sesion");
  const [codigo, setCodigo] = useState("");
  const [nuevaContraseña, setNuevaContraseña] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!correo || !contraseña) {
      setMensaje("Todos los campos son obligatorios");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/iniciar_sesion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, contraseña })
      });

      const data = await res.json();
      if (res.ok) {
        // Guarda el token
        localStorage.setItem("token", data.token);

        setMensaje("Inicio de sesión exitoso ✅");

        // Llama a la ruta protegida para obtener los datos del usuario
        const perfilRes = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/sesion`, {
          headers: {
            "Authorization": `Bearer ${data.token}`
          }
        });

        const perfil = await perfilRes.json();
        if (perfilRes.ok) {
          localStorage.setItem("usuario", JSON.stringify(perfil.usuario));
          localStorage.setItem("id_sede", perfil.usuario.id_sede);

        }

        // Redirigir al dashboard
        navigate("/dashboard");
        setCorreo("");
        setContraseña("");
      } else {
        setMensaje(data.error || data.mensaje || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error de conexión con el servidor");
    }
  };

  // --- Las funciones de recuperación de contraseña no cambian ---
  const handleSubmitRecuperarClave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/resetear_clave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, nuevaContraseña })
      });

      const data = await res.json();
      if (res.ok) {
        setMensaje("Contraseña modificada correctamente");
        setPaso("iniciar_sesion");
      } else {
        setMensaje(data.error || "Código incorrecto");
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error de conexión con el servidor");
    }
  };

  const handleSubmitCorreo = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/recuperar_clave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo })
      });

      const data = await res.json();
      if (res.ok) {
        setMensaje("El correo se envió correctamente");
        setPaso("codigo");
      } else {
        setMensaje(data.error || "Correo incorrecto");
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error de conexión con el servidor");
    }
  };

  const handleSubmitCodigo = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/verificar_codigo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, codigo })
      });

      const data = await res.json();
      if (res.ok) {
        setMensaje("Código verificado, ahora escribe tu nueva contraseña");
        setPaso("nuevaclave");
      } else {
        setMensaje(data.error || "Código incorrecto");
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error de conexión con el servidor");
    }
  };

  return (
    <div>
      {paso === "iniciar_sesion" && (
        <div className="iniciarsesion-container">
          <form className="iniciarsesion-form" onSubmit={handleSubmit}>
            <h2>Iniciar Sesión</h2>
            <input
              type="email"
              placeholder="Correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
            />

            <p
              className="olvidaste"
              onClick={() => setPaso("correo")}
            >
              ¿Olvidaste tu contraseña?
            </p>

            {mensaje && <p className="mensaje">{mensaje}</p>}
            <button type="submit">Iniciar Sesión</button>
          </form>
        </div>
      )}

      {mensaje === "Cuenta no verificada" && (
        <div style={{ marginTop: "10px" }}>
          <p>¿No recibiste el código?</p>

          <button
            type="button"
            onClick={async () => {
              const res = await fetch(`${import.meta.env.VITE_API_URL}/usuarios/reenviar_codigo`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo }),
              });

              const data = await res.json();
              setMensaje(data.mensaje || data.error);
            }}
          >
            Reenviar código
          </button>
        </div>
      )}


      {paso === "correo" && (
        <div className="iniciarsesion-container">
          <form className="iniciarsesion-form" onSubmit={handleSubmitCorreo}>
            <h2>Recuperar contraseña</h2>
            <input
              type="email"
              placeholder="Escribe tu correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
            {mensaje && <p className="mensaje">{mensaje}</p>}
            <button type="submit">Enviar código</button>
          </form>
        </div>
      )}

      {paso === "codigo" && (
        <div className="iniciarsesion-container">
          <form className="iniciarsesion-form" onSubmit={handleSubmitCodigo}>
            <h2>Verificar código</h2>
            <input
              type="text"
              placeholder="Código enviado a tu correo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
            {mensaje && <p className="mensaje">{mensaje}</p>}
            <button type="submit">Verificar</button>
          </form>
        </div>
      )}

      {paso === "nuevaclave" && (
        <div className="iniciarsesion-container">
          <form className="iniciarsesion-form" onSubmit={handleSubmitRecuperarClave}>
            <h2>Nueva contraseña</h2>
            <input
              type="password"
              placeholder="Escribe tu nueva contraseña"
              value={nuevaContraseña}
              onChange={(e) => setNuevaContraseña(e.target.value)}
            />
            {mensaje && <p className="mensaje">{mensaje}</p>}
            <button type="submit">Cambiar contraseña</button>
          </form>
        </div>
      )}
    </div>
  );
}
