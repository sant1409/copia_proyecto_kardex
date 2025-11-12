//Reporte de un reactivo 

import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

// Función que busca valores dentro de objetos (incluso si están anidados o con otros nombres)
const findValue = (obj, keys) => {
  if (!obj) return null;
  const entries = Object.entries(obj);
  for (const [k, v] of entries) {
    if (keys.includes(k)) return v;
    if (typeof v === "object") {
      const nested = findValue(v, keys);
      if (nested) return nested;
    }
  }
  return null;
};


// =========================
// Estilos
// =========================
const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontSize: 11,
    lineHeight: 1.5,
  },
  title: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  headerBlock: { marginBottom: 12 },
  label: { fontWeight: "bold" },
  fieldLine: { marginBottom: 4 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginTop: 10, marginBottom: 6 },
  paragraph: { textAlign: "justify", marginBottom: 8 },
  smallItalic: { fontStyle: "italic", fontSize: 10, color: "#666" },
  alert: { color: "red", fontWeight: "bold" },
  warning: { color: "orange", fontWeight: "bold" },
});

// =========================
// Utils
// =========================
const safe = (v) => (v === null || v === undefined ? "" : v);
const isEmpty = (v) => v === null || v === undefined || v === "" || v === "-" || v === "N/A";

const formatDate = (iso) => {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return null;
  }
};

const daysBetween = (from, to) => {
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
};

const monthsBetween = (from, to) => {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
};

const plural = (n, singular, pluralForm = null) => {
  if (n === 1) return `${n} ${singular}`;
  return `${n} ${pluralForm || singular + "s"}`;
};

// =========================
// Texto narrativo largo
// =========================
const buildRecepcionTexto = (r) => {
  const fr = formatDate(r.fecha_recepcion);
  const tempLleg = safe(r.temperatura_llegada);
  const tempRange =
    r.temperatura_almacenamiento ||
    (r.temperatura_minima && r.temperatura_maxima
      ? `${r.temperatura_minima}°C - ${r.temperatura_maxima}°C`
      : null);

  if (!fr)
    return "La fecha de recepción no fue registrada en el sistema. Por favor, registra la fecha de recepción para mantener la trazabilidad del lote.";

  let text = `El reactivo ${safe(r.nombre_insumo) || "sin nombre registrado"} fue recibido el ${fr}.`;
  if (!isEmpty(tempLleg) && tempRange) {
    text += ` A su llegada se registró una temperatura de ${tempLleg}, la cual su rango óptimo de almacenamiento es de  ${tempRange}. `;
    text +=
      "Este control térmico al momento de la recepción contribuye a preservar las propiedades químicas del reactivo y la validez de los ensayos.";
  } else if (!isEmpty(tempLleg)) {
    text += ` A su llegada se registró una temperatura de ${tempLleg}°C.`;
  } else if (tempRange) {
    text += ` El rango de almacenamiento recomendado es ${tempRange}.`;
  } else {
    text +=
      " No hay registros de temperatura a la recepción ni rango de almacenamiento especificado.";
  }

  return text;
};

const buildPresentacionTexto = (r) => {
  const pres = safe(r.presentacion);
  const prov = safe(r.proveedor);
  const casa = safe(r.casa_comercial);

  let text = "";

  if (pres) {
    text += `El reactivo se presenta en ${pres}. `;
  } else {
    text += "La presentación comercial del reactivo no ha sido especificada. ";
  }

  if (prov) {
    text += `Fue suministrado por ${prov}`;
    if (casa) text += ` a través de la casa comercial ${casa}`;
    text += ". ";
  } else if (casa) {
    text += `El proveedor no está registrado pero figura la casa comercial ${casa}. `;
  } else {
    text += "No hay información registrada sobre el proveedor o la casa comercial. ";
  }

  return text;
};

const buildInventarioTexto = (r) => {
  const cantidad = Number(r.cantidad) || 0;
  const salida = isNaN(Number(r.salida)) ? null : Number(r.salida);
  const saldo = isNaN(Number(r.saldo)) ? null : Number(r.saldo);
  const area = r.area ? String(r.area) : null;

  if (cantidad === 0 && (saldo === null || saldo === 0)) {
    return "No hay registros de cantidad ni saldo. El inventario no permite evaluar la disponibilidad del reactivo.";
  }

  let text = `Se registró una recepción de ${cantidad} ${cantidad === 1 ? "unidad" : "unidades"}. `;

  if (salida !== null && salida > 0) {
    text += `Hasta la fecha se reportaron ${salida} ${salida === 1 ? "salida" : "salidas"} del lote. `;
  } else {
    text += "No se registraron salidas hasta el momento. ";
  }

  if (saldo !== null) {
    if (saldo <= 0) {
      text += "Actualmente no hay saldo registrado en el reactivo. ";
    } else {
      text += `El saldo actual es de ${saldo} ${saldo === 1 ? "unidad" : "unidades"}. `;
    }
  }

  if (area) text += `Área(s) asignada(s): ${area}. `;

  return text;
};

const buildSeguridadTexto = (r) => {
  if (!r.clasificacion_riesgo) return "";
  return `Clasificado como ${r.clasificacion_riesgo}. Se deben observar los protocolos de manipulación, almacenamiento y disposición establecidos para esta clasificación de riesgo. Consulte las fichas de seguridad del proveedor si se requiere información adicional.`;
};

const buildRegulatorioTexto = (r) => {
  const reg = r.registro_invima ? `Registro INVIMA: ${r.registro_invima}. ` : "";
  const exp = r.expediente_invima ? `Expediente INVIMA: ${r.expediente_invima}. ` : "";
  const estado = r.estado_revision ? `Estado de revisión: ${r.estado_revision}. ` : "";
  if (!reg && !exp && !estado)
    return "No se registraron datos regulatorios en el sistema para este reactivo.";
  return reg + exp + estado + "Estos datos permiten verificar la autorización sanitaria y trazabilidad del producto.";
};

const buildFarmaceuticoTexto = (r) => {
  const partes = [];
  if (r.principio_activo) partes.push(`Principio activo: ${r.principio_activo}`);
  if (r.forma_farmaceutica) partes.push(`Forma farmacéutica: ${r.forma_farmaceutica}`);
  if (r.concentracion) partes.push(`Concentración: ${r.concentracion}`);
  if (r.unidad_medida) partes.push(`Unidad de medida: ${r.unidad_medida}`);
  if (partes.length === 0)
    return "No hay información farmacéutica registrada para este reactivo.";
  return partes.join(". ") + ".";
};

const buildVencimientoTexto = (r) => {
  if (!r.fecha_vencimiento) return "Fecha de vencimiento no registrada.";
  const hoy = new Date();
  const venc = new Date(r.fecha_vencimiento);
  const dias = daysBetween(hoy, venc);
  const meses = monthsBetween(hoy, venc);

  if (r.fecha_terminacion) {
    return `Fecha de vencimiento registrada: ${formatDate(
      r.fecha_vencimiento
    )}. Nota: el registro muestra fecha de terminación ${formatDate(
      r.fecha_terminacion
    )} — debe tratarse como finalizado.`;
  }

  if (dias < 0) {
    const diasDesde = Math.abs(daysBetween(venc, hoy));
    return `❌ El reactivo venció el ${formatDate(
      r.fecha_vencimiento
    )} (hace ${plural(diasDesde, "día")}). No debe utilizarse.`;
  }

  if (dias <= 7) {
    return `⚠️ El reactivo vence el ${formatDate(
      r.fecha_vencimiento
    )} (en ${plural(dias, "día")}). Priorice su uso inmediato o reposición.`;
  }

  if (dias <= 30) {
    return `⚠️ Próximo a vencer: la fecha de vencimiento es el ${formatDate(
      r.fecha_vencimiento
    )} (en ${plural(dias, "día")}). Planifique uso y reposición.`;
  }

  return `Fecha de vencimiento: ${formatDate(
    r.fecha_vencimiento
  )} (faltan ${plural(dias, "día")}, ~${plural(
    Math.ceil(meses),
    "mes"
  )}). El lote se encuentra dentro del periodo de uso seguro.`;
};


// Texto de terminación corregido
const buildTerminacionTexto = (r) => {
  if (!r.fecha_terminacion) return "";

  const hoy = new Date();
  const terminacion = new Date(r.fecha_terminacion);

  if (terminacion >= hoy) {
    return `El registro indica una fecha de terminación prevista para el ${formatDate(
      r.fecha_terminacion
    )}. Hasta esa fecha, el reactivo permanece disponible para uso.`;
  }

  return `El registro muestra fecha de terminación el ${formatDate(
    r.fecha_terminacion
  )}, lo que indica que el reactivo fue cerrado o consumido y ya no está disponible.`;
};

const buildCostosTexto = (r) => {
  const parts = [];
  if (r.factura) parts.push(`Factura: ${r.factura}`);
  if (r.costo_general !== undefined && r.costo_general !== "")
    parts.push(`Costo general: ${r.costo_general}`);
  if (r.costo_caja !== undefined && r.costo_caja !== "")
    parts.push(`Costo por caja: ${r.costo_caja}`);
  if (r.costo_prueba !== undefined && r.costo_prueba !== "")
    parts.push(`Costo por prueba: ${r.costo_prueba}`);
  if (parts.length === 0) return "No hay información de costos o facturación registrada.";
  return parts.join(". ") + ".";
};

// =========================
// Componente principal
// =========================
export default function ReporteReactivo({ reactivo }) {
  if (!reactivo || typeof reactivo !== "object") {
    return (
      <Document>
        <Page style={styles.page}>
          <Text style={styles.title}>Reporte de Reactivo</Text>
          <Text style={styles.paragraph}>
            ⚠️ No se encontró información del reactivo. Seleccione un registro válido e inténtelo
            nuevamente.
          </Text>
        </Page>
      </Document>
    );
  }

    console.log("🧩 REACTIVO PDF:", JSON.stringify(reactivo, null, 2));

  const recepcionTexto = buildRecepcionTexto(reactivo);
  const presentacionTexto = buildPresentacionTexto(reactivo);
  const inventarioTexto = buildInventarioTexto(reactivo);
  const seguridadTexto = buildSeguridadTexto(reactivo);
  const regulatorioTexto = buildRegulatorioTexto(reactivo);
  const farmaceuticoTexto = buildFarmaceuticoTexto(reactivo);
  const vencimientoTexto = buildVencimientoTexto(reactivo);
  const terminacionTexto = buildTerminacionTexto(reactivo);
  const costosTexto = buildCostosTexto(reactivo);

 // Estado corregido
const estadoResumen = (() => {
  const hoy = new Date();
  const vencimiento = reactivo.fecha_vencimiento
    ? new Date(reactivo.fecha_vencimiento)
    : null;
  const terminacion = reactivo.fecha_terminacion
    ? new Date(reactivo.fecha_terminacion)
    : null;

  if (terminacion && terminacion < hoy) return "finalizado"; // ya terminó
  if (vencimiento && vencimiento < hoy) return "vencido";
  if (vencimiento && daysBetween(hoy, vencimiento) <= 30) return "por_vencer";
  if (terminacion && terminacion >= hoy) return "en_uso"; // sigue disponible hasta esa fecha
  return "vigente";
})();

  const diasParaVencimiento = reactivo.fecha_vencimiento
    ? daysBetween(new Date(), new Date(reactivo.fecha_vencimiento))
    : null;

  const camposClave = ["proveedor", "registro_invima", "principio_activo", "fecha_vencimiento"];
  const faltanClaves = camposClave.some((c) => isEmpty(reactivo[c]));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Reporte de Reactivo</Text>

        {/* Encabezado */}
<View style={styles.headerBlock}>
  <Text style={styles.fieldLine}>
    <Text style={styles.label}>Nombre:</Text>{" "}
    {safe(reactivo.nombre_insumo || reactivo.nombre || reactivo.descripcion) || "No registrado"}
  </Text>

  <Text style={styles.fieldLine}>
    <Text style={styles.label}>Lote:</Text>{" "}
    {safe(reactivo.lote || reactivo.num_lote) || "No registrado"}
  </Text>

  <Text style={styles.fieldLine}>
    <Text style={styles.label}>Tipo:</Text>{" "}
    {safe(reactivo.lab_sas || reactivo.tipo || reactivo.codigo_interno || reactivo.codigo || reactivo.cod_interno) || "No registrado"}
  </Text>

  <Text style={styles.fieldLine}>
    <Text style={styles.label}>Registro:</Text>{" "}
    {safe(reactivo.mes_registro || reactivo.registro || reactivo.fecha_registro || reactivo.registro_lote || reactivo.reg) || "No registrado"}
  </Text>
</View>


        {/* Secciones */}
        <Text style={styles.sectionTitle}>1. Recepción y condiciones de almacenamiento</Text>
        <Text style={styles.paragraph}>{recepcionTexto}</Text>

        <Text style={styles.sectionTitle}>2. Presentación y proveedor</Text>
        <Text style={styles.paragraph}>{presentacionTexto}</Text>

        <Text style={styles.sectionTitle}>3. Inventario y disponibilidad</Text>
        <Text style={styles.paragraph}>{inventarioTexto}</Text>

        <Text style={styles.sectionTitle}>4. Seguridad y clasificación</Text>
        <Text style={styles.paragraph}>
          {seguridadTexto || "No hay clasificación de riesgo registrada para este reactivo."}
        </Text>

        <Text style={styles.sectionTitle}>5. Información regulatoria</Text>
        <Text style={styles.paragraph}>{regulatorioTexto}</Text>

        <Text style={styles.sectionTitle}>6. Características farmacéuticas y composición</Text>
        <Text style={styles.paragraph}>{farmaceuticoTexto}</Text>

        <Text style={styles.sectionTitle}>7. Fecha de vencimiento</Text>
        <Text
          style={[
            styles.paragraph,
            estadoResumen === "vencido"
              ? styles.alert
              : estadoResumen === "por_vencer"
              ? styles.warning
              : {},
          ]}
        >
          {vencimientoTexto}
        </Text>

        {terminacionTexto && (
          <>
            <Text style={styles.sectionTitle}>8. Fecha de terminación</Text>
            <Text style={styles.paragraph}>{terminacionTexto}</Text>
          </>
        )}

        <Text style={styles.sectionTitle}>9. Costos y facturación</Text>
        <Text style={styles.paragraph}>{costosTexto}</Text>

       <Text style={styles.sectionTitle}>Resumen ejecutivo</Text>
        <Text style={styles.paragraph}>
         En resumen, el lote {safe(reactivo.lote) || "(sin lote)"}{" "}
         {safe(reactivo.nombre_insumo) ? `correspondiente a ${safe(reactivo.nombre_insumo)}` : ""}{" "}
         {reactivo.fecha_vencimiento && new Date(reactivo.fecha_vencimiento) < new Date()
          ? `❌ El reactivo ya venció el ${formatDate(reactivo.fecha_vencimiento)} y no debe utilizarse.`
         : terminacionTexto
          ? `Tiene una fecha de terminación prevista para el ${formatDate(reactivo.fecha_terminacion)} y permanece disponible para uso.`
          : estadoResumen === "por_vencer"
          ? `Está próximo a vencer en ${plural(Math.max(0, diasParaVencimiento), "día")}.`
          : estadoResumen === "vigente"
          ? "Está vigente y dentro de parámetros aceptables."
          : "Información insuficiente para determinar el estado actual."}
          </Text>

        <Text style={styles.paragraph}>
          Este reporte fue generado automáticamente a partir de los datos registrados en el sistema del reactivo .
        </Text>

        {faltanClaves && (
          <Text style={[styles.smallItalic, { marginTop: 8 }]}>
            Nota: Algunos datos regulatorios o de composición fundamentales no están registrados.
            Complete estos campos para garantizar trazabilidad y el reporte completo del reactivo.
          </Text>
        )}
      </Page>
    </Document>
  );
}

