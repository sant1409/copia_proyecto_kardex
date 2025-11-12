//Prmite ver el diseño de la imagen y la separacion de la imagen al inicio de sesion y registro 
import '../pages/Landing/Landing.css';

export default function AuthLayout({ children }) {
  return (
    <div className="landing-container">
      <div className="left-column">
        <div className="contenido-top">
          {children}
        </div>

        {/* Logo abajo */}
        <div className="logo-bottom">
          <img src="/visual/Logo.png" alt="Logo" />
        </div>
      </div>

      {/* Columna derecha con imagen + overlay */}
      <div className="right-column">
        <img src="/visual/Almacen.png" alt="Almacén" />

        {/* Overlay de texto */}
        <div className="overlay-text">
          <h1>Bienvenido</h1>
          <p>Al almacén de reactivos e insumos</p>
        </div>
      </div>
    </div>
  );
}
