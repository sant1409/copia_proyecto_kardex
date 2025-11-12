/**
 * 🔐 Landing.jsx
 * 
 * Página de autenticación inicial del sistema.
 * Permite alternar entre los formularios de inicio de sesión y registro.
 * 
 * - Usa AuthLayout para el diseño general.
 * - Cambia la vista con botones que alternan entre "login" y "registro".
 */


import { useState } from "react";
import IniciarSesionForm from "../../components/IniciarSesion/IniciarSesionForm";
import Registro from "../../components/Registrarse/RegistroForm";
import AuthLayout from "../../layouts/AuthLayout";
import './Landing.css';

export default function AuthPage() {
  const [vista, setVista] = useState("login"); // "login" o "registro"

  return (
    <AuthLayout>
      <div className="botones-landing">
        <button
          className={vista === "login" ? "activo" : ""}
          onClick={() => setVista("login")}
        >
          Iniciar sesión
        </button>
        <button
          className={vista === "registro" ? "activo" : ""}
          onClick={() => setVista("registro")}
        >
          Registrarse
        </button>
      </div>

      <div className="formularios-landing">
        {vista === "login" ? <IniciarSesionForm /> : <Registro />}
      </div>
    </AuthLayout>
  );
}
