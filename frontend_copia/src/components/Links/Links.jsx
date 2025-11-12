//Permite ver la parte de links de las casas comerciales

import { useState, useEffect } from "react";
import "./Links.css";

export default function Links() {
  const [links, setLinks] = useState([]);
  const [nuevoLink, setNuevoLink] = useState({ nombre: "", link: "" });
  const [editando, setEditando] = useState(null);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    obtenerLinks();
  }, []);

  const obtenerLinks = async () => {
    try {
      const res = await fetch("http://localhost:3000/links");
      if (!res.ok) throw new Error("Error al obtener los links");
      const data = await res.json();
      setLinks(data);
    } catch (error) {
      console.error("❌ Error:", error);
    }
  };

  const crearLink = async (e) => {
    e.preventDefault();
    if (!nuevoLink.nombre || !nuevoLink.link) {
      setMensaje("⚠️ Todos los campos son obligatorios");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoLink),
      });

      if (!res.ok) throw new Error("Error al crear el link");

      const data = await res.json();
      setLinks([...links, data]);
      setNuevoLink({ nombre: "", link: "" });
      setMensaje("✅ Link agregado correctamente");
    } catch (error) {
      console.error("❌ Error al crear link:", error);
      setMensaje("❌ No se pudo crear el link");
    }
  };

  const eliminarLink = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este link?")) return;
    try {
      const res = await fetch(`http://localhost:3000/links/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar el link");

      setLinks(links.filter((l) => l.id_link !== id));
      setMensaje("🗑️ Link eliminado correctamente");
    } catch (error) {
      console.error("❌ Error al eliminar:", error);
    }
  };

  const guardarEdicion = async (id) => {
    const linkEditado = links.find((l) => l.id_link === id);
    try {
      const res = await fetch(`http://localhost:3000/links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: linkEditado.nombre,
          link: linkEditado.link,
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar link");

      setEditando(null);
      setMensaje("✏️ Link actualizado correctamente");
    } catch (error) {
      console.error("❌ Error al actualizar:", error);
    }
  };

  const handleCambio = (id, campo, valor) => {
    setLinks(
      links.map((l) =>
        l.id_link === id ? { ...l, [campo]: valor } : l
      )
    );
  };

  return (
  
    <div className="links_casas-container">
      <h2>Links Casas Comerciales</h2>

      {mensaje && <p className="mensaje-links">{mensaje}</p>}

      <form onSubmit={crearLink} className="form-links-casas">
        <input
          type="text"
          placeholder="Nombre de la casa comercial"
          value={nuevoLink.nombre}
          onChange={(e) =>
            setNuevoLink({ ...nuevoLink, nombre: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="URL del link"
          value={nuevoLink.link}
          onChange={(e) =>
            setNuevoLink({ ...nuevoLink, link: e.target.value })
          }
        />
        <button type="submit">Agregar</button>
      </form>

      <div className="tabla-links-casas">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Link</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {links.length > 0 ? (
              links.map((l) => (
                <tr key={l.id_link}>
                  <td>{l.id_link}</td>
                  <td>
                    {editando === l.id_link ? (
                      <input
                        value={l.nombre}
                        onChange={(e) =>
                          handleCambio(l.id_link, "nombre", e.target.value)
                        }
                      />
                    ) : (
                      l.nombre
                    )}
                  </td>
                  <td>
                    {editando === l.id_link ? (
                      <input
                        value={l.link}
                        onChange={(e) =>
                          handleCambio(l.id_link, "link", e.target.value)
                        }
                      />
                    ) : (
                      <a
                        href={l.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {l.link}
                      </a>
                    )}
                  </td>
                  <td>
                    {editando === l.id_link ? (
                      <>
                        <button onClick={() => guardarEdicion(l.id_link)}>
                          💾
                        </button>
                        <button onClick={() => setEditando(null)}>❌</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setEditando(l.id_link)}>
                          ✏️
                        </button>
                        <button onClick={() => eliminarLink(l.id_link)}>
                          🗑️
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No hay links registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
   
  );
}
