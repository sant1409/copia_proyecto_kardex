/**
 * 📝 RegistroPage.jsx
 * 
 * Página que muestra el formulario de registro de usuarios.
 * Usa AuthLayout para aplicar el diseño general de autenticación.
 */

import RegistroForm from "../../components/Registrarse/RegistroForm";
import AuthLayout from "../../layouts/AuthLayout";

// 📄 Componente principal de la página de registro
export default function RegistroPage() {
  return (
    <div className="registro-page">
      {/* Envuelve el formulario en el layout de autenticación */}
      <AuthLayout>
        {/* Formulario de registro de usuario */}
        <RegistroForm />
      </AuthLayout>
    </div>
  );
}
