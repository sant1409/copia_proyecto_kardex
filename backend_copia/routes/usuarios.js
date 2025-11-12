/**
 * 🔐 usuarios.routes.js
 * Módulo de rutas para la gestión completa de usuarios.
 * Incluye registro, inicio/cierre de sesión, verificación de cuenta,
 * recuperación y cambio de contraseña, así como CRUD básico de usuarios.
 * También utiliza JWT para autenticación y Nodemailer para envío de correos.
 *El correo que envía las notificaciones puede dejar de funcionar después de un tiempo. En ese caso, se puede reemplazar o reconfigurar,
   utilizando una clave especial generada por Google, la cual se crea desde la cuenta para permitir el envío seguro de correos del sistema.
 */


const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');
const { verificarToken } = require('../middlewares/auth');
const claveSecreta = process.env.JWT_SECRET || '123456789santiago';



//Ruta para configurar Nodemailer, permite envia codigos de verificacion al correo

const transporte = nodemailer.createTransport({
    service: "gmail", //O otro proveedor de direccion
    auth: {
        user: "automatizarkardex@gmail.com",
        pass: "dnnv qksc ddma fkgm", // generar contraseña de app si es gmail
    },
});


// registrar un usuario
router.post('/registrarse', async (req, res) => {
    const { correo, nombre, contraseña, id_sede	 } = req.body;
    if (!correo || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(correo,)) {
        return res.status(400).json ({error: 'Correo invalido o faltante'});
    }

    if (!nombre || nombre.trim() === ''){
        return res.status(400).json ({error: 'El nombre es obligatorio'});
    }

    if (!contraseña || contraseña.length < 6) {
        return res.status(400).json({error: 'La contraseña debe tener almenos 6 caracteres'});
    }

    if (!id_sede) {
        return res.status(400).json({error: 'La sede es obligatoria'});
    }

    try {
       
        const contraseñaEncriptada = await bcrypt.hash(contraseña, 10);

        //Crear un codigo aleatorio de verificacion
        const codigo = String(Math.floor(100000 + Math.random () * 900000));
         console.log(codigo);

          // Enviar correo
        await transporte.sendMail({
            from: '"Mi APP" <automatizarkardex@gmail.com>',
            to: correo,
            subject: "Verificar tu cuenta",
            text: `Tu código de verificación es: ${codigo}`
        });

        const [result] = await pool.query(
            'INSERT INTO usuarios (correo, nombre, contraseña, id_sede,  codigo_verificacion) VALUES (?, ?, ?, ?, ?)',
            [correo, nombre, contraseñaEncriptada,  id_sede, codigo ] 

        );

        res.status(201).json({ message: 'Usuario registrado. revisa tu correo para verificar la cuenta!', id_usuario: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({error: 'El correo ya esta registrado'});
        }
        res.status(500).json({ error: error.message });
    }
});

//Iniciar-sesion
router.post('/iniciar_sesion', async (req, res) => {
  const { correo, contraseña } = req.body;

  if (!correo || !contraseña) {
    return res.status(400).json({ error: 'Correo y contraseña requeridos' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE correo = ?', [correo]
    );

    if (rows.length === 0) {
      return res.status(401).json({ mensaje: 'Correo no registrado' });
    }

    const usuario = rows[0];
    if (!usuario.verificado) {
      return res.status(403).json({ error: 'Cuenta no verificada' });
    }

    const coincide = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!coincide) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

    // Crear token con la info del usuario
    const token = jwt.sign(
      {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        id_sede: usuario.id_sede
      },
      claveSecreta,
      { expiresIn: '1d' } // dura 1 día
    );

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token
    });

  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
});

// Ruta de verificacion correo 
router.post('/verificar', async (req, res) => {
    const {correo, codigo} = req.body;
    const [rows] = await pool.query(
        'SELECT * FROM usuarios WHERE correo = ?', [correo]);
        if (rows.length === 0) return res.status(404).json({error: 'Usuario no encontrado'});

        const usuario  = rows[0];

        if (usuario.codigo_verificacion != codigo) {
            return res.status(400).json({error: 'Codigo incorrecto'});
        }

        // Activar usuario
        await pool.query('UPDATE usuarios SET verificado = 1, codigo_verificacion = NULL WHERE correo= ?', [correo]);
        res.json({message: 'Cuenta verificada correctamente'});
});

// cerra sesion 


router.post('/cerrar_sesion', async (req, res)=> {
    req.session.destroy(err =>{
        if (err) {
            return res.status(500).json({mensaje: 'Error al cerrar sesión'});  
        }
        res.clearCookie('connect.sid');
        res.json({mensaje: 'Sesión cerrada correctamente'})
    });
});

// recuperar contraseña
router.post('/recuperar_clave', async (req, res)=>{
    const {correo}= req.body;

    if (!correo || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(correo)) {
        return res.status(400).json({ error: 'Correo inválido o faltante' });
    } 
    try {

        const [rows] = await pool.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
        if (rows.length === 0) {
            return res.status(404).json({error: "Correo no registrado"});
        }        
    const codigo = String(Math.floor(100000 + Math.random() * 900000));

    await pool.query('UPDATE usuarios SET codigo_recuperacion  = ? where correo = ?', [codigo, correo]);

    await transporte.sendMail ({
        from: '"Mi APP" <automatizarkardex@gmail.com>',
        to: correo,
        subject: "Recuperar contraseña",
        text: `Tu codigo de recuperacion es: ${codigo}`
    });


        res.json({mensaje: 'Código enviado al correo'});
    } catch (error){
        console.error(error);
        res.status(500).json({mensaje: 'Error en el servidor'});
    }
});

// Cambiar la contraseña
router.post('/resetear_clave', async (req, res) => {
    const {codigo, nuevaContraseña} = req.body;

    if (!nuevaContraseña || nuevaContraseña.length < 6) {
        return res.status(400).json({error: 'La nueva contraseña debe de tener al menos 6 caracteres'});
    }

    try {
        const [rows] = await pool.query(
            'SELECT * FROM usuarios WHERE codigo_recuperacion = ?',
            [ codigo]
        );

        if (rows.length === 0) {
            return res.status(400).json({error: 'Código incorrecto'});
        }

        const contraseñaEncriptada = await bcrypt.hash(nuevaContraseña, 10);

        await pool.query(
            'UPDATE usuarios SET contraseña = ?, codigo_recuperacion = NULL WHERE id_usuario = ?',
            [contraseñaEncriptada, rows[0].id_usuario]
        );

        res.json({message: 'Contraseña actualizada correctamente'});
    } catch (error) {
        console.error(error);
        res.status(500).json({mensaje: 'Error en el servidor'});
    }
});


// verificar el codigo para cambiar la contraseña

router.post('/verificar_codigo', async(req, res) => {
    const {correo, codigo} = req.body
    try {
        const [rows] = await pool.query(
            'SELECT * FROM usuarios WHERE correo  = ? AND codigo_recuperacion = ?',
            [correo, codigo]
        );

        if (rows.length === 0) {
            return res.status(400).json({error: 'Código incorrecto'});
        }

        res.json({message: 'Código válido, puedes cambiar la contraseña'});
    } catch (error) {
        console.error(error);
        res.status(500).json({mensaje: 'Error en el servidor'});
    }
});
        

// Modificar usuario
router.put('/:id_usuario', async (req, res) => {
    const { correo, nombre, contraseña } = req.body;
    const { id_usuario } = req.params;

    if (!correo || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(correo)) {
        return res.status(400).json({ error: 'Correo inválido o faltante' });
    }

    if (!nombre || nombre.trim() === '') {
        return res.status(400).json({error: ' El nombre es obligatorio '});
    }

    if  (!contraseña || contraseña.length < 6) {
        return res.status(400).json({error: 'La contraseña debede tener al menos 6 caracteristicas'})
    }

    if (isNaN (id_usuario)) {
        return res.status(400).json ({error: 'ID de usuario invalido'});
    }

    try {
        const contraseñaEncriptada = await bcrypt.hash(contraseña, 10);
        const [result] = await pool.query(
            'UPDATE usuarios SET correo = ?, nombre = ?, contraseña = ? WHERE id_usuario = ?',
            [correo, nombre, contraseñaEncriptada, id_usuario]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado con ese ID' });
        }

        res.json({ message: 'Usuario actualizado exitosamente', result });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({error: 'El correo ya esta registrado'})
        }
        res.status(500).json({ error: error.message });
    }
});

//Verificar si el usuario si quedo en la sesion
router.get('/sesion', verificarToken, async (req, res) => {
  const { id_usuario, nombre, correo, id_sede } = req.usuario;
  res.json({
    mensaje: 'Perfil accedido correctamente',
    usuario: { id_usuario, nombre, correo, id_sede }
  });
});


// Buscar un usuario por ID
router.get('/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;

    try {
        const [result] = await pool.query(
            'SELECT * FROM usuarios WHERE id_usuario = ?',
            [id_usuario]
        );

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se puede encontrar al usuario con el ID proporcionado.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Usuario encontrado correctamente.',
            data: result[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Hubo un problema al obtener el usuario.',
            error: error.message
        });
    }
});

// Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const [usuarios] = await pool.query('SELECT * FROM usuarios');
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar un usuario
router.delete('/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;

    if (isNaN (id_usuario)) {
        return res.status(400).json ({error: 'ID de usuario invalido'});
    }

    try {
        const [result] = await pool.query(
            'DELETE FROM usuarios WHERE id_usuario = ?',
            [id_usuario]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se puede eliminar el usuario con el ID proporcionado'
            });
        }

        res.status(202).json({
            success: true,
            message: 'Usuario eliminado correctamente.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Hubo un problema en el servidor al intentar eliminar el usuario',
            error: error.message
        });
    }
});

module.exports = router;


