//PErfil de usuario autrntikado, el cual permite ver nombre, sede, correo

import { useEffect, useState } from "react";
import './Perfil.css';

export default function Perfil() {
  const [usuario, setUsuario] = useState({
    nombre: '',
    correo: '',
    id_sede: ''
  });
  const [nombreSede, setNombreSede] = useState('');

  useEffect(() => {
    // 🔹 Recuperar usuario desde localStorage
    const usuarioGuardado = localStorage.getItem('usuario');
    const sedeGuardada = localStorage.getItem('id_sede');

    if (usuarioGuardado) {
      const info = JSON.parse(usuarioGuardado);
      setUsuario({
        nombre: info.nombre || '',
        correo: info.correo || '',
        id_sede: sedeGuardada || info.id_sede || ''
      });
    }
  }, []);

  useEffect(() => {
    // 🔹 Cuando ya tenemos el id_sede, consultamos su nombre
    const fetchNombreSede = async () => {
      if (usuario.id_sede) {
        try {
          const res = await fetch(`http://localhost:3000/sede/${usuario.id_sede}`);
          const data = await res.json();
          setNombreSede(data.nombre || 'Desconocida');
          
        } catch (error) {
          console.error('Error al obtener el nombre de la sede:', error);
          setNombreSede('Error al cargar');
        }
      }
    };

    fetchNombreSede();
  }, [usuario.id_sede]);

  return (
    <div className="perfil-container">
      <h2>Perfil del Usuario</h2>
      <p><strong>Nombre:</strong> {usuario.nombre || 'No disponible'}</p>
      <p><strong>Correo:</strong> {usuario.correo || 'No disponible'}</p>
      <p><strong>Sede:</strong> {nombreSede || 'No disponible'}</p>
    </div>
  );
}
