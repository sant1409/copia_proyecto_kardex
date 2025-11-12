/**
 * 🔔 Módulo de Notificaciones - Sistema Kardex
 * ------------------------------------------------------------
 * Este módulo gestiona la creación, consulta y envío de notificaciones 
 * automáticas relacionadas con insumos y reactivos del sistema Kardex.
 * 
 * 📦 Funcionalidades principales:
 *  - Crear y registrar notificaciones en base de datos (evita duplicados).
 *  - Generar alertas automáticas por vencimiento (7 días antes o el mismo día).
 *  - Crear notificaciones por salidas de insumos o reactivos (fecha de terminación).
 *  - Enviar correos automáticos a los suscriptores de cada sede con las alertas.
 *  - Permitir marcar notificaciones como leídas desde el sistema.
 * 
 * 🧠 Detalles técnicos:
 *  - Usa `pool` para conectarse a la base de datos MySQL.
 *  - Usa `nodemailer` con Gmail para enviar correos automáticos.
 *  - Todas las operaciones se filtran por `id_sede` para garantizar la separación por sedes.
 *  - Se puede cambiar el correo que envia las notificaciones, solo debemos bucar la clave especial que proporciona tu cuenta de gmail.
 * 
 * 📅 Autor: [Tu nombre o equipo]
 * 📂 Ubicación: /utils/notificaciones.js
 */


const pool = require('../db');
const nodemailer = require('nodemailer');

// 🔹 Función global para obtener fecha local en formato YYYY-MM-DD
function fechaLocalYYYYMMDD(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

// 🔹 Crear notificación
async function crearNotificacion({ tipo, id_kardex = null, id_insumo = null, mensaje, fecha_evento = null, creado_por = null, id_sede }) {
  const id_kardex_nn = id_kardex ?? 0;
  const id_insumo_nn = id_insumo ?? 0;
  const fecha_evento_date = fecha_evento ? new Date(fecha_evento).toISOString().split('T')[0] : null;

  const [result] = await pool.query(
    `INSERT IGNORE INTO notificaciones 
      (tipo, id_kardex, id_insumo, mensaje, fecha_evento, creado_por, id_kardex_nn, id_insumo_nn, fecha_evento_date, id_sede)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tipo, id_kardex, id_insumo, mensaje, fecha_evento, creado_por, id_kardex_nn, id_insumo_nn, fecha_evento_date, id_sede]
  );
  return result.insertId ? result.insertId : null;
}

// 🔹 Obtener notificaciones
async function obtenerNotificaciones({ soloNoLeidas = false, id_sede }) {
  let query = 'SELECT * FROM notificaciones WHERE id_sede = ? ORDER BY fecha_creacion DESC';
  let params = [id_sede];

  if (soloNoLeidas) {
    query = 'SELECT * FROM notificaciones WHERE leido = 0 AND id_sede = ? ORDER BY fecha_creacion DESC';
    params = [id_sede];
  }

  const [rows] = await pool.query(query, params);
  return rows;
}

// 🔹 Marcar notificación como leída
async function marcarLeida(id_notificacion, id_sede) {
  const [result] = await pool.query(
    'UPDATE notificaciones SET leido = 1 WHERE id_notificacion = ? AND id_sede = ?',
    [id_notificacion, id_sede]
  );
  return result.affectedRows > 0;
}

// 🔹 Crear notificación automática por vencimiento
async function generarNotificacionesAutomaticas(id_sede) {
  function normalizarFecha(fecha) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  }
 
  //Es hoy

  const hoy = fechaLocalYYYYMMDD(new Date()); // Siempre en hora local de Colombia

  function esFechaValida(fecha) {
    const d = new Date(fecha);
    return !isNaN(d.getTime());
  }
   
  // 1️⃣ Vencimiento de kardex (reactivos)
const [kardex] = await pool.query(`
  SELECT k.id_kardex, k.fecha_vencimiento, ni.nombre AS nombre_insumo, cc.nombre AS casa_comercial
  FROM kardex k
  LEFT JOIN nombre_insumo ni ON k.id_nombre_insumo = ni.id_nombre_insumo
  LEFT JOIN casa_comercial cc ON k.id_casa_comercial = cc.id_casa_comercial
  WHERE k.id_sede = ?  -- <<< filtro por sede
`, [id_sede]);          // <<< pasar id_sede como parámetro

for (const item of kardex) {
  if (!item.fecha_vencimiento || !esFechaValida(item.fecha_vencimiento)) continue;

  const fechaVto = normalizarFecha(new Date(item.fecha_vencimiento));
  
  const diffDias = Math.floor(
  (new Date(fechaLocalYYYYMMDD(fechaVto)) - new Date(hoy)) / (1000 * 60 * 60 * 24)
);

  const fechaStr = fechaLocalYYYYMMDD(fechaVto);


  if (diffDias === 7) {
    await crearNotificacion({
      tipo: 'vencimiento_kardex',
      id_kardex: item.id_kardex,
      mensaje: `El reactivo "${item.nombre_insumo}" de la casa comercial "${item.casa_comercial}" vencerá en 7 días .`,
      fecha_evento: fechaStr,
      id_sede                      // <<< agregamos id_sede
    });
  }

  if (diffDias === 0) {
    await crearNotificacion({
      tipo: 'vencimiento_kardex',
      id_kardex: item.id_kardex,
      mensaje: `⚠️ El reactivo "${item.nombre_insumo}" de la casa comercial "${item.casa_comercial}" vence HOY .`,
      fecha_evento: fechaStr,
      id_sede                      // <<< agregamos id_sede
    });
  }
}

// 2️⃣ Vencimiento de insumos
const [insumos] = await pool.query(`
  SELECT i.id_insumo, i.fecha_de_vto, ni.nombre AS nombre_del_insumo, l.nombre AS laboratorio
  FROM insumos i
  LEFT JOIN nombre_del_insumo ni ON i.id_nombre_del_insumo = ni.id_nombre_del_insumo
  LEFT JOIN laboratorio l ON i.id_laboratorio = l.id_laboratorio
  WHERE i.id_sede = ?  -- <<< filtro por sede
`, [id_sede]);          // <<< pasar id_sede como parámetro

for (const item of insumos) {
  if (!item.fecha_de_vto || !esFechaValida(item.fecha_de_vto)) continue;

  const fechaVto = normalizarFecha(new Date(item.fecha_de_vto));
    const diffDias = Math.floor(
  (new Date(fechaLocalYYYYMMDD(fechaVto)) - new Date(hoy)) / (1000 * 60 * 60 * 24)
);

  const fechaStr = fechaVto.toISOString().split('T')[0];

  if (diffDias === 7) {
    await crearNotificacion({
      tipo: 'vencimiento_insumo',
      id_insumo: item.id_insumo,
      mensaje: `El insumo "${item.nombre_del_insumo}" del laboratorio "${item.laboratorio}" vencerá en 7 días .`,
      fecha_evento: fechaStr,
      id_sede                    // <<< agregamos id_sede
    });
  }

  if (diffDias === 0) {
    await crearNotificacion({
      tipo: 'vencimiento_insumo',
      id_insumo: item.id_insumo,
      mensaje: `⚠️ El insumo "${item.nombre_del_insumo}" del laboratorio "${item.laboratorio}" vence HOY .`,
      fecha_evento: fechaStr,
      id_sede                    // <<< agregamos id_sede
    });
  }
}
}

// 🔹 Procesar salidas sin logs
async function procesarSalidas(id_sede) {
    try {  const hoy = fechaLocalYYYYMMDD(new Date()); // Siempre en hora local de Colombia

        // Salida de reactivos (kardex)
        const [kardexSalidas] = await pool.query(`
            SELECT k.id_kardex, k.fecha_terminacion, ni.nombre AS nombre_insumo, cc.nombre AS casa_comercial
            FROM kardex k
            LEFT JOIN nombre_insumo ni ON k.id_nombre_insumo = ni.id_nombre_insumo
            LEFT JOIN casa_comercial cc ON k.id_casa_comercial = cc.id_casa_comercial
            WHERE k.fecha_terminacion IS NOT NULL 
              AND k.fecha_terminacion <> ''
              AND k.id_sede = ?
        `, [id_sede]);

       for (const item of kardexSalidas) {
  const terminacionStr = item.fecha_terminacion ? String(item.fecha_terminacion).split('T')[0] : null;
  if (!terminacionStr || terminacionStr.startsWith('0000-00-00')) continue;

  // 🚫 No conviertas con new Date() — compara el string directo
  const fechaSalida = terminacionStr;  

  if (fechaSalida === hoy) {
    await crearNotificacion({
      tipo: 'salida_kardex',
      id_kardex: item.id_kardex,
      mensaje: `El reactivo "${item.nombre_insumo}" de la casa comercial "${item.casa_comercial}" ha sido dado de salida`,
      fecha_evento: fechaSalida,
      id_sede
    });
  }
}

 // Salida de insumos
const [insumosSalidas] = await pool.query(`
  SELECT i.id_insumo, i.termino, ndi.nombre AS nombre_del_insumo, l.nombre AS laboratorio
  FROM insumos i
  LEFT JOIN nombre_del_insumo ndi ON i.id_nombre_del_insumo = ndi.id_nombre_del_insumo
  LEFT JOIN laboratorio l ON i.id_laboratorio = l.id_laboratorio
  WHERE i.termino IS NOT NULL 
    AND i.termino <> '0000-00-00 00:00:00'
    AND i.id_sede = ?
`, [id_sede]);

for (const item of insumosSalidas) {
  const terminoStr = item.termino ? String(item.termino) : null;
  if (!terminoStr || terminoStr.startsWith('0000-00-00')) continue;

  // Si viene con hora/UTC lo normalizamos a YYYY-MM-DD local
  const fechaSalida = fechaLocalYYYYMMDD(new Date(terminoStr));

  if (fechaSalida === hoy) {
    await crearNotificacion({
      tipo: 'salida_insumo',
      id_insumo: item.id_insumo,
      mensaje: `El insumo "${item.nombre_del_insumo}" del laboratorio "${item.laboratorio}" ha sido dado de salida`,
      fecha_evento: fechaSalida,
      id_sede
    });
  }
}

    } catch (error) {
        console.error("❌ Error procesando salidas para id_sede:", id_sede, error);
    }
}

// 🔹 Enviar notificaciones por correo a los suscriptores de la sede
async function enviarNotificacionesPorCorreo(id_sede) {
  const [notis] = await pool.query(`
    SELECT * 
    FROM notificaciones
    WHERE enviado_email = 0
      AND id_sede = ?
  `, [id_sede]);

  if (!notis.length) return;

  // 🔹 Traer los correos suscritos a la sede
  const [suscriptores] = await pool.query(`
    SELECT correo 
    FROM suscripcion_notificaciones
    WHERE id_sede = ?
  `, [id_sede]);

  if (!suscriptores.length) return;

  const destinatarios = suscriptores.map(s => s.correo);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { 
      user: 'automatizarkardex@gmail.com', 
      pass: 'dnnv qksc ddma fkgm'
    }
  });

  for (const n of notis) {
    await transporter.sendMail({
      from: '"Kardex Sistema" <automatizarkardex@gmail.com>',
      to: destinatarios.join(','),
      subject: 'Notificación del Sistema Kardex',
      text: n.mensaje
    });

    await pool.query(
      `UPDATE notificaciones SET enviado_email = 1 WHERE id_notificacion = ? AND id_sede = ?`,
      [n.id_notificacion, id_sede]
    );
  }

  console.log('Notificaciones enviadas por correo a los suscriptores ✅');
}

module.exports = { 
  crearNotificacion, 
  obtenerNotificaciones, 
  marcarLeida, 
  procesarSalidas, 
  generarNotificacionesAutomaticas, 
  enviarNotificacionesPorCorreo 
};
