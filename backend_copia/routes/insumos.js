/**
 * ============================================================
 *  📦 Módulo: insumos.js
 * ============================================================
 * 
 * Controlador principal para la gestión de insumos, inventario + stock inventario.
 * 
 * Este módulo se encarga de realizar todas las operaciones relacionadas con los insumos:
 * creación, consulta, modificación y eliminación, garantizando la integridad del stock
 * y registrando todos los movimientos en el sistema de auditoría.
 * 
 * ------------------------------------------------------------
 * 🔧 Funcionalidades principales:
 * ------------------------------------------------------------
 * - Validación de datos recibidos desde el frontend.
 * - Creación automática de claves foráneas (FK) cuando no existen.
 * - Control integral del stock de inventario (inserción, actualización y eliminación).
 * - Registro automático en la tabla de auditoría (acciones del usuario).
 * - Integración con el sistema de notificaciones automáticas.
 * - Manejo de autenticación mediante verificación de tokens (verificarToken).
 * 
 * ------------------------------------------------------------
 * 🗂️ Rutas principales:
 * ------------------------------------------------------------
 *   POST   /insumo/                → Crear un nuevo insumo.
 *   GET    /insumo/buscar_insumos  → Buscar insumos con filtros y paginación.
 *   GET    /insumo/:id_insumo      → Consultar un insumo específico.
 *   PUT    /insumo/:id_insumo      → Modificar los datos de un insumo existente.
 *   DELETE /insumo/:id_insumo      → Eliminar un insumo y ajustar el stock.
 * 
 * ------------------------------------------------------------
 * 🧩 Integraciones y dependencias:
 * ------------------------------------------------------------
 * - 🔐 Autenticación: Middleware `verificarToken` para proteger las rutas.
 * - 🧾 Auditoría: Registra cada acción (crear, modificar, eliminar).
 * - 🔔 Notificaciones: Llama a `procesarSalidas()` tras cambios relevantes.
 * - 🧮 Base de datos: Conectado a MySQL mediante `pool` (mysql2/promise).
 * 
 * ------------------------------------------------------------
 * 📘 Descripción general del flujo:
 * ------------------------------------------------------------
 * 1️⃣ Al crear un insumo:
 *     - Se validan los datos.
 *     - Se crean las FK necesarias si no existen (proveedor, laboratorio, etc.).
 *     - Se inserta el registro en `insumo` y se actualiza `stock_inventario`.
 *     - Se registra la acción en `auditoria`.
 * 
 * 2️⃣ Al modificar un insumo:
 *     - Se verifican y actualizan los datos.
 *     - Se ajusta el stock si cambia la cantidad o fecha de vencimiento.
 *     - Se registra la modificación en `auditoria`.
 * 
 * 3️⃣ Al eliminar un insumo:
 *     - Se elimina de `insumo` y se descuenta del `stock_inventario`.
 *     - Se deja trazabilidad en la auditoría.
 * 
 * ------------------------------------------------------------
 * 🧠 Notas:
 * ------------------------------------------------------------
 * - Todas las rutas requieren autenticación mediante JWT.
 * - La lógica del stock y auditoría está modularizada para su reutilización.
 * - Este módulo interactúa con varias tablas relacionales:
 *     • insumo
 *     • stock_inventario
 *     • auditoria
 *     • proveedor / laboratorio / nombre_del_insumo / presentación / clasificacion
 * 
 * ------------------------------------------------------------
 */


const express = require('express');
const router = express.Router();
const pool = require('../db');
const { registrarAuditoria } = require('../utils/auditoria');
const { procesarSalidas } = require('../utils/notificaciones');
const { verificarToken } = require('../middlewares/auth');

// Funcion que permite validar o crear si el valor de FK no existe
async function obtenerOcrearFK(pool, tabla, columna, valor, id_sede) {
  if (!valor || valor === '') return null;

  // Si el valor es un número → asumimos que es un ID y validamos
  if (!isNaN(Number(valor))) {
    const [rows] = await pool.query(
      `SELECT 1 FROM ${tabla} WHERE id_${columna} = ? AND id_sede = ? LIMIT 1`,
      [valor, id_sede]
    );
    if (rows.length === 0) {
      throw new Error(`El id ${valor} de ${tabla} no existe.`);
    }
    return Number(valor);
  }

  // Si no es número → asumimos que es un NOMBRE y lo insertamos si no existe
  const [rowsNombre] = await pool.query(
    `SELECT id_${columna} FROM ${tabla} WHERE nombre = ? AND id_sede = ? LIMIT 1`,
    [valor, id_sede]
  );

  if (rowsNombre.length > 0) {
    return rowsNombre[0][`id_${columna}`];
  }

  const [insertResult] = await pool.query(
    `INSERT INTO ${tabla} (nombre, id_sede) VALUES (?, ?)`,
    [valor, id_sede]
  );

  return insertResult.insertId;
}

// Crear insumo
router.post('/', verificarToken, async (req, res) => {

  try {
    const {
      fecha, temperatura, cantidad, salida, saldo, id_nombre_del_insumo, id_presentacion,
      id_laboratorio, id_proveedor, lote, fecha_de_vto, registro_invima, expediente_invima,
      id_clasificacion, estado_de_revision, salida_fecha, inicio, termino,
      lab_sas, factura, costo_global, costo, costo_prueba, costo_unidad, iva,
      consumible, mes_registro, id_categoria, usuarioId
    } = req.body;

    const id_sede = req.usuario.id_sede;

    // Validar formato de fecha
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fecha || !fechaRegex.test(fecha)) {
      return res.status(400).json({ error: 'La fecha debe tener el formato YYYY-MM-DD' });
    }

    if (fecha_de_vto && !fechaRegex.test(fecha_de_vto)) {
      return res.status(400).json({ error: 'La fecha de vencimiento debe tener el formato YYYY-MM-DD' });
    }

    // Validar nombre del insumo
    if (!id_nombre_del_insumo || (typeof id_nombre_del_insumo === "string" && id_nombre_del_insumo.trim() === "")) {
      return res.status(400).json({ error: "El nombre del insumo es obligatorio, para que el stock funcione correctamente" });
    }

    // Validar nombre del insumo
    if (!id_laboratorio || (typeof id_laboratorio === "string" && id_laboratorio.trim() === "")) {
      return res.status(400).json({ error: "El nombre del laboratorio es obligatorio, para que el stock funcione correctamente" });
    }


    // Validar cantidad
    if (cantidad === undefined || cantidad === null || (typeof cantidad === 'string' && cantidad.trim() === '') || isNaN(Number(cantidad))) {
      return res.status(400).json({ error: "La cantidad es obligatoria para que el stock pueda funcionar correctamente" });
    }
    console.log('id_sede:', id_sede)
    // Validar o crear FK
    const idNombreDelInsumo = await obtenerOcrearFK(pool, 'nombre_del_insumo', 'nombre_del_insumo', id_nombre_del_insumo, id_sede);
    const idPresentacion = await obtenerOcrearFK(pool, 'presentacion', 'presentacion', id_presentacion, id_sede);
    const idLaboratorio = await obtenerOcrearFK(pool, 'laboratorio', 'laboratorio', id_laboratorio, id_sede);
    const idProveedor = await obtenerOcrearFK(pool, 'proveedor', 'proveedor', id_proveedor, id_sede);
    const idClasificacion = await obtenerOcrearFK(pool, 'clasificacion', 'clasificacion', id_clasificacion, id_sede);
    const idCategoria = await obtenerOcrearFK(pool, 'categoria', 'categoria', id_categoria, id_sede);

    // ❌ Restricción: no permitir 'salida' en la creación
    if (salida !== undefined && salida !== null && Number(salida) > 0) {
      return res.status(400).json({
        error: "No se puede asignar una salida al crear un insumo. La salida solo puede registrarse al actualizar un insumo."
      });
    }

    const [result] = await pool.query(
      `INSERT INTO insumos (
        fecha, temperatura, cantidad, salida, saldo, id_nombre_del_insumo, id_presentacion,
        id_laboratorio, id_proveedor, lote, fecha_de_vto, registro_invima, expediente_invima,
        id_clasificacion, estado_de_revision, salida_fecha, inicio, termino,
        lab_sas, factura, costo_global, costo, costo_prueba, costo_unidad, iva,
        consumible, mes_registro, id_categoria, usuarioId, id_sede
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        fecha, temperatura, cantidad, salida, saldo, idNombreDelInsumo, idPresentacion,
        idLaboratorio, idProveedor, lote, fecha_de_vto, registro_invima, expediente_invima,
        idClasificacion, estado_de_revision, salida_fecha, inicio, termino,
        lab_sas, factura, costo_global, costo, costo_prueba, costo_unidad, iva,
        consumible, mes_registro, idCategoria, usuarioId, id_sede
      ]
    );

    // Obtener nombre del usuario
    const [usuarioResult] = await pool.query(
      'SELECT nombre FROM usuarios WHERE id_usuario = ?',
      [usuarioId]
    );
    const nombreUsuario = usuarioResult.length > 0 ? usuarioResult[0].nombre : 'Desconocido';
    await registrarAuditoria('insumos', result.insertId, 'creo', req.usuario);


    // Stock: siempre crear un registro nuevo
    const [productoRow] = await pool.query(
      'SELECT nombre AS nombre_producto FROM nombre_del_insumo WHERE id_nombre_del_insumo = ? AND id_sede = ?',
      [idNombreDelInsumo, id_sede]
    );
    const nombre_producto = productoRow.length ? productoRow[0].nombre_producto : null;
    const cantidadNum = Number(cantidad);
    const laboId = Number(idLaboratorio);

    if (nombre_producto && cantidadNum > 0) {
      await pool.query(
        `INSERT INTO stock_inventario (nombre_producto, id_insumo, id_laboratorio, cantidad_actual, id_sede, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [nombre_producto, result.insertId, laboId, cantidadNum, id_sede]
      );
    }

    res.status(201).json({ message: 'Registro en insumo creado exitosamente!', id_insumo: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Buscar insumos (con joins completos y filtros)
// Buscar insumos (con joins completos y filtros por sede)
router.get('/buscar_insumos', verificarToken, async (req, res) => {
  const { q, nombre, laboratorio, lote, desde, hasta } = req.query;
  const id_sede = req.usuario.id_sede; // ✅ Sede del usuario logueado

  let condiciones = [];
  let valores = [];

  // Buscador general (campo q)
  if (q && q.trim() !== '') {
    const like = `%${q.trim()}%`;
    condiciones.push("(ni.nombre LIKE ? OR l.nombre LIKE ? OR i.lote LIKE ?)");
    valores.push(like, like, like);
  }

  // Filtros opcionales
  if (nombre) {
    condiciones.push("ni.nombre LIKE ?");
    valores.push(`%${nombre}%`);
  }

  if (laboratorio) {
    condiciones.push("l.nombre LIKE ?");
    valores.push(`%${laboratorio}%`);
  }

  if (lote) {
    condiciones.push("i.lote LIKE ?");
    valores.push(`%${lote}%`);
  }

  if (desde && hasta) {
    condiciones.push("i.fecha BETWEEN ? AND ?");
    valores.push(desde, hasta);
  } else if (desde) {
    condiciones.push("i.fecha >= ?");
    valores.push(desde);
  } else if (hasta) {
    condiciones.push("i.fecha <= ?");
    valores.push(hasta);
  }

  // 🔹 Filtro obligatorio por sede
  condiciones.push("i.id_sede = ?");
  valores.push(id_sede);

  // Consulta con JOINs protegidos por sede
  let sql = `
    SELECT
      i.id_insumo,
      i.id_sede,
      i.fecha,
      i.temperatura,
      i.cantidad,
      i.salida,
      i.saldo,
      ni.nombre AS nombre_del_insumo,
      p.nombre  AS presentacion,
      l.nombre  AS laboratorio,
      pr.nombre AS proveedor,
      c.nombre  AS clasificacion,
      cat.nombre AS categoria,
      i.lote,
      i.fecha_de_vto,
      i.registro_invima,
      i.expediente_invima,
      i.estado_de_revision,
      i.salida_fecha,
      i.inicio,
      i.termino,
      i.lab_sas,
      i.factura,
      i.costo_global,
      i.costo,
      i.costo_prueba,
      i.costo_unidad,
      i.iva,
      i.consumible,
      i.mes_registro,
      i.usuarioId,
      u.nombre AS usuario_nombre
    FROM insumos i
    LEFT JOIN nombre_del_insumo ni ON i.id_nombre_del_insumo = ni.id_nombre_del_insumo AND ni.id_sede = i.id_sede
    LEFT JOIN presentacion p      ON i.id_presentacion = p.id_presentacion AND p.id_sede = i.id_sede
    LEFT JOIN laboratorio l       ON i.id_laboratorio = l.id_laboratorio AND l.id_sede = i.id_sede
    LEFT JOIN proveedor pr        ON i.id_proveedor = pr.id_proveedor AND pr.id_sede = i.id_sede
    LEFT JOIN clasificacion c     ON i.id_clasificacion = c.id_clasificacion AND c.id_sede = i.id_sede
    LEFT JOIN categoria cat       ON i.id_categoria = cat.id_categoria AND cat.id_sede = i.id_sede
    LEFT JOIN usuarios u          ON i.usuarioId = u.id_usuario AND u.id_sede = i.id_sede
  `;

  if (condiciones.length > 0) {
    sql += " WHERE " + condiciones.join(" AND ");
  }

  sql += " ORDER BY i.id_insumo DESC";

  try {
    const [rows] = await pool.query(sql, valores);
    res.json(rows);
  } catch (err) {
    console.error("Error en buscar_insumos:", err);
    res.status(500).json({ error: "Error al buscar en insumos" });
  }
});

function emptyToNull(val) {
  return val === undefined || val === null || (typeof val === 'string' && val.trim() === '') ? null : val;
}
router.put('/:id_insumo', verificarToken, async (req, res) => {

  const {
    fecha, temperatura, cantidad, salida, saldo, id_nombre_del_insumo, id_presentacion,
    id_laboratorio, id_proveedor, lote, fecha_de_vto, registro_invima, expediente_invima,
    id_clasificacion, estado_de_revision, salida_fecha, inicio, termino,
    lab_sas, factura, costo_global, costo, costo_prueba, costo_unidad, iva,
    consumible, mes_registro, id_categoria, usuarioId,
  } = req.body;
  const { id_insumo } = req.params;
  const id_sede = req.usuario.id_sede;

  //Validar formato de fecha
  const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!fecha || !fechaRegex.test(fecha)) {
    return res.status(400).json({ error: 'La fecha debe tener el formato YYYY-MM-DD' });
  }

  // Validar formato de fecha vto
  if (fecha_de_vto && !fechaRegex.test(fecha_de_vto)) {
    return res.status(400).json({ error: 'La fecha de vencimiento debe tener el formato YYYY-MM-DD' });
  }

  //Validar el nombre del inumo para que funcione el stock
  if (!id_nombre_del_insumo || (typeof id_nombre_del_insumo === "string" && id_nombre_del_insumo.trim() === "")) {
    return res.status(400).json({ error: "El nombre del insumo es obligatorio para que pueda funcionar el stock" });
  }

  //Validar  la cantidad para que funcione el stock
  if (
    cantidad === undefined ||
    cantidad === null ||
    (typeof cantidad === 'string' && cantidad.trim() === '') ||
    isNaN(Number(cantidad))
  ) {
    return res.status(400).json({ error: "La cantidad es obligatoria para que el stock pueda funcionar correctamente" });
  }

  // ✅ Validar que la categoría no quede vacía al actualizar
  if (
    id_categoria === undefined ||
    id_categoria === null ||
    (typeof id_categoria === "string" && id_categoria.trim() === "")
  ) {
    return res.status(400).json({
      error: "La categoría es obligatoria. No puedes dejar este campo vacío al actualizar."
    });
  }

  const fkFields = {
    id_nombre_del_insumo: emptyToNull(id_nombre_del_insumo),
    id_presentacion: emptyToNull(id_presentacion),
    id_laboratorio: emptyToNull(id_laboratorio),
    id_proveedor: emptyToNull(id_proveedor),
    id_clasificacion: emptyToNull(id_clasificacion),
    id_categoria: emptyToNull(id_categoria),
  };

  try {
    // Leer registro viejo
    const [oldRows] = await pool.query('SELECT * FROM insumos WHERE id_insumo = ? AND id_sede = ?', [id_insumo, id_sede]);
    const oldInsumos = oldRows.length > 0 ? oldRows[0] : null;
    if (!oldInsumos) return res.status(404).json({ message: 'Insumo no encontrado con ese ID' });

    //Validar FK solo si no es null
    for (const [tabla, valor] of Object.entries(fkFields)) {
      if (valor !== null) {
        //el nombre de tabla en validarFKObligatorio no debe llevar "id_"
        const tablaSinId = tabla.replace(/^id_/, '');
        fkFields[tabla] = await obtenerOcrearFK(pool, tablaSinId, tablaSinId, valor, id_sede);
      }
    }
    // --- Calcular nueva cantidad disponible ANTES del update general
    let nuevaCantidad = Number(cantidad || 0) - Number(salida || 0);
    if (nuevaCantidad < 0) nuevaCantidad = 0;

    // reemplazamos la variable cantidad por la nueva
    const cantidadFinal = nuevaCantidad;

    const [result] = await pool.query(
      `UPDATE insumos SET
                 fecha = ?, temperatura = ?, cantidad = ?, salida = ?, saldo = ?, id_nombre_del_insumo = ?, id_presentacion = ?,
                 id_laboratorio = ?, id_proveedor = ?, lote = ?, fecha_de_vto = ?, registro_invima = ?, expediente_invima = ?,
                 id_clasificacion = ?, estado_de_revision = ?, salida_fecha = ?, inicio = ?, termino = ?,
                 lab_sas = ?, factura = ?, costo_global = ?, costo = ?, costo_prueba = ?, costo_unidad = ?, iva = ?,
                 consumible = ?,mes_registro = ?, id_categoria = ?,  usuarioId = ? WHERE id_insumo = ? AND id_sede = ?`,

      [
        fecha, temperatura, cantidadFinal, salida, saldo,
        fkFields.id_nombre_del_insumo, fkFields.id_presentacion, fkFields.id_laboratorio, fkFields.id_proveedor,
        lote, fecha_de_vto, registro_invima, expediente_invima,
        fkFields.id_clasificacion, estado_de_revision, salida_fecha, inicio, termino,
        lab_sas, factura, costo_global, costo, costo_prueba, costo_unidad,
        iva, consumible, mes_registro, fkFields.id_categoria, usuarioId, id_insumo, id_sede
      ]
    );
    const [usuarioResult] = await pool.query(
      'SELECT nombre FROM usuarios WHERE id_usuario = ? AND id_sede = ?',
      [usuarioId, id_sede]
    );

    const nombreUsuario = usuarioResult.length > 0 ? usuarioResult[0].nombre : 'Desconocido';
    await registrarAuditoria('insumos', id_insumo, 'modificó', req.usuario);

    //Notificar fecha de salida
    await procesarSalidas();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Insumo no encontrado con ese ID' });
    }

    try {
      // --- Valores antiguos
      const oldCantidad = Number(oldInsumos?.cantidad || 0);
      const oldSalida = Number(oldInsumos?.salida || 0);
      const oldIdNombre = oldInsumos?.id_nombre_del_insumo;
      const oldLab = oldInsumos?.id_laboratorio;
      const oldTerminoRaw = oldInsumos?.termino;

      // --- Valores nuevos (si no vienen, usar viejo)
      const newCantidad = (cantidad === undefined || cantidad === null || cantidad === '') ? oldCantidad : Number(cantidad);
      const newSalida = (salida === undefined || salida === null || salida === '') ? oldSalida : Number(salida);
      const newIdNombre = fkFields.id_nombre_del_insumo ?? oldIdNombre;
      const newLab = fkFields.id_laboratorio ?? oldLab;
      const newTerminoRaw = termino;

      // --- Helper para parsear fechas
      const parseDate = (v) => {
        if (!v) return null;
        const d = (v instanceof Date) ? v : new Date(v);
        return isNaN(d.getTime()) ? null : d;
      };

      const oldTerminoDate = parseDate(oldTerminoRaw);
      const newTerminoDate = parseDate(newTerminoRaw);

      // --- Obtener nombres legibles
      const [oldNameRow] = await pool.query(
        'SELECT nombre AS nombre_producto FROM nombre_del_insumo WHERE id_nombre_del_insumo = ? AND id_sede = ?',
        [oldIdNombre, id_sede]
      );
      const oldNombreProducto = oldNameRow.length ? oldNameRow[0].nombre_producto : null;

      const [newNameRow] = await pool.query(
        'SELECT nombre AS nombre_producto FROM nombre_del_insumo WHERE id_nombre_del_insumo = ? AND id_sede = ?',
        [newIdNombre, id_sede]
      );
      const newNombreProducto = newNameRow.length ? newNameRow[0].nombre_producto : null;

      // --- Normalización 
      const oldNombreClean = oldNombreProducto ? oldNombreProducto.trim().toUpperCase() : null;
      const newNombreClean = newNombreProducto ? newNombreProducto.trim().toUpperCase() : null;

      // --- Leer la fila de stock correspondiente
      const [stockRows] = await pool.query(
        'SELECT * FROM stock_inventario WHERE id_insumo = ? AND id_sede = ? LIMIT 1',
        [id_insumo, id_sede]
      );
      let stockRow = stockRows.length ? stockRows[0] : null;

      const diffCantidad = newCantidad - oldCantidad;
      const diffSalida = newSalida - oldSalida;

      if (stockRow) {
        // Actualizar cantidad con cantidad y salida 
        const nuevaCantidadActual = stockRow.cantidad_actual + diffCantidad - diffSalida;
        if (nuevaCantidadActual <= 0) {
          await pool.query(
            'DELETE FROM stock_inventario WHERE id_stock_inventario = ? AND id_sede = ?',
            [stockRow.id_stock_inventario, id_sede]
          );
        } else {
          await pool.query(
            'UPDATE stock_inventario SET cantidad_actual = ?, updatedAt = NOW() WHERE id_stock_inventario = ? AND id_sede = ?',
            [nuevaCantidadActual, stockRow.id_stock_inventario, id_sede]
          );
        }
      } else {
        // Crear fila nueva si no existía 
        const cantidadInicial = newCantidad - newSalida;
        await pool.query(
          'INSERT INTO stock_inventario (id_insumo, nombre_producto, id_laboratorio, cantidad_actual, id_sede, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
          [id_insumo, newNombreProducto, newLab, cantidadInicial, id_sede]
        );
      }

      // --- Helper para normalizar fecha "YYYY-MM-DD"
      const toYMD = (v) => {
        if (!v) return null;
        if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
        const d = new Date(v);
        if (isNaN(d.getTime())) return null;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
      };

      const todayYMD = toYMD(new Date());
      const terminoYMD = toYMD(newTerminoRaw);

      // --- Solo si hay fecha de término y stockRow
      if (terminoYMD && stockRow) {
        // Si la fecha de término es hoy, eliminar stock
        if (terminoYMD === todayYMD) {
          await pool.query(
            'DELETE FROM stock_inventario WHERE id_stock_inventario = ? AND id_sede = ?',
            [stockRow.id_stock_inventario, id_sede]
          );
        }
      }
      // --- Actualizar salida y cantidad en Kardex 
      await pool.query(
        'UPDATE insumos SET cantidad = ?, salida = ? WHERE id_insumo = ? AND id_sede = ?',
        [newCantidad, newSalida, id_insumo, id_sede]
      );

    } catch (errAdjust) {
      console.error('ERROR ajustando stock en PUT:', errAdjust);
    }

    res.json({ message: 'Registro actualizado exitosamente', result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar un insumo por ID (con joins y nombres descriptivos)

router.get('/:id_insumo', verificarToken, async (req, res) => {
  console.log('id_sede backend:', req.usuario.id_sede);
  const { id_insumo } = req.params;

  const id_sede = req.usuario.id_sede;

  try {
    const [result] = await pool.query(
      `
      SELECT
        i.id_insumo,
        i.id_sede,
        i.fecha,
        i.temperatura,
        i.cantidad,
        i.salida,
        i.saldo,

        -- Nombres en lugar de IDs
        ni.nombre  AS nombre_del_insumo,
        p.nombre   AS presentacion,
        l.nombre   AS laboratorio,
        pr.nombre  AS proveedor,
        c.nombre   AS clasificacion,
        cat.nombre AS categoria,

        i.lote,
        i.fecha_de_vto,
        i.registro_invima,
        i.expediente_invima,
        i.estado_de_revision,
        i.salida_fecha,
        i.inicio,
        i.termino,
        i.lab_sas,
        i.factura,
        i.costo_global,
        i.costo,
        i.costo_prueba,
        i.costo_unidad,
        i.iva,
        i.consumible,
        i.mes_registro,

        -- Usuario
        u.id_usuario AS usuario_id,
        u.nombre     AS usuario_nombre

      FROM insumos i
      LEFT JOIN nombre_del_insumo ni ON i.id_nombre_del_insumo = ni.id_nombre_del_insumo AND ni.id_sede = i.id_sede
      LEFT JOIN presentacion      p  ON i.id_presentacion      = p.id_presentacion      AND p.id_sede  = i.id_sede
      LEFT JOIN laboratorio       l  ON i.id_laboratorio       = l.id_laboratorio       AND l.id_sede  = i.id_sede
      LEFT JOIN proveedor         pr ON i.id_proveedor         = pr.id_proveedor        AND pr.id_sede = i.id_sede
      LEFT JOIN clasificacion     c  ON i.id_clasificacion     = c.id_clasificacion     AND c.id_sede  = i.id_sede
      LEFT JOIN categoria         cat ON i.id_categoria        = cat.id_categoria       AND cat.id_sede = i.id_sede
      LEFT JOIN usuarios          u  ON i.usuarioId            = u.id_usuario           AND u.id_sede  = i.id_sede

      WHERE i.id_insumo = ? AND i.id_sede = ?
      `,
      [id_insumo, id_sede]
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se puede encontrar el insumo con el ID proporcionado en esta sede.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Insumo encontrado correctamente.',
      data: result[0]
    });
  } catch (error) {
    console.error("❌ Error en /:id_insumo:", error);
    res.status(500).json({
      success: false,
      message: 'Hubo un problema al obtener el insumo.',
      error: error.message
    });
  }
});


// Obtener todos los insumos con nombres (no IDs)
router.get('/', verificarToken, async (req, res) => {
  console.log('id_sede backend:', req.usuario?.id_sede);
  try {
    const id_sede = req.usuario.id_sede;

    const [insumos] = await pool.query(`
      SELECT
        i.id_insumo,
        i.id_sede,
        i.fecha,
        i.temperatura,
        i.cantidad,
        i.salida,
        i.saldo,

        -- Nombres en lugar de IDs
        ni.nombre   AS nombre_del_insumo,
        p.nombre    AS presentacion,
        l.nombre    AS laboratorio,
        pr.nombre   AS proveedor,
        c.nombre    AS clasificacion,
        cat.nombre  AS categoria,

        i.lote,
        i.fecha_de_vto,
        i.registro_invima,
        i.expediente_invima,
        i.estado_de_revision,
        i.salida_fecha,
        i.inicio,
        i.termino,
        i.lab_sas,
        i.factura,
        i.costo_global,
        i.costo,
        i.costo_prueba,
        i.costo_unidad,
        i.iva,
        i.consumible,
        i.mes_registro,
        
        -- Usuario: ID y nombre
        u.id_usuario AS usuario_id,
        u.nombre     AS usuario_nombre

      FROM insumos i
      LEFT JOIN nombre_del_insumo   ni   ON i.id_nombre_del_insumo  = ni.id_nombre_del_insumo   AND ni.id_sede   = ?
      LEFT JOIN presentacion        p    ON i.id_presentacion       = p.id_presentacion        AND p.id_sede    = ?
      LEFT JOIN laboratorio         l    ON i.id_laboratorio        = l.id_laboratorio         AND l.id_sede    = ?
      LEFT JOIN proveedor           pr   ON i.id_proveedor          = pr.id_proveedor          AND pr.id_sede   = ?
      LEFT JOIN clasificacion       c    ON i.id_clasificacion      = c.id_clasificacion      AND c.id_sede    = ?
      LEFT JOIN categoria           cat  ON i.id_categoria          = cat.id_categoria         AND cat.id_sede  = ?
      LEFT JOIN usuarios            u    ON i.usuarioId             = u.id_usuario             AND u.id_sede    = ?
      WHERE i.id_sede = ?  -- <<< filtro principal por sede
      ORDER BY i.id_insumo DESC
    `, [
      id_sede, // ni
      id_sede, // p
      id_sede, // l
      id_sede, // pr
      id_sede, // c
      id_sede, // cat
      id_sede, // u
      id_sede  // i
    ]);

    res.json(insumos);
  } catch (error) {
    console.error("Error en GET /insumos:", error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar un insumo
router.delete('/:id_insumo', verificarToken, async (req, res) => {
  const { id_insumo } = req.params;
  const { usuarioId } = req.body;
  const id_sede = req.usuario.id_sede;

  try {
    // 1) Obtener insumo a eliminar
    const [insumos] = await pool.query(
      'SELECT * FROM insumos WHERE id_insumo = ? AND id_sede = ?',
      [id_insumo, id_sede]
    );
    if (insumos.length === 0) {
      return res.status(404).json({ success: false, message: 'No existe un registro con ese ID de insumo' });
    }

    const insumo = insumos[0];
    const cantidad = Number(insumo.cantidad || 0);
    const salida = Number(insumo.salida || 0);
    const cantidadRestanteInsumo = Math.max(cantidad - salida, 0); // ✅ lo que realmente queda disponible
    const idNombre = insumo.id_nombre_del_insumo;
    const idLab = insumo.id_laboratorio;

    // 2) Obtener nombre legible del insumo
    const [nameRows] = await pool.query(
      'SELECT nombre AS nombre_producto FROM nombre_del_insumo WHERE id_nombre_del_insumo = ? AND id_sede = ?',
      [idNombre, id_sede]
    );
    const nombreProducto = nameRows.length ? nameRows[0].nombre_producto : null;

    if (nombreProducto) {
      // 3) Buscar todos los registros de stock para este insumo
      const [stockRows] = await pool.query(
        `SELECT * FROM stock_inventario
       WHERE nombre_producto = ? AND id_laboratorio = ? AND id_sede = ?
       ORDER BY id_stock_inventario ASC`,
        [nombreProducto, idLab, id_sede]
      );

      let cantidadRestante = cantidadRestanteInsumo; // ✅ corregido

      for (const stock of stockRows) {
        const stockActual = Number(stock.cantidad_actual || 0);

        if (stockActual <= cantidadRestante) {
          await pool.query(
            'DELETE FROM stock_inventario WHERE id_stock_inventario = ? AND id_sede = ?',
            [stock.id_stock_inventario, id_sede]
          );
          cantidadRestante -= stockActual;
        } else {
          const nuevoStock = stockActual - cantidadRestante;
          await pool.query(
            'UPDATE stock_inventario SET cantidad_actual = ? WHERE id_stock_inventario = ? AND id_sede = ?',
            [nuevoStock, stock.id_stock_inventario, id_sede]
          );
          cantidadRestante = 0;
          break;
        }
      }

      // 4) Verificar si queda stock total y limpiar si está en 0
      const [verificarStock] = await pool.query(
        `SELECT SUM(cantidad_actual) AS total FROM stock_inventario
       WHERE nombre_producto = ? AND id_laboratorio = ? AND id_sede = ?`,
        [nombreProducto, idLab, id_sede]
      );

      const totalStock = Number(verificarStock[0].total || 0);
      if (totalStock <= 0) {
        await pool.query(
          `DELETE FROM stock_inventario
         WHERE nombre_producto = ? AND id_laboratorio = ? AND id_sede = ?`,
          [nombreProducto, idLab, id_sede]
        );
      }
    }

    // 5) Registrar auditoría
    await registrarAuditoria('insumos', id_insumo, 'eliminó', req.usuario);

    // 6) Eliminar el registro del insumo
    await pool.query('DELETE FROM insumos WHERE id_insumo = ? AND id_sede = ?', [id_insumo, id_sede]);

    res.status(202).json({ success: true, message: 'Registro eliminado y stock ajustado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Hubo un problema al intentar eliminar el insumo',
      error: error.message
    });
  }
});

module.exports = router;













