require ('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const  cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const cron = require('node-cron');
const db = require('./models'); // <- esto importa tu index.js de Sequelize



const allowedOrigins = [
  'http://localhost:5173',
  'https://copia-proyecto-kardex-frontend.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('Origen bloqueado por CORS:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(bodyParser.json());

//Ruta de prueba

app.get('/', (req, res ) => {
    res.send('API de el Kardex funcionando')
});

//Ruta de los iusuarios
const usuariosRouter = require('./routes/usuarios');
app.use('/usuarios', usuariosRouter);


// Ruta para los insumos 
const insumosRouter = require('./routes/insumos');
app.use('/insumos', insumosRouter);


// Ruta para el kardex
const kardexRouter = require('./routes/kardex');
app.use('/kardex', kardexRouter);

//Ruta de la auditoria
const auditoriaRouter = require('./routes/auditoria');
app.use ('/auditoria', auditoriaRouter);


// Ruta para nombre_del_insumo
const nombre_del_insumoRouter = require('./routes/nombre_del_insumo')
app.use('/nombre_del_insumo', nombre_del_insumoRouter);

// Rutra para la presentacion

const presentacionRouter = require('./routes/presentacion')
app.use('/presentacion', presentacionRouter);

//Ruta laboratorio

const laboratorioRouter = require('./routes/laboratorio')
app.use('/laboratorio', laboratorioRouter);

//Ruta proveedor

const proveedorRouter = require('./routes/proveedor')
app.use('/proveedor', proveedorRouter);

//Ruta de clasificacion
const clasificacionRouter = require('./routes/clasificacion')
app.use('/clasificacion', clasificacionRouter);

//Ruta de categoria
const categoriaRouter = require('./routes/categoria')
app.use ('/categoria', categoriaRouter);

// Ruta de nombre_insumo del kardex
const nombre_insumoRouter = require('./routes/nombre_insumo')
app.use ('/nombre_insumo', nombre_insumoRouter);

//Ruta de presentacion_k del kardex
const presentacion_kRouter = require('./routes/presentacion_k')
app.use ('/presentacion_k', presentacion_kRouter);

//Ruta de casa_comercial kardex
const casa_comercialRouter = require('./routes/casa_comercial')
app.use ('/casa_comercial', casa_comercialRouter);

//Ruta de proveedor_k del kardex 
const proveedor_kRouter = require('./routes/proveedor_k')
app.use ('/proveedor_k', proveedor_kRouter);

//Ruta de la clasificacion del kardex
const clasificacion_riesgoRouter = require('./routes/clasificacion_riesgo')
app.use ('/clasificacion_riesgo', clasificacion_riesgoRouter);

//Ruta de las sedes
 const inventarioRoutes = require("./routes/inventario");
 app.use("/inventario", inventarioRoutes);

//Ruta de las notificaciones
 const notificacionesRoutes = require("./routes/notificaciones");
 app.use("/notificaciones", notificacionesRoutes);

 //Ruta de las sedes
 const sedeRoutes = require("./routes/sede");
 app.use("/sede", sedeRoutes);

 //Ruta de la suscripciones 
 const suscripcion_notificacionesRoutes = require("./routes/suscripcion_notificaciones");
 app.use("/suscripcion_notificaciones", suscripcion_notificacionesRoutes)

//Ruta de administrador
const  adminRoutes = require("./routes/admin.js");
app.use("/admin", adminRoutes)


//Ruta de links
const  linksRoutes = require("./routes/links.js");
app.use("/links", linksRoutes)


const { generarNotificacionesAutomaticas, enviarNotificacionesPorCorreo, procesarSalidas } = require('./utils/notificaciones');
const pool = require('./db'); // conexión MySQL
cron.schedule('* * * * *', async () => {  
    console.log('⏰ Cron iniciado para notificaciones');
    try {
        // Obtener todas las sedes activas
        const [sedes] = await pool.query('SELECT id_sede FROM sede');

       for (const s of sedes) {
    const id_sede = s.id_sede;
    await procesarSalidas(id_sede); 
    await generarNotificacionesAutomaticas(id_sede);
    await enviarNotificacionesPorCorreo(id_sede);
        }
        console.log('✅ Proceso de notificaciones completado para todas las sedes.');
    } catch (error) {
        console.error('❌ Error en el cron de notificaciones:', error);
    }
});

// Importar router y función del stock
const { router: stock_inventarioRoutes, procesarFechasTerminacion } = require('./routes/stock_inventario');

app.use("/stock_inventario", stock_inventarioRoutes);
// Cron que recorre todas las sedes y procesa stock de cada una
cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Cron iniciado para procesar stock por sedes');
    try {
        // Obtener todas las sedes activas
        const [sedes] = await pool.query('SELECT id_sede FROM sede');

        for (const s of sedes) {
            const id_sede = s.id_sede;
            console.log(`📦 Procesando stock para la sede ID: ${id_sede}`);
            // Procesar fechas de terminación para esta sede
            await procesarFechasTerminacion(id_sede);
            console.log(`✅ Stock procesado para la sede ID: ${id_sede}`);
        }
        console.log('✅ Proceso de stock completado para todas las sedes.');
    } catch (error) {
        console.error('❌ Error en el cron de stock:', error);
    }
});

app.get('/test-db', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.json({ message: "Conexión a la base de datos exitosa ✅" });
  } catch (err) {
    console.error('Error DB:', err);   // esto lo verás en los logs de Render
    res.status(500).json({ error: err.toString() });
  }
});


//Iniciar el servidor 
app.listen(port, () => {
    console.log(`Servidor corriendo en  http://localhost:${port}`)
});


