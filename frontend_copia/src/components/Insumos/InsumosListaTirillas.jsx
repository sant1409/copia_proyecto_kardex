/**
 * 📘 InsumosListaTirillas.jsx
 *
 * Muestra una lista interactiva de insumos registrados por sede.
 * Permite:
 *  - Filtrar insumos por la sede guardada en localStorage.
 *  - Mostrar detalle completo en un modal al seleccionarlos.
 *  - Actualizar o eliminar registros mediante callbacks.
 *  - Descargar un PDF individual con la información del insumo.
 *  - Colorear tarjetas según la cercanía de vencimiento.
 */


import { useState, useEffect } from "react";
import "../Kardex/Kardex.css";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ReporteInsumo from "../../exportar/ReporteInsumo";


export default function InsumosListaTirillas({
  tirillas = [],
  onActualizarTirilla = () => { },
  onEliminarTirilla = () => { },
  onActualizarPagoFactura = () => { },   // 🔹 NUEVO
  facturaSeleccionadaInicial = "",      // 🔹 NUEVO
  initialSelectedId = null,

}) {

  const [tirillaSeleccionada, setTirillaSeleccionada] = useState(null);
  const [estadoPagado, setEstadoPagado] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(facturaSeleccionadaInicial);

  // 🔹 Manejar el cambio del switch
  function actualizarPagoFactura(estado) {
    if (estado) {
      const confirmacion = window.confirm(
        `¿Estás seguro que revisaste todos los registros del número de factura "${facturaSeleccionada}" que quieres marcar como pagado?`
      );

      if (!confirmacion) {
        return; // ❌ NO HACE NADA SI CANCELA
      }
    }

    // Llamar la función enviada desde el padre
    onActualizarPagoFactura({
      factura: facturaSeleccionada,
      pagado: estado ? 1 : 0

    });
  }
  const idSede = localStorage.getItem("id_sede");
  if (!idSede) {
    console.warn("No hay id_sede en localStorage");
  }

  function BotonDescargarPDF({ detalle }) {
    return (
      <PDFDownloadLink
        document={<ReporteInsumo insumo={detalle} />}
        fileName={`Reporte_${detalle.nombre_del_insumo || "insumo"}.pdf`}
      >
        {({ loading }) => (loading ? "Generando PDF..." : "Descargar PDF")}
      </PDFDownloadLink>
    );
  }

  const tirillasFiltradas = tirillas.filter(t => String(t.detalle?.id_sede) === idSede);
  // cuando cambien tirillas o initialSelectedId, buscamos y abrimos
  useEffect(() => {
    if (!initialSelectedId || !tirillasFiltradas.length) return;
    const found = tirillasFiltradas.find(
      t => String(t.detalle?.id_insumo) === String(initialSelectedId)
    );
    if (found) {
      setTirillaSeleccionada(found);
    }
  }, [initialSelectedId, tirillasFiltradas]);


  // 🔹 Campos que queremos mostrar en el detalle del modal
  const camposVisibles = [
    "fecha", "temperatura", "cantidad", "salida", "saldo",
    "nombre_del_insumo", "presentacion", "laboratorio", "proveedor",
    "lote", "fecha_de_vto", "registro_invima", "expediente_invima",
    "clasificacion", "estado_de_revision", "salida_fecha",
    "inicio", "termino", "lab_sas", "factura", "costo_global",
    "costo", "costo_prueba", "costo_unidad", "iva", "consumible",
    "categoria"
  ];

  function obtenerColorVencimiento(fecha_vencimiento) {
    if (!fecha_vencimiento) {
      return "white";
    }

    const hoy = new Date();
    const venc = new Date(fecha_vencimiento);

    // Calcular diferencia en meses completos
    let diffMeses = (venc.getFullYear() - hoy.getFullYear()) * 12;
    diffMeses += venc.getMonth() - hoy.getMonth();

    // Si el día de vencimiento del mes aún no llegó -> restamos 1
    if (venc.getDate() < hoy.getDate()) {
      diffMeses -= 1;
    }

    // 🔴 Vencido o hasta 3 meses
    if (diffMeses <= 3) {
      return "rgba(255, 0, 0, 0.4)";
    }
    // 🟡 Entre 4 y 5 meses
    else if (diffMeses <= 5) {
      return "rgba(255, 255, 0, 0.4)";
    }
    // 🟢 Desde el 6º mes en adelante
    else {
      return "rgba(0, 128, 0, 0.4)";
    }
  }

  // Función para mostrar la fecha en formato 'YYYY-MM-DD'
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "-";
    return fechaISO.split("T")[0]; // toma solo la parte antes de la "T"
  };

  // 🔥 Cuando cambia la tirilla seleccionada, actualizar estado del pago
  useEffect(() => {
    if (!tirillaSeleccionada) return;

    // Si la tirilla tiene factura, usarla
    if (tirillaSeleccionada.detalle?.factura) {
      setFacturaSeleccionada(tirillaSeleccionada.detalle.factura);
    }

    // Si la tirilla trae info de si está pagada (0 / 1)
    if (tirillaSeleccionada.detalle?.pagado !== undefined) {
      setEstadoPagado(tirillaSeleccionada.detalle.pagado === 1);
    }
  }, [tirillaSeleccionada]);



  return (
    <div className="tirillas-wrapper">
      <div className="tirillas-container">
        {/* 🔥 SWITCH DE PAGO POR FACTURA */}
        <div className="pago-switch-box">
          <span className="pago-label">
            Estado de factura {facturaSeleccionada}:  </span>
          <label className="switch"> <input
            type="checkbox"
            checked={estadoPagado}
            onChange={(e) => actualizarPagoFactura(e.target.checked)} />
            <span className="slider"></span>
          </label>
          <span className="pago-estado-text">
            {estadoPagado ? " Pagado" : " No pagado"}
          </span>
        </div>
        <h2>Lista de Insumos Registrados</h2>

        {tirillasFiltradas.length > 0 ? (
          <div className="tirillas-grid">
            {tirillasFiltradas.map((t, index) => {
              const hoy = new Date().toISOString().split("T")[0]; //fecha de hoy
              const fechaTermino = t.detalle?.termino
                ? t.detalle.termino.split("T")[0]
                : null;

              const estaTerminado = fechaTermino && fechaTermino <= hoy;
              const pagado = Number(t.detalle?.pagado) === 1 ? 1 : 0;

              return (
                <div                                           //Math.random ()
                  key={t.detalle?.id_insumo || t.detalle?.lote || index} //clave unica

                  className="tirilla-card"
                  onClick={() => setTirillaSeleccionada(t)}
                  style={{
                    backgroundColor: obtenerColorVencimiento(
                      t.detalle?.fecha_de_vto
                    ),
                    position: "relative",
                  }}
                >

                  {/*Marquilla negra si esta terminado */}
                  {estaTerminado && (
                    <div
                      style={{
                        position: "absolute",
                        top: "5px",
                        right: "5px",
                        backgroundColor: "black",
                        color: "white",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      Terminado
                    </div>
                  )}

                  {/* NO PAGADO */}
                  {pagado === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "5px",
                        right: "5px",
                        color: "#555",
                        border: "1px solid #555",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        backgroundColor: "rgba(255,255,255,0.7)",
                        backdropFilter: "blur(2px)"
                      }}
                    >
                      No pagado
                    </div>
                  )}

                  {/* PAGADO */}
                  {pagado === 1 && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "5px",
                        right: "5px",
                        color: "#0056d6",
                        border: "1px solid #0056d6",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        backgroundColor: "rgba(255,255,255,0.7)",
                        backdropFilter: "blur(2px)"
                      }}
                    >
                      Pagado
                    </div>
                  )}

                  <div className="tirilla-header">
                    <strong>
                      {t.detalle?.nombre_del_insumo || "-"} | {t.detalle?.lote || "-"} | {t.detalle?.categoria || "-"} | {t.detalle?.mes_registro || "-"}
                    </strong>
                    <span>
                      {t.detalle?.presentacion || t.detalle?.laboratorio || t.detalle?.proveedor || "Registro insumo"}
                    </span>
                  </div>

                  {/* 🔹 Botones sin interferir con el click del modal */}
                  <div className="tirilla-buttons">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onActualizarTirilla(t);
                      }}
                    >
                      Actualizar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEliminarTirilla(t);
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>No hay insumos registrados.</p>
        )}

        {/* 🔹 Modal de detalle */}
        {tirillaSeleccionada && (
          <div className="tirilla-modal">
            <div className="tirilla-modal-content">
              <button
                className="tirilla-close"
                onClick={() => setTirillaSeleccionada(null)}
              >
                X
              </button>

              <h3>
                {tirillaSeleccionada.detalle?.nombre_del_insumo || "-"} | {tirillaSeleccionada.detalle?.lote || "-"} | {tirillaSeleccionada.detalle?.categoria || "-"} | {tirillaSeleccionada.detalle?.mes_registro || "-"}
              </h3>

              <div className="tirilla-detalle">
                {Object.entries(tirillaSeleccionada.detalle || {}).map(([key, value]) => {
                  if (!camposVisibles.includes(key)) return null;

                  // Si la key es una de las fechas, formatearla
                  const fechas = [
                    "fecha", "fecha_de_vto", "salida_fecha",
                    "inicio", "termino", "fecha_recepcion",
                    "fecha_vencimiento", "fecha_salida",
                    "fecha_inicio", "fecha_terminacion"
                  ];
                  const displayValue = fechas.includes(key) ? formatearFecha(value) : value || "-";

                  return (
                    <p key={key}>
                      <strong>{key.replaceAll("_", " ")}:</strong> {displayValue}
                    </p>
                  );
                })}
                {/* 🔹 Aquí agregamos el botón de descargar PDF */}
                <BotonDescargarPDF detalle={tirillaSeleccionada.detalle} />

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

} 