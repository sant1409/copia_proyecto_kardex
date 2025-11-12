//Reporte de un insumo 

import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

// Función que busca valores dentro de objetos (incluso si están anidados)
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
const buildRecepcionTexto = (i) => {
  const fr = formatDate(i.fecha);
  const tempLleg = safe(i.temperatura);

  if (!fr)
    return "La fecha de recepción no fue registrada en el sistema. Por favor, registra la fecha de recepción para mantener la trazabilidad del insumo.";

  let text = `El insumo ${safe(i.nombre_del_insumo) || "sin nombre registrado"} fue recibido el ${fr}.`;

  if (!isEmpty(tempLleg)) {
    text += ` A su llegada se registró una temperatura de ${tempLleg}.`;
  } else {
    text += " No hay registros de temperatura al momento de la recepción.";
  }

  return text;
};


const buildPresentacionTexto = (i) => {
  const pres = safe(i.presentacion);
  const prov = safe(i.proveedor);
  const lab = safe(i.laboratorio);

  let text = "";
  if (pres) text += `El insumo se presenta en ${pres}. `;
  else text += "La presentación comercial del insumo no ha sido especificada. ";

  if (prov) {
    text += `Fue suministrado por ${prov}`;
    if (lab) text += ` a través del laboratorio ${lab}`;
    text += ". ";
  } else if (lab) {
    text += `El proveedor no está registrado pero figura el laboratorio ${lab}. `;
  } else {
    text += "No hay información registrada sobre el proveedor o laboratorio. ";
  }

  return text;
};

const buildInventarioTexto = (i) => {
  const cantidad = Number(i.cantidad) || 0;
  const salida = isNaN(Number(i.salida)) ? null : Number(i.salida);
  const saldo = isNaN(Number(i.saldo)) ? null : Number(i.saldo);

  if (cantidad === 0 && (saldo === null || saldo === 0)) {
    return "No hay registros de cantidad ni saldo. El inventario no permite evaluar la disponibilidad del insumo.";
  }

  let text = `Se registró una recepción de ${cantidad} ${cantidad === 1 ? "unidad" : "unidades"}. `;

  if (salida !== null && salida > 0) {
    text += `Hasta la fecha se reportaron ${salida} ${salida === 1 ? "salida" : "salidas"} del lote. `;
  } else {
    text += "No se registraron salidas hasta el momento. ";
  }

  if (saldo !== null) {
    if (saldo <= 0) text += "Actualmente no hay saldo registrado en el insumo. ";
    else text += `El saldo actual es de ${saldo} ${saldo === 1 ? "unidad" : "unidades"}. `;
  }

  return text;
};

const buildSeguridadTexto = (i) => {
  if (!i.clasificacion) return "";
  return `Clasificado como ${i.clasificacion}. Se deben observar los protocolos de manipulación, almacenamiento y disposición establecidos para esta clasificación.`;
};

const buildRegulatorioTexto = (i) => {
  const reg = i.registro_invima ? `Registro INVIMA: ${i.registro_invima}. ` : "";
  const exp = i.expediente_invima ? `Expediente INVIMA: ${i.expediente_invima}. ` : "";
  const estado = i.estado_de_revision ? `Estado de revisión: ${i.estado_de_revision}. ` : "";
  if (!reg && !exp && !estado) return "No se registraron datos regulatorios en el sistema para este insumo.";
  return reg + exp + estado + "Estos datos permiten verificar la autorización sanitaria y trazabilidad del producto.";
};

const buildCostosTexto = (i) => {
  const parts = [];
  if (i.factura) parts.push(`Factura: ${i.factura}`);
  if (i.costo_global) parts.push(`Costo general: ${i.costo_global}`);
  if (i.costo) parts.push(`Costo por caja: ${i.costo}`);
  if (i.costo_prueba) parts.push(`Costo por prueba: ${i.costo_prueba}`);
  if (i.costo_unidad) parts.push(`Costo por unidad: ${i.costo_unidad}`);
  if (parts.length === 0) return "No hay información de costos o facturación registrada.";
  return parts.join(". ") + ".";
};

const buildVencimientoTexto = (i) => {
  if (!i.fecha_de_vto) return "Fecha de vencimiento no registrada.";
  const hoy = new Date();
  const venc = new Date(i.fecha_de_vto);
  const dias = daysBetween(hoy, venc);
  const meses = monthsBetween(hoy, venc);

  if (i.termino) {
    return `Fecha de vencimiento registrada: ${formatDate(i.fecha_de_vto)}. Nota: Se debe de tener en cuanta la fecha de vencimiento , pero mas que todo cuando se termina el insumo${formatDate(
      i.termino
    )} `;
  }

  if (dias < 0) {
    const diasDesde = Math.abs(daysBetween(venc, hoy));
    return `❌ El insumo venció el ${formatDate(i.fecha_de_vto)} (hace ${plural(diasDesde, "día")}). No debe utilizarse.`;
  }

  if (dias <= 7) {
    return `⚠️ El insumo vence el ${formatDate(i.fecha_de_vto)} (en ${plural(dias, "día")}). Priorice su uso inmediato o reposición.`;
  }

  if (dias <= 30) {
    return `⚠️ Próximo a vencer: la fecha de vencimiento es el ${formatDate(i.fecha_de_vto)} (en ${plural(dias, "día")}). Planifique uso y reposición.`;
  }

  return `Fecha de vencimiento: ${formatDate(i.fecha_de_vto)} (faltan ${plural(dias, "día")}, ~${plural(
    Math.ceil(meses),
    "mes"
  )}). El lote se encuentra dentro del periodo de uso seguro.`;
};

const buildTerminacionTexto = (i) => {
  if (!i.termino) return "";

  const hoy = new Date();
  const termino = new Date(i.termino);

  // Normalizamos las fechas a solo día, sin hora, para comparar correctamente
  const hoySolo = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const terminoSolo = new Date(termino.getFullYear(), termino.getMonth(), termino.getDate());

  const diasDiferencia = daysBetween(hoySolo, terminoSolo);

  if (diasDiferencia > 0) {
    // La fecha de terminación aún no llega
    return `El registro indica que la fecha de terminación está prevista para el ${formatDate(
      i.termino
    )}, por lo que el insumo aún permanece disponible para uso.`;
  } else if (diasDiferencia === 0) {
    // La fecha de terminación es hoy
    return `El registro indica que la fecha de terminación es hoy (${formatDate(
      i.termino
    )}). Se recomienda verificar disponibilidad y uso inmediato del insumo.`;
  } else {
    // La fecha de terminación ya pasó
    return `El registro muestra que la fecha de terminación fue el ${formatDate(
      i.termino
    )}, indicando que el insumo ha sido cerrado o consumido y ya no está disponible.`;
  }
};

// =========================
// Componente principal
// =========================
export default function ReporteInsumo({ insumo }) {
  if (!insumo || typeof insumo !== "object") {
    return (
      <Document>
        <Page style={styles.page}>
          <Text style={styles.title}>Reporte de Insumo</Text>
          <Text style={styles.paragraph}>
            ⚠️ No se encontró información del insumo. Seleccione un registro válido e inténtelo nuevamente.
          </Text>
        </Page>
      </Document>
    );
  }

  const recepcionTexto = buildRecepcionTexto(insumo);
  const presentacionTexto = buildPresentacionTexto(insumo);
  const inventarioTexto = buildInventarioTexto(insumo);
  const seguridadTexto = buildSeguridadTexto(insumo);
  const regulatorioTexto = buildRegulatorioTexto(insumo);
  const vencimientoTexto = buildVencimientoTexto(insumo);
  const terminacionTexto = buildTerminacionTexto(insumo);
  const costosTexto = buildCostosTexto(insumo);

  // Estado resumen
  const estadoResumen = (() => {
    const hoy = new Date();
    const vencimiento = insumo.fecha_de_vto ? new Date(insumo.fecha_de_vto) : null;
    const termino = insumo.termino ? new Date(insumo.termino) : null;

    if (termino && termino < hoy) return "finalizado";
    if (vencimiento && vencimiento < hoy) return "vencido";
    if (vencimiento && daysBetween(hoy, vencimiento) <= 30) return "por_vencer";
    if (termino && termino >= hoy) return "en_uso";
    return "vigente";
  })();

  const diasParaVencimiento = insumo.fecha_de_vto ? daysBetween(new Date(), new Date(insumo.fecha_de_vto)) : null;

  const camposClave = ["proveedor", "registro_invima", "nombre_del_insumo", "fecha_de_vto"];
  const faltanClaves = camposClave.some((c) => isEmpty(insumo[c]));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Reporte de Insumo</Text>

        {/* Encabezado */}
        <View style={styles.headerBlock}>
          <Text style={styles.fieldLine}>
            <Text style={styles.label}>Nombre:</Text> {safe(insumo.nombre_del_insumo) || "No registrado"}
          </Text>
          <Text style={styles.fieldLine}>
            <Text style={styles.label}>Lote:</Text> {safe(insumo.lote) || "No registrado"}
          </Text>
          <Text style={styles.fieldLine}>
            <Text style={styles.label}>Categoría:</Text> {safe(insumo.categoria || insumo.lab_sas) || "No registrado"}
          </Text>
          <Text style={styles.fieldLine}>
            <Text style={styles.label}>Registro:</Text> {safe(insumo.mes_registro) || "No registrado"}
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
        <Text style={styles.paragraph}>{seguridadTexto || "No hay clasificación registrada para este insumo."}</Text>

        <Text style={styles.sectionTitle}>5. Información regulatoria</Text>
        <Text style={styles.paragraph}>{regulatorioTexto}</Text>

        <Text style={styles.sectionTitle}>6. Fecha de vencimiento</Text>
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
            <Text style={styles.sectionTitle}>7. Fecha de terminación</Text>
            <Text style={styles.paragraph}>{terminacionTexto}</Text>
          </>
        )}

        <Text style={styles.sectionTitle}>8. Costos y facturación</Text>
        <Text style={styles.paragraph}>{costosTexto}</Text>

        <Text style={styles.sectionTitle}>Resumen ejecutivo</Text>
        <Text style={styles.paragraph}>
          En resumen, el lote {safe(insumo.lote) || "(sin lote)"}{" "}
          {safe(insumo.nombre_del_insumo) ? `correspondiente a ${safe(insumo.nombre_del_insumo)}` : ""}{" "}
          {insumo.fecha_de_vto && new Date(insumo.fecha_de_vto) < new Date()
            ? `❌ El insumo ya venció el ${formatDate(insumo.fecha_de_vto)} y no debe utilizarse.`
            : terminacionTexto
            ? `Tiene una fecha de terminación prevista para el ${formatDate(insumo.termino)} y permanece disponible para uso.`
            : estadoResumen === "por_vencer"
            ? `Está próximo a vencer en ${plural(Math.max(0, diasParaVencimiento), "día")}.`
            : estadoResumen === "vigente"
            ? "Está vigente y dentro de parámetros aceptables."
            : "Información insuficiente para determinar el estado actual."}
        </Text>

        <Text style={styles.paragraph}>
          Este reporte fue generado automáticamente a partir de los datos registrados en el sistema del insumo.
        </Text>

        {faltanClaves && (
          <Text style={[styles.smallItalic, { marginTop: 8 }]}>
            Nota: Algunos datos regulatorios o de composición fundamentales no están registrados. Complete estos campos para garantizar trazabilidad y el reporte completo del insumo.
          </Text>
        )}
      </Page>
    </Document>
  );
}
