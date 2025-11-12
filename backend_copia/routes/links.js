// Rutas para gestionar los links del sistema.
// Permite crear, consultar, actualizar y eliminar enlaces almacenados en la base de datos.
// No requiere autenticación; usa conexión directa a MySQL.


const express = require("express");
const router = express.Router();
const pool = require("../db"); // tu conexión MySQL directa

// Obtener todos los links
router.get("/", async (req, res) => {
  try {
    const [links] = await pool.query("SELECT * FROM links ORDER BY id_link ASC");
    res.status(200).json(links);
  } catch (error) {
    console.error("❌ Error al obtener los links:", error);
    res.status(500).json({ message: "Error al obtener los links" });
  }
});

// Obtener un link por ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM links WHERE id_link = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Link no encontrado" });
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("❌ Error al obtener el link:", error);
    res.status(500).json({ message: "Error al obtener el link" });
  }
});

// Crear un nuevo link
router.post("/", async (req, res) => {
  try {
    const { nombre, link } = req.body;
    if (!nombre || !link) return res.status(400).json({ message: "Todos los campos son obligatorios" });

    const [result] = await pool.query("INSERT INTO links (nombre, link) VALUES (?, ?)", [nombre, link]);
    res.status(201).json({ id_link: result.insertId, nombre, link });
  } catch (error) {
    console.error("❌ Error al crear el link:", error);
    res.status(500).json({ message: "Error al crear el link" });
  }
});

// Actualizar link
router.put("/:id", async (req, res) => {
  try {
    const { nombre, link } = req.body;
    const [result] = await pool.query("UPDATE links SET nombre=?, link=? WHERE id_link=?", [nombre, link, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Link no encontrado" });
    res.status(200).json({ id_link: req.params.id, nombre, link });
  } catch (error) {
    console.error("❌ Error al actualizar el link:", error);
    res.status(500).json({ message: "Error al actualizar el link" });
  }
});

// Eliminar link
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM links WHERE id_link=?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Link no encontrado" });
    res.status(200).json({ message: "Link eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar el link:", error);
    res.status(500).json({ message: "Error al eliminar el link" });
  }
});

module.exports = router;
