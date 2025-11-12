// 🔹 Importación del formulario de inicio de sesión
import IniciarSesionForm from "../../components/IniciarSesion/IniciarSesionForm.jsx";
// 🔹 Importación del layout de autenticación (estructura visual para páginas de login/registro)
import AuthLayout from "../../layouts/AuthLayout";



// 🔹 Página principal de inicio de sesión
// Envuelve el formulario dentro del AuthLayout para mantener el diseño uniforme.
export default function IniciarSesionPage() {
    return (
        <div className="iniciarsesion-page">
           <AuthLayout>
      <IniciarSesionForm />
    </AuthLayout>
        </div>
    );
}