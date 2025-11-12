//Permite exportar registros de insumos por medio del mes, la categoria y el año

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportarInsumos(tirillas, categoriaSeleccionada, mesSeleccionado, anioSeleccionado) {
  // 1️⃣ Filtrar por categoría, mes y año
  const filtradas = tirillas.filter(t => {
    const d = t.detalle || {};
    const mesRegistro = String(d.mes_registro || "").trim();
    if (!mesRegistro) return false;

    const parts = mesRegistro.split("-");
    if (parts.length < 2) return false;

    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;

    const fecha = new Date(year, monthIndex, 1);
    const mesNombre = fecha.toLocaleString("es-ES", { month: "long" });

    return (
      d.categoria === categoriaSeleccionada &&
      mesNombre.toLowerCase() === String(mesSeleccionado || "").toLowerCase() &&
      year === parseInt(anioSeleccionado)
    );
  });

  console.log("🔍 Filtradas:", filtradas);

  const camposVisibles = [
    "fecha", "temperatura", "cantidad", "salida", "saldo",
    "nombre_del_insumo", "presentacion", "laboratorio", "proveedor",
    "lote", "fecha_de_vto", "registro_invima", "expediente_invima",
    "clasificacion", "estado_de_revision", "salida_fecha",
    "inicio", "termino", "lab_sas", "factura", "costo_global",
    "costo", "costo_prueba", "costo_unidad", "iva", "consumible",
    "categoria"
  ];

  const camposFecha = ["fecha", "fecha_de_vto", "salida_fecha", "inicio", "termino"];

  // 2️⃣ Crear los datos a exportar o solo encabezados si no hay registros
  const datosExportar = filtradas.length > 0
    ? filtradas.map(t => {
        const detalle = t.detalle || {};
        const fila = {};

        camposVisibles.forEach(campo => {
          let valor = detalle[campo] ?? "-";

          if (valor && camposFecha.includes(campo) && !isNaN(new Date(valor))) {
            const fecha = new Date(valor);
            valor = fecha.toISOString().split("T")[0];
          }

          fila[campo.replaceAll("_", " ")] = valor;
        });

        return fila;
      })
    : [Object.fromEntries(camposVisibles.map(c => [c.replaceAll("_", " "), "-"]))];

  // 3️⃣ Crear y descargar el Excel
  
  const hoja = XLSX.utils.json_to_sheet(datosExportar);
  const libro = XLSX.utils.book_new();
  // ➡️ Nombre seguro de la hoja (máx 31 caracteres y sin caracteres inválidos)
let nombreHoja = `Insumos_${categoriaSeleccionada}_${mesSeleccionado}_${anioSeleccionado}`;
nombreHoja = nombreHoja.replace(/[\/\\\?\*\[\]]/g, "").substring(0, 31);

  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja);

  const buffer = XLSX.write(libro, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `insumos_${categoriaSeleccionada}_${mesSeleccionado}_${anioSeleccionado}.xlsx`);
}
