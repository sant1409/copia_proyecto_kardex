// Ruta para obtener el inventario completo filtrado por sede.
// Combina datos de reactivos e insumos, permitiendo filtrar por tipo, nombre o mes.
// Requiere autenticación mediante token para acceder.


const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verificarToken } = require("../middlewares/auth");

// 🔹 Obtener inventario completo filtrado por sede
router.get("/", verificarToken, async (req, res) => {
  try {
    const { tipo, nombre, mes } = req.query;
    const id_sede = req.usuario.id_sede; // viene del token ✅

    // --- CONSULTA KARDEX (REACTIVOS) ---
    let queryKardex = `
      SELECT 
        k.id_kardex AS id,
        n.nombre AS nombre,
        k.fecha_recepcion,
        k.fecha_vencimiento,
        s.cantidad_actual AS cantidad,   -- ✅ cantidad real 
        k.fecha_terminacion AS fecha_terminacion,
        'REACTIVO' AS tipo
      FROM kardex k
      JOIN nombre_insumo n ON k.id_nombre_insumo = n.id_nombre_insumo
      LEFT JOIN stock_inventario s ON s.id_kardex = k.id_kardex AND s.id_sede = k.id_sede
      WHERE k.id_sede = ?
    `;

    // --- CONSULTA INSUMOS ---
  
    let queryInsumos = `
      SELECT 
        i.id_insumo AS id,
        n.nombre AS nombre,
        i.fecha AS fecha,
        i.fecha_de_vto AS fecha_de_vto,
        s.cantidad_actual AS cantidad,   -- ✅ cantidad real
        i.termino AS termino,
       'INSUMO' AS tipo
     FROM insumos i
     JOIN nombre_del_insumo n ON i.id_nombre_del_insumo = n.id_nombre_del_insumo
     LEFT JOIN stock_inventario s ON s.id_insumo = i.id_insumo AND s.id_sede = i.id_sede
     WHERE i.id_sede = ?
    `;


    const paramsKardex = [id_sede];
    const paramsInsumos = [id_sede];

    // --- Filtros dinámicos ---
    if (tipo) {
      if (tipo.toUpperCase() === "INSUMO") queryKardex += " AND 0";
      if (tipo.toUpperCase() === "REACTIVO") queryInsumos += " AND 0";
    }

    if (nombre) {
      queryKardex += " AND n.nombre LIKE ?";
      queryInsumos += " AND n.nombre LIKE ?";
      paramsKardex.push(`%${nombre}%`);
      paramsInsumos.push(`%${nombre}%`);
    }

    if (mes) {
      queryKardex += " AND MONTH(k.fecha_recepcion) = ?";
      queryInsumos += " AND MONTH(i.fecha) = ?";
      paramsKardex.push(mes);
      paramsInsumos.push(mes);
    }

    // --- Ejecutar consultas ---
    const [rowsKardex] = await pool.query(queryKardex, paramsKardex);
    const [rowsInsumos] = await pool.query(queryInsumos, paramsInsumos);

    res.json([...rowsKardex, ...rowsInsumos]);
  } catch (error) {
    console.error("❌ Error al obtener inventario:", error);
    res.status(500).json({ error: "Error al obtener inventario" });
  }
});

module.exports = router;



