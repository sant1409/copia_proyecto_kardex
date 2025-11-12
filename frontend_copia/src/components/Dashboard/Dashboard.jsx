/**
 * 🧭 Dashboard.jsx
 * 
 * Componente principal del panel del sistema Kardex.
 * Verifica la sesión del usuario, maneja la navegación interna
 * y muestra el menú lateral con acceso a:
 *  - Perfil del usuario
 *  - Notificaciones
 *  - Links de casas comerciales
 *  - Panel de administración
 * 
 * Usa <Outlet /> para renderizar las rutas hijas (Kardex, Insumos, etc.)
 * y permite cerrar sesión eliminando el token y redirigiendo al login.
 */


import { useNavigate, Outlet } from "react-router-dom";
import './Dashboard.css';
import { useState, useEffect } from 'react';
import Perfil from "../../pages/Perfil/Perfil";
import HomeDashboard from "../../components/Dashboard/HomeDashboard";
import Notificaciones from "../Notificaciones/Notificaciones";
 import Links from "../Links/Links";


export default function Dashboard() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [notiAbierta, setNotiAbierta] = useState(false);
  const [linkAbierto, setLinkAbierto] = useState(false);

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const res = await fetch("http://localhost:3000/usuarios/sesion", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        });

        const data = await res.json();
        if (res.ok) {
          console.log("✅ Sesión activa:", data.usuario);
          setUsuario(data.usuario);
        } else {
          console.log("⚠️ No hay sesión activa");
          navigate("/iniciar-sesion");
        }
      } catch (error) {
        console.error("Error verificando sesión:", error);
        navigate("/iniciar-sesion");
      }
    };

    verificarSesion();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("id_sede");
    navigate("/iniciar-sesion");
  };

  return (
    <div className="Dashboard-container"> 
      <aside className="Dashboard">
        <h2>Menú</h2>
        <ul>
          <li className="perfil-item">
            <button
              className="perfil-button"
              onClick={() => setPerfilAbierto(!perfilAbierto)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/>
              </svg>
              Perfil
              <span className={`flecha ${perfilAbierto ? "abierto" : ""}`}>▼</span>
            </button>
            {perfilAbierto && (
              <div className="perfil-info">
                <Perfil />
              </div>
            )}
          </li>

          <button 
            className="btn-notificaciones" 
            onClick={() => {      
              setNotiAbierta(prev => !prev);
            }}
          >
            📩 Notificaciones
          </button>

         <button 
             className="btn-links" 
             onClick={() => {setLinkAbierto(prev => !prev);
             }}
          >
             🌐 Links casas comerciales
            </button>

          <li>
            <button 
              className="admin-button"
              onClick={() => navigate("/dashboard/admin")}
            >
              🛠️ Administrador
            </button>
          </li>
          
        </ul>

        {/* 👇 Botón de logout FUERA del ul, así se puede anclar abajo */}
        <button onClick={handleLogout} className="logout-button">
          Cerrar sesión
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      {notiAbierta && (
        <div className="notificaciones-panel">
          <button className="cerrar-panel" onClick={() => setNotiAbierta(false)}>✖</button>
          <Notificaciones />
        </div>
      )}
      
      {linkAbierto && (
         <div className="links-panel">
          <button className="cerrar-panel" onClick={() => setLinkAbierto(false)}>✖</button>
           <Links />
      </div>
      )}

    </div>
  );
}
