//Permite poner una restriccion de que primero tiene que iniciar sesion para entrar al sistema inpidiendo que ingrese directamente con un link
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  // 🔒 Si hay token, deja entrar; si no, redirige al login
  return token ? children : <Navigate to="/iniciar-sesion" />;
}

export default ProtectedRoute;
