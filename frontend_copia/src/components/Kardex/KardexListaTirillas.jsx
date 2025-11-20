/**
 * 📘 KardexListaTirillas.jsx
 *
 * Lista visual de registros del Kardex asociados a una sede específica.
 *
 * 🔹 Funcionalidad:
 *  - Muestra tarjetas con información resumida de cada tirilla (insumo).
 *  - Filtra los registros según la sede almacenada en localStorage.
 *  - Permite actualizar, eliminar o ver el detalle completo de un registro.
 *  - Resalta el estado del insumo según su fecha de vencimiento (rojo, amarillo, verde).
 *  - Genera reportes PDF individuales con `@react-pdf/renderer`.
 **/

import { useState, useEffect } from "react";
import "./Kardex.css";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ReporteReactivo from "../../exportar/ReporteReactivo";

export default function KardexListaTirillas({
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



  //Verificar sede en sesion
  const idSede = localStorage.getItem("id_sede");
  if (!idSede) {
    console.warn("No hay id_sede en localStorage");
  }

  const tirillasFiltradas = tirillas.filter(
    (t) => String(t.detalle?.id_sede) === idSede
  );

  function BotonDescargarPDF({ detalle }) {
    return (
      <PDFDownloadLink
        document={<ReporteReactivo reactivo={detalle} />}
        fileName={`Reporte_${detalle.nombre_insumo || "reactivo"}.pdf`}
      >
        {({ loading }) => (loading ? "Generando PDF..." : "Descargar PDF")}
      </PDFDownloadLink>
    );
  }

  useEffect(() => {
    if (!initialSelectedId || !tirillasFiltradas?.length) return;
    const found = tirillasFiltradas.find(
      t => String(t.detalle?.id_kardex) === String(initialSelectedId)
    );
    if (found) setTirillaSeleccionada(found);
  }, [initialSelectedId, tirillasFiltradas]);

  // 🔹 Campos que queremos mostrar en el detalle del modal
  const camposVisibles = [
    "fecha_recepcion", "temperatura_llegada", "maximo", "minimo", "cantidad",
    "salida", "saldo", "nombre_insumo", "presentacion", "casa_comercial",
    "proveedor", "lote", "fecha_vencimiento", "registro_invima", "expediente_invima",
    "estado_revision", "temperatura_almacenamiento", "clasificacion_riesgo",
    "principio_activo", "forma_farmaceutica", "concentracion", "unidad_medida",
    "fecha_salida", "fecha_inicio", "fecha_terminacion", "area", "factura",
    "costo_general", "costo_caja", "costo_prueba", "iva", "consumible", "link_casa"

  ];
  function obtenerColorVencimiento(fecha_vencimiento) {
    if (!fecha_vencimiento) return "white"; // sin fecha -> blanco

    const hoy = new Date();
    const venc = new Date(fecha_vencimiento);

    // Calcular diferencia en meses exactos
    let diffMeses = (venc.getFullYear() - hoy.getFullYear()) * 12;
    diffMeses += venc.getMonth() - hoy.getMonth();

    // Si todavía no llegó el día dentro de ese mes, restamos 1
    if (venc.getDate() < hoy.getDate()) {
      diffMeses -= 1;
    }

    if (diffMeses <= 3) {
      return "rgba(255, 0, 0, 0.4)"; // vencido o hasta 3 meses -> rojo
    } else if (diffMeses <= 5) {
      return "rgba(255, 255, 0, 0.4)"; // 4 y 5 meses -> amarillo
    } else {
      return "rgba(0, 128, 0, 0.4)"; // desde el 6º mes en adelante -> verde
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

        <h2>Lista de Kardex Registrados</h2>

        {tirillasFiltradas.length > 0 ? (
          <div className="tirillas-grid">
            {tirillasFiltradas.map((t, index) => {

              // 🔹 Aquí sí puedes usar lógica normal
              const hoy = new Date().toISOString().split("T")[0]; // fecha de hoy
              const fechaTerminacion = t.detalle?.fecha_terminacion
                ? t.detalle.fecha_terminacion.split("T")[0]
                : null;

              const estaTerminado = fechaTerminacion && fechaTerminacion <= hoy;
              const pagado = Number(t.detalle?.pagado) === 1 ? 1 : 0;
              
              return (
                <div
                  key={t.detalle?.id_kardex || t.detalle?.lote || index} // 🔹 clave única
                  className="tirilla-card"
                  onClick={() => setTirillaSeleccionada(t)}
                  style={{
                    backgroundColor: obtenerColorVencimiento(
                      t.detalle?.fecha_vencimiento
                    ),
                    position: "relative",
                  }}
                >
                  {/* 🔹 Marquilla negra si está terminado */}
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
                      {t.detalle?.nombre_insumo || "-"} |{" "}
                      {t.detalle?.lote || "-"} | {t.detalle?.lab_sas || "-"} |{" "}
                      {t.detalle?.mes_registro || "-"}
                    </strong>
                    <span>
                      {t.detalle?.presentacion ||
                        t.detalle?.casa_comercial ||
                        t.detalle?.proveedor ||
                        "Registro kardex"}
                    </span>
                  </div>

                  {/* 🔹 Botones sin interferir con el click del modal */}
                  <div className="tirilla-buttons">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // evita que se abra el modal
                        onActualizarTirilla(t);
                      }}
                    >
                      Actualizar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // evita que se abra el modal
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
          <p>No hay tirillas registradas.</p>
        )}
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
                {tirillaSeleccionada.detalle?.nombre_insumo || "-"} |{" "}
                {tirillaSeleccionada.detalle?.lote || "-"} |{" "}
                {tirillaSeleccionada.detalle?.lab_sas || "-"} |{" "}
                {tirillaSeleccionada.detalle?.mes_registro || "-"}
              </h3>

              <div className="tirilla-detalle">
                {Object.entries(tirillaSeleccionada.detalle || {}).map(
                  ([key, value]) => {
                    if (!camposVisibles.includes(key)) return null;

                    const fechas = [
                      "fecha_recepcion",
                      "fecha_vencimiento",
                      "fecha_salida",
                      "fecha_inicio",
                      "fecha_terminacion",
                    ];

                    const displayValue = fechas.includes(key)
                      ? formatearFecha(value)
                      : value || "-";

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

