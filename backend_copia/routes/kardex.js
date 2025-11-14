/**
 * kardex.js
 * ============================================================
 * Módulo encargado de gestionar el Kardex y el control del inventario + stock inventario.
 * 
 * Este archivo implementa toda la lógica relacionada con el registro,
 * actualización y control del stock de los reactivos o insumos
 * dentro del sistema. Cada operación sobre el Kardex (crear, modificar
 * o eliminar) impacta directamente en el módulo de `stock_inventario y en inventario`.
 *
 * 🔹 Funcionalidades principales:
 *  - Registro de nuevos reactivos.
 *  - Consulta general o filtrada de Kardex por sede.
 *  - Modificación de reactivos existentes.
 *  - Eliminación segura de registros con ajuste automático en el stock.
 *  - Generación de auditorías de usuario en cada acción relevante.
 *  - Validación dinámica de claves foráneas según la sede.
 *  - Sincronización del inventario con fechas de vencimiento y terminación.
 *
 * 🔒 Autenticación:
 *  Todas las rutas están protegidas mediante el middleware `verificarToken`.
 *  Solo los usuarios autenticados con sede asignada pueden acceder o modificar datos.
 *
 * 📦 Dependencias utilizadas:
 *  - express → Manejo de rutas HTTP.
 *  - pool (MySQL2) → Conexión a la base de datos.
 *  - registrarAuditoria → Registro de acciones del usuario.
 *  - procesarSalidas → Notificación y control de vencimientos.
 *  - verificarToken → Middleware de autenticación JWT.
 *
 * 🧭 Rutas principales:
 *  - POST    /kardex/              → Crear un nuevo registro en el kardex.
 *  - GET     /kardex/              → Obtener todos los registros (por sede).
 *  - GET     /kardex/buscar_kardex → Consultar kardex con filtros o búsqueda.
 *  - GET     /kardex/:id_kardex    → Obtener un registro específico.
 *  - PUT     /kardex/:id_kardex    → Modificar un registro existente.
 *  - DELETE  /kardex/:id_kardex    → Eliminar registro y ajustar inventario.
 *
 * 🧩 Lógica general:
 *  1️⃣ Al crear un nuevo registro, se valida la información base (fechas, cantidad, FK, etc.).
 *  2️⃣ Si alguna FK no existe en la sede actual, se crea automáticamente.
 *  3️⃣ El registro se inserta en la tabla `kardex` y se sincroniza en `stock_inventario`.
 *  4️⃣ En modificaciones, el sistema ajusta automáticamente el stock según
 *      la diferencia de cantidades y salidas.
 *  5️⃣ Si el reactivo alcanza su fecha de terminación o vencimiento, se marca
 *      como no disponible en inventario (eliminado o reducido a cero).
 *  6️⃣ Toda acción queda registrada en el módulo de auditoría.
 *
 * ⚙️ Ejemplo de flujo:
 *  Usuario autenticado crea un reactivo → 
 *  se inserta en `kardex` → 
 *  se refleja en `stock_inventario y en inventario` →
 *  las modificaciones futuras ajustan cantidades y auditoría.
 *
 * 📍 Módulo crítico:
 *  Este archivo es esencial para la integridad del inventario.
 *  Cualquier error en el Kardex impacta directamente en el stock global.
 *  Se recomienda mantener trazabilidad y validación estricta.
 * ============================================================
 */



const express = require('express');
const router = express.Router();
const pool = require('../db');
const { registrarAuditoria } = require('../utils/auditoria');
const { procesarSalidas } = require('../utils/notificaciones');
const { verificarToken } = require('../middlewares/auth');

//  Función para validar o crear FK según la sede
async function obtenerOcrearFK(pool, tabla, columna, valor, id_sede) {
  if (!valor || valor === '') return null;

  // Si el valor es un número → validamos que exista en la sede
  if (!isNaN(Number(valor))) {
    const [rows] = await pool.query(
      `SELECT 1 FROM ${tabla} WHERE id_${columna} = ? AND id_sede = ? LIMIT 1`,
      [valor, id_sede]
    );
    if (rows.length === 0) {
      throw new Error(`El id ${valor} de ${tabla} no existe o no pertenece a esta sede.`);
    }
    return Number(valor);
  }

  // Si no es número → buscamos por nombre en la sede
  const [rowsNombre] = await pool.query(
    `SELECT id_${columna} FROM ${tabla} WHERE nombre = ? AND id_sede = ? LIMIT 1`,
    [valor, id_sede]
  );

  if (rowsNombre.length > 0) {
    return rowsNombre[0][`id_${columna}`];
  }

  // Si no existe, lo creamos asociado a la sede
  const [insertResult] = await pool.query(
    `INSERT INTO ${tabla} (nombre, id_sede) VALUES (?, ?)`,
    [valor, id_sede]
  );

  return insertResult.insertId;
}

//  Crear kardex
router.post('/', verificarToken, async (req, res) => {
  try {
    console.log("DEBUG req.body recibido:", req.body);

    const {
      fecha_recepcion, temperatura_llegada, maximo, minimo, cantidad, salida, saldo, id_nombre_insumo,
      id_presentacion_k, id_casa_comercial, id_proveedor_k, lote, fecha_vencimiento, registro_invima, expediente_invima,
      estado_revision, temperatura_almacenamiento, id_clasificacion_riesgo, principio_activo, forma_farmaceutica,
      concentracion, unidad_medida, fecha_salida, fecha_inicio, fecha_terminacion, area, factura,
      costo_general, costo_caja, costo_prueba, iva, consumible, mes_registro, lab_sas, usuarioId
    } = req.body;

    //  Traer sede desde la sesión del usuario autenticado
    const id_sede = req.usuario.id_sede;

    if (!id_sede) {
      return res.status(401).json({ error: "No se encontró la sede del usuario en sesión." });
    }

    // Validar formato de fechas
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fecha_recepcion || !fechaRegex.test(fecha_recepcion)) {
      return res.status(400).json({ error: 'La fecha de recepción debe tener el formato YYYY-MM-DD' });
    }

    if (!fecha_vencimiento || !fechaRegex.test(fecha_vencimiento)) {
      return res.status(400).json({ error: 'La fecha de vencimiento debe tener el formato YYYY-MM-DD' });
    }

    // Validar lab/sas
    if (!["lab", "sas"].includes(lab_sas)) {
      return res.status(400).json({ error: "El campo solo puede ser 'lab' o 'sas'." });
    }

    // Validar nombre del insumo
    if (!id_nombre_insumo || (typeof id_nombre_insumo === "string" && id_nombre_insumo.trim() === "")) {
      return res.status(400).json({ error: "El nombre del reactivo  es obligatorio para que el stock funcione correctamente" });
    }

    // Validar la casa comercial
    if (!id_casa_comercial || (typeof id_casa_comercial === "string" && id_casa_comercial.trim() === "")) {
      return res.status(400).json({ error: "El nombre de la casa comercial es obligatorio para que el stock funcione correctamente" });
    }

    // Validar cantidad
    if (cantidad === undefined || cantidad === null || (typeof cantidad === 'string' && cantidad.trim() === '') || isNaN(Number(cantidad))) {
      return res.status(400).json({ error: "La cantidad es obligatoria para que el stock pueda funcionar correctamente" });
    }

    //  Validar o crear FK con sede
    const idNombreInsumo = await obtenerOcrearFK(pool, 'nombre_insumo', 'nombre_insumo', id_nombre_insumo, id_sede);
    const idPresentacion = await obtenerOcrearFK(pool, 'presentacion_k', 'presentacion_k', id_presentacion_k, id_sede);
    const idCasacomercial = await obtenerOcrearFK(pool, 'casa_comercial', 'casa_comercial', id_casa_comercial, id_sede);
    const idProveedor = await obtenerOcrearFK(pool, 'proveedor_k', 'proveedor_k', id_proveedor_k, id_sede);
    const idClasificacionRiesgo = await obtenerOcrearFK(pool, 'clasificacion_riesgo', 'clasificacion_riesgo', id_clasificacion_riesgo, id_sede);

    // ❌ Restricción: no permitir 'salida' en la creación
    if (salida !== undefined && salida !== null && Number(salida) > 0) {
      return res.status(400).json({
        error: "No se puede asignar una salida al crear un reactivo. La salida solo puede registrarse al actualizar un reactivo."
      });
    }

    //  Insertar kardex
    const [result] = await pool.query(

      `INSERT INTO kardex (
        fecha_recepcion, temperatura_llegada, maximo, minimo, cantidad, salida, saldo, id_nombre_insumo,
        id_presentacion_k, id_casa_comercial, id_proveedor_k, lote, fecha_vencimiento, registro_invima, expediente_invima,
        estado_revision, temperatura_almacenamiento, id_clasificacion_riesgo, principio_activo, forma_farmaceutica,
        concentracion, unidad_medida, fecha_salida, fecha_inicio, fecha_terminacion, area, factura,
        costo_general, costo_caja, costo_prueba, iva, consumible, mes_registro, lab_sas, usuarioId, id_sede
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        fecha_recepcion, temperatura_llegada, maximo, minimo, cantidad, salida, saldo, idNombreInsumo,
        idPresentacion, idCasacomercial, idProveedor, lote, fecha_vencimiento, registro_invima, expediente_invima,
        estado_revision, temperatura_almacenamiento, idClasificacionRiesgo, principio_activo, forma_farmaceutica,
        concentracion, unidad_medida, fecha_salida, fecha_inicio, fecha_terminacion, area, factura,
        costo_general, costo_caja, costo_prueba, iva, consumible, mes_registro, lab_sas, usuarioId, id_sede
      ]
    );

    //  Obtener nombre del usuario
    const [usuarioResult] = await pool.query(
      'SELECT nombre FROM usuarios WHERE id_usuario = ? AND id_sede = ?',
      [usuarioId, id_sede]
    );
    const nombreUsuario = usuarioResult.length > 0 ? usuarioResult[0].nombre : 'Desconocido';

    await registrarAuditoria('kardex', result.insertId, 'creó', req.usuario);


    //  Insertar en stock_inventario
    const [productoRow] = await pool.query(
      'SELECT nombre AS nombre_producto FROM nombre_insumo WHERE id_nombre_insumo = ? AND id_sede = ?',
      [idNombreInsumo, id_sede]
    );
    const nombre_producto = productoRow.length > 0 ? productoRow[0].nombre_producto : null;

    const cantidadNum = Number(cantidad);
    const casaId = Number(idCasacomercial);

    if (nombre_producto && cantidadNum > 0) {
      await pool.query(
        `INSERT INTO stock_inventario (nombre_producto, id_kardex, id_casa_comercial, cantidad_actual, id_sede, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [nombre_producto, result.insertId, casaId, cantidadNum, id_sede]
      );
    }

    res.status(201).json({ message: 'Registro en kardex creado exitosamente!', id_kardex: result.insertId });

  } catch (error) {
    console.error("❌ Error en /kardex:", error);
    res.status(500).json({ error: error.message });
  }
});


// Buscar kardex (con joins completos y filtros por sede)
router.get('/buscar_kardex', verificarToken, async (req, res) => {
  const { q, nombre, casa_comercial, lote, desde, hasta } = req.query;
  const id_sede = req.usuario.id_sede;

  if (!id_sede) {
    return res.status(400).json({ error: "No se encontró la sede activa en la sesión." });
  }

  let condiciones = ["k.id_sede = ?"];
  let valores = [id_sede];

  // Buscador único (q)
  if (q && q.trim() !== '') {
    const like = `%${q.trim()}%`;
    condiciones.push("(ni.nombre LIKE ? OR cc.nombre LIKE ? OR k.lote LIKE ?)");
    valores.push(like, like, like);
  }

  // Filtros opcionales
  if (nombre) {
    condiciones.push("ni.nombre LIKE ?");
    valores.push(`%${nombre}%`);
  }

  if (casa_comercial) {
    condiciones.push("cc.nombre LIKE ?");
    valores.push(`%${casa_comercial}%`);
  }

  if (lote) {
    condiciones.push("k.lote LIKE ?");
    valores.push(`%${lote}%`);
  }

  if (desde && hasta) {
    condiciones.push("k.fecha_recepcion BETWEEN ? AND ?");
    valores.push(desde, hasta);
  } else if (desde) {
    condiciones.push("k.fecha_recepcion >= ?");
    valores.push(desde);
  } else if (hasta) {
    condiciones.push("k.fecha_recepcion <= ?");
    valores.push(hasta);
  }

  // Query con todos los JOINs y filtrado por sede
  let sql = `
    SELECT
      k.id_kardex,
      k.id_sede,
      k.fecha_recepcion,
      k.temperatura_llegada,
      k.maximo,
      k.minimo,
      k.cantidad,
      k.salida,
      k.saldo,
      ni.nombre AS nombre_insumo,
      p.nombre AS presentacion_k,
      cc.nombre AS casa_comercial,
      pr.nombre AS proveedor,
      cr.nombre AS clasificacion_riesgo,
      k.lote,
      k.fecha_vencimiento,
      k.registro_invima,
      k.expediente_invima,
      k.estado_revision,
      k.temperatura_almacenamiento,
      k.principio_activo,
      k.forma_farmaceutica,
      k.concentracion,
      k.unidad_medida,
      k.fecha_salida,
      k.fecha_inicio,
      k.fecha_terminacion,
      k.area,
      k.factura,
      k.costo_general,
      k.costo_caja,
      k.costo_prueba,
      k.iva,
      k.consumible,
      k.mes_registro,
      k.lab_sas,
      k.usuarioId AS usuario_id,
      u.nombre AS usuario_nombre
    FROM kardex k
    LEFT JOIN nombre_insumo ni ON k.id_nombre_insumo = ni.id_nombre_insumo AND ni.id_sede = k.id_sede
    LEFT JOIN presentacion_k p ON k.id_presentacion_k = p.id_presentacion_k AND p.id_sede = k.id_sede
    LEFT JOIN casa_comercial cc ON k.id_casa_comercial = cc.id_casa_comercial AND cc.id_sede = k.id_sede
    LEFT JOIN proveedor_k pr ON k.id_proveedor_k = pr.id_proveedor_k AND pr.id_sede = k.id_sede
    LEFT JOIN clasificacion_riesgo cr ON k.id_clasificacion_riesgo = cr.id_clasificacion_riesgo AND cr.id_sede = k.id_sede
    LEFT JOIN usuarios u ON k.usuarioId = u.id_usuario AND u.id_sede = k.id_sede
  `;

  if (condiciones.length > 0) {
    sql += " WHERE " + condiciones.join(" AND ");
  }

  sql += " ORDER BY k.id_kardex DESC";

  try {
    const [rows] = await pool.query(sql, valores);
    res.json(rows);
  } catch (err) {
    console.error("Error en buscar_kardex:", err);
    res.status(500).json({ error: "Error al buscar en el kardex" });
  }
});

// Modificar kardex
function emptyToNull(val) {
  return val === undefined || val === null || (typeof val === 'string' && val.trim() === '') ? null : val;
}

router.put('/:id_kardex', verificarToken, async (req, res) => {
  const {
    fecha_recepcion, temperatura_llegada, maximo, minimo, cantidad, salida, saldo, id_nombre_insumo,
    id_presentacion_k, id_casa_comercial, id_proveedor_k, lote, fecha_vencimiento, registro_invima, expediente_invima,
    estado_revision, temperatura_almacenamiento, id_clasificacion_riesgo, principio_activo, forma_farmaceutica,
    concentracion, unidad_medida, fecha_salida, fecha_inicio, fecha_terminacion, area, factura,
    costo_general, costo_caja, costo_prueba, iva, consumible, mes_registro, lab_sas, usuarioId
  } = req.body;

  const { id_kardex } = req.params;
  const id_sede = req.usuario.id_sede;

  //validar el formato fecha
  const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!fecha_recepcion || !fechaRegex.test(fecha_recepcion)) {
    return res.status(400).json({ error: 'La fecha de recepción debe tener el formato YYYY-MM-DD' });
  }

  //Validar fecha vto
  if (!fecha_vencimiento || !fechaRegex.test(fecha_vencimiento)) {
    return res.status(400).json({ errror: 'La fecha de vencimineto debe tener el formato YYYY-MM-DD' })
  }

  // Validar lab/ sas
  if (!["lab", "sas"].includes(lab_sas)) {
    return res.status(400).json({ error: "El campo solo puede ser 'lab' o 'sas'." });
  }

  //Validar el campo reactivo 
  if (!id_nombre_insumo || (typeof id_nombre_insumo === "string" && id_nombre_insumo.trim() === "")) {
    return res.status(400).json({ error: "El nombre del reactivo es obligatorio" });
  }

  const fkFields = {
    id_nombre_insumo: emptyToNull(id_nombre_insumo),
    id_presentacion_k: emptyToNull(id_presentacion_k),
    id_casa_comercial: emptyToNull(id_casa_comercial),
    id_proveedor_k: emptyToNull(id_proveedor_k),
    id_clasificacion_riesgo: emptyToNull(id_clasificacion_riesgo)
  };

  try {
    // --- BLOQUE A: leer registro viejo (para comparar después)
    const [oldRows] = await pool.query('SELECT * FROM kardex WHERE id_kardex = ? AND id_sede = ?', [id_kardex, id_sede]);
    const oldKardex = oldRows.length > 0 ? oldRows[0] : null;
    if (!oldKardex) return res.status(404).json({ message: 'Reactivo no encontrado con ese ID' });

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
      `UPDATE kardex SET
                fecha_recepcion = ?, temperatura_llegada = ?, maximo = ?, minimo = ?, cantidad = ?, salida = ?, saldo = ?, id_nombre_insumo = ?,
                id_presentacion_k = ?, id_casa_comercial = ?, id_proveedor_k = ?, lote = ?, fecha_vencimiento = ?, registro_invima = ?, expediente_invima = ?,
                estado_revision = ?, temperatura_almacenamiento = ?, id_clasificacion_riesgo = ?, principio_activo = ?, forma_farmaceutica = ?,
                concentracion = ?, unidad_medida = ?, fecha_salida = ?, fecha_inicio = ?, fecha_terminacion = ?, area = ?, factura = ?,
                costo_general = ?, costo_caja = ?, costo_prueba = ?, iva = ?, consumible = ?, mes_registro = ?,	lab_sas = ?,	 usuarioId = ? WHERE id_kardex = ? And id_sede = ?`,
      [
        fecha_recepcion, temperatura_llegada, maximo, minimo, cantidadFinal, salida, saldo, fkFields.id_nombre_insumo,
        fkFields.id_presentacion_k, fkFields.id_casa_comercial, fkFields.id_proveedor_k, lote, fecha_vencimiento, registro_invima, expediente_invima,
        estado_revision, temperatura_almacenamiento, fkFields.id_clasificacion_riesgo, principio_activo, forma_farmaceutica,
        concentracion, unidad_medida, fecha_salida, fecha_inicio, fecha_terminacion, area, factura,
        costo_general, costo_caja, costo_prueba, iva, consumible, mes_registro, lab_sas, usuarioId, id_kardex, id_sede
      ]
    );
    const [usuarioResult] = await pool.query(
      'SELECT nombre FROM usuarios WHERE id_usuario = ? AND id_sede = ?',
      [usuarioId, id_sede]
    );
    const nombreUsuario = usuarioResult.length > 0 ? usuarioResult[0].nombre : 'Desconocido';
    await registrarAuditoria('kardex', id_kardex, 'modificó', req.usuario);

    //Notificar fecha de salida
    await procesarSalidas();
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Registro no encontrado con ese ID' });
    }

    try {
      // --- Valores antiguos 
      const oldCantidad = Number(oldKardex?.cantidad || 0);
      const oldSalida = Number(oldKardex?.salida || 0);
      const oldIdNombre = oldKardex?.id_nombre_insumo;
      const oldCasa = oldKardex?.id_casa_comercial;
      const oldFechaTermRaw = oldKardex?.fecha_terminacion;

      // --- Valores nuevos (si no vienen, usar viejo) 
      const newCantidad = (cantidad === undefined || cantidad === null || cantidad === '') ? oldCantidad : Number(cantidad);
      const newSalida = (salida === undefined || salida === null || salida === '') ? oldSalida : Number(salida);
      const newIdNombre = fkFields.id_nombre_insumo ?? oldIdNombre;
      const newCasa = fkFields.id_casa_comercial ?? oldCasa;
      const newFechaTermRaw = fecha_terminacion

      // --- Helper para parsear fechas 
      const parseDate = (v) => {
        if (!v) return null;
        const d = (v instanceof Date) ? v : new Date(v);
        return isNaN(d.getTime()) ? null : d;
      };

      const oldDate = parseDate(oldFechaTermRaw);
      const newTerminoDate = parseDate(newFechaTermRaw);

      // --- Obtener nombres legibles 
      const [oldNameRow] = await pool.query(
        'SELECT nombre AS nombre_producto FROM nombre_insumo WHERE id_nombre_insumo = ? AND id_sede = ?',
        [oldIdNombre, id_sede]
      );
      const oldNombreProducto = oldNameRow.length ? oldNameRow[0].nombre_producto : null;

      const [newNameRow] = await pool.query(
        'SELECT nombre AS nombre_producto FROM nombre_insumo WHERE id_nombre_insumo = ? AND id_sede = ?',
        [newIdNombre, id_sede]
      );
      const newNombreProducto = newNameRow.length ? newNameRow[0].nombre_producto : null;

      // --- Normalización 
      const oldNombreClean = oldNombreProducto ? oldNombreProducto.trim().toUpperCase() : null;
      const newNombreClean = newNombreProducto ? newNombreProducto.trim().toUpperCase() : null;

      // --- Leer la fila de stock correspondiente 
      const [stockRows] = await pool.query(
        'SELECT * FROM stock_inventario WHERE id_kardex = ? AND id_sede = ? LIMIT 1',
        [id_kardex, id_sede]
      );

      let stockRow = stockRows.length ? stockRows[0] : null;
      // --- Diferencias 
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
          'INSERT INTO stock_inventario (id_kardex, nombre_producto, id_casa_comercial, cantidad_actual, id_sede, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
          [id_kardex, newNombreProducto, newCasa, cantidadInicial, id_sede]
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
      const terminoYMD = toYMD(newFechaTermRaw);

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
        'UPDATE kardex SET cantidad = ?, salida = ? WHERE id_kardex = ? AND id_sede = ?',
        [newCantidad, newSalida, id_kardex, id_sede]
      );
    } catch (errAdjust) {
      console.error('ERROR ajustando stock en PUT:', errAdjust);
    }

    res.json({ message: 'Registro actualizado exitosamente', result });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//Buscar kardex por id
router.get('/:id_kardex', verificarToken, async (req, res) => {
  const { id_kardex } = req.params;
  const id_sede = req.usuario.id_sede;
  try {
    const [result] = await pool.query(
      `
      SELECT
        k.id_kardex,
        k.id_sede,
        k.fecha_recepcion,
        k.temperatura_llegada,
        k.maximo,
        k.minimo,
        k.cantidad,
        k.salida,
        k.saldo,

        -- Nombres en lugar de IDs
        ni.nombre  AS nombre_insumo,
        pk.nombre  AS presentacion,
        cc.nombre  AS casa_comercial,
        pr.nombre  AS proveedor,
        cr.nombre  AS clasificacion_riesgo,

        k.lote,
        k.fecha_vencimiento,
        k.registro_invima,
        k.expediente_invima,
        k.estado_revision,
        k.temperatura_almacenamiento,
        k.principio_activo,
        k.forma_farmaceutica,
        k.concentracion,
        k.unidad_medida,
        k.fecha_salida,
        k.fecha_inicio,
        k.fecha_terminacion,
        k.area,
        k.factura,
        k.costo_general,
        k.costo_caja,
        k.costo_prueba,
        k.iva,
        k.consumible,
        k.mes_registro,
        k.lab_sas,

        -- Usuario
        u.id_usuario AS usuario_id,
        u.nombre     AS usuario_nombre

      FROM kardex k
      LEFT JOIN nombre_insumo        ni ON k.id_nombre_insumo        = ni.id_nombre_insumo        AND ni.id_sede = k.id_sede
      LEFT JOIN presentacion_k       pk ON k.id_presentacion_k       = pk.id_presentacion_k       AND pk.id_sede = k.id_sede
      LEFT JOIN casa_comercial       cc ON k.id_casa_comercial       = cc.id_casa_comercial       AND cc.id_sede = k.id_sede
      LEFT JOIN proveedor_k          pr ON k.id_proveedor_k          = pr.id_proveedor_k          AND pr.id_sede = k.id_sede
      LEFT JOIN clasificacion_riesgo cr ON k.id_clasificacion_riesgo = cr.id_clasificacion_riesgo AND cr.id_sede = k.id_sede
      LEFT JOIN usuarios             u  ON k.usuarioId               = u.id_usuario               AND u.id_sede  = k.id_sede

      WHERE k.id_kardex = ? AND k.id_sede = ?
      `,
      [id_kardex, id_sede]
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se puede encontrar el kardex con el ID proporcionado en esta sede.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Kardex encontrado correctamente.',
      data: result[0]
    });
  } catch (error) {
    console.error("❌ Error en /:id_kardex:", error);
    res.status(500).json({
      success: false,
      message: 'Hubo un problema al obtener el kardex.',
      error: error.message
    });
  }
});


// Obtener todos los registros de kardex con nombres (no IDs)
router.get('/', verificarToken, async (req, res) => {
  try {
    const id_sede = req.usuario.id_sede;
    const [registros] = await pool.query(`
      SELECT
        k.id_kardex,
        k.id_sede,
        k.fecha_recepcion,
        k.temperatura_llegada,
        k.maximo,
        k.minimo,
        k.cantidad,
        k.salida,
        k.saldo,
        -- Nombres en lugar de IDs
        ni.nombre  AS nombre_insumo,
        pk.nombre  AS presentacion,
        cc.nombre  AS casa_comercial,
        pr.nombre  AS proveedor,
        cr.nombre  AS clasificacion_riesgo,

        k.lote,
        k.fecha_vencimiento,
        k.registro_invima,
        k.expediente_invima,
        k.estado_revision,
        k.temperatura_almacenamiento,
        k.principio_activo,
        k.forma_farmaceutica,
        k.concentracion,
        k.unidad_medida,
        k.fecha_salida,
        k.fecha_inicio,
        k.fecha_terminacion,
        k.area,
        k.factura,
        k.costo_general,
        k.costo_caja,
        k.costo_prueba,
        k.iva,
        k.consumible,
        k.mes_registro,
        k.lab_sas,

        -- Usuario: ID y nombre
        u.id_usuario AS usuario_id,
        u.nombre     AS usuario_nombre

      FROM kardex k
      LEFT JOIN nombre_insumo        ni ON k.id_nombre_insumo        = ni.id_nombre_insumo        AND ni.id_sede = ?
      LEFT JOIN presentacion_k       pk ON k.id_presentacion_k       = pk.id_presentacion_k       AND pk.id_sede = ?
      LEFT JOIN casa_comercial       cc ON k.id_casa_comercial       = cc.id_casa_comercial       AND cc.id_sede = ?
      LEFT JOIN proveedor_k          pr ON k.id_proveedor_k          = pr.id_proveedor_k          AND pr.id_sede = ?
      LEFT JOIN clasificacion_riesgo cr ON k.id_clasificacion_riesgo = cr.id_clasificacion_riesgo AND cr.id_sede = ?
      LEFT JOIN usuarios             u  ON k.usuarioId               = u.id_usuario               AND u.id_sede  = ?
      WHERE k.id_sede = ?
      ORDER BY k.id_kardex DESC
    `, [
      id_sede, // ni
      id_sede, // pk
      id_sede, // cc
      id_sede, // pr
      id_sede, // cr
      id_sede, // u
      id_sede  // k
    ]);

    res.json(registros);
  } catch (error) {
    console.error("Error en GET /kardex:", error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar un registro del kardex
router.delete('/:id_kardex', verificarToken, async (req, res) => {
  const { id_kardex } = req.params;
  const { usuarioId } = req.body;
  const id_sede = req.usuario.id_sede;

  try {
    // 1) Obtener el kardex antes de eliminar
    const [kardex] = await pool.query(
      'SELECT * FROM kardex WHERE id_kardex = ? AND id_sede = ?',
      [id_kardex, id_sede]
    );
    if (kardex.length === 0) {
      return res.status(404).json({ success: false, message: 'No existe un registro con ese ID de reactivo' });
    }

    const registro = kardex[0];
    const cantidad = Number(registro.cantidad || 0);
    const salida = Number(registro.salida || 0);
    const cantidadRestanteKardex = Math.max(cantidad - salida, 0); // ✅ la que realmente queda disponible
    const idNombre = registro.id_nombre_insumo;
    const idCasa = registro.id_casa_comercial;

    // 2) Obtener nombre del insumo
    const [nameRows] = await pool.query(
      'SELECT nombre AS nombre_producto FROM nombre_insumo WHERE id_nombre_insumo = ? AND id_sede = ?',
      [idNombre, id_sede]
    );
    const nombreProducto = nameRows.length ? nameRows[0].nombre_producto : null;

    if (nombreProducto) {
      // 3) Buscar todos los registros de stock para este producto
      const [stockRows] = await pool.query(
        `SELECT * FROM stock_inventario
       WHERE nombre_producto = ? AND id_casa_comercial = ? AND id_sede = ?
       ORDER BY id_stock_inventario ASC`,
        [nombreProducto, idCasa, id_sede]
      );

      let cantidadRestante = cantidadRestanteKardex; // ✅ solo se descuenta lo que realmente quedaba

      for (const stock of stockRows) {
        const stockActual = Number(stock.cantidad_actual || 0);

        if (stockActual <= cantidadRestante) {
          // Si el stock es menor o igual → eliminar el registro completo
          await pool.query(
            'DELETE FROM stock_inventario WHERE id_stock_inventario = ? AND id_sede = ?',
            [stock.id_stock_inventario, id_sede]
          );
          cantidadRestante -= stockActual;
        } else {
          // Si el stock es mayor → solo restar la cantidad que quedaba
          const nuevoStock = stockActual - cantidadRestante;
          await pool.query(
            'UPDATE stock_inventario SET cantidad_actual = ? WHERE id_stock_inventario = ? AND id_sede = ?',
            [nuevoStock, stock.id_stock_inventario, id_sede]
          );
          cantidadRestante = 0;
          break;
        }
      }

      // Si después de descontar todo, el stock quedó en 0 → asegurar limpieza
      const [verificarStock] = await pool.query(
        `SELECT SUM(cantidad_actual) AS total FROM stock_inventario
       WHERE nombre_producto = ? AND id_casa_comercial = ? AND id_sede = ?`,
        [nombreProducto, idCasa, id_sede]
      );

      const totalStock = Number(verificarStock[0].total || 0);
      if (totalStock <= 0) {
        await pool.query(
          `DELETE FROM stock_inventario
         WHERE nombre_producto = ? AND id_casa_comercial = ? AND id_sede = ?`,
          [nombreProducto, idCasa, id_sede]
        );
      }
    }

    // 4) Registrar auditoría antes de eliminar
    await registrarAuditoria('kardex', id_kardex, 'eliminó', req.usuario);

    // 5) Eliminar registro del kardex
    await pool.query('DELETE FROM kardex WHERE id_kardex = ? AND id_sede = ?', [id_kardex, id_sede]);

    res.status(202).json({ success: true, message: 'Registro eliminado y stock ajustado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Hubo un problema al intentar eliminar el registro',
      error: error.message
    });
  }
});
module.exports = router;

