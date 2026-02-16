const express = require('express');
const router = express.Router();
const productoControlador = require('./controladores/productos');
const userControlador = require('./controladores/users');
const JWT = require('jsonwebtoken');

const checkRole = (roles) => {
    return (req,res,next) => {
        if(!roles.includes(req.user.rol)){
            return res.status(403).json({message: 'No cuentas con permiso de Administrador'});
        }
        next();
    };
};

const role = checkRole(['admin']);

const auth = (req,res,next) => {
    const authHeader = req.header('Authorization');
    if(!authHeader ||!authHeader.startsWith('Bearer ')){
        return res.status(401).json({message: 'Acceso Denegado. No tienes un token valido'});
    }
    const token = authHeader.split(' ')[1];
    try{
        const cifrado = JWT.verify(token, process.env.JWT_SECRET);
        req.user = cifrado;
        next();
        console.log('Token configurado');
    } catch(error){
        next(error);
    }
};

//PARA PRODUCTOS 
router.get('/productos', auth, productoControlador.getProductos);
//GESTION PARA ADMIN PRODUCTOS
router.post('/crearProducto', auth, role, productoControlador.createProducto);
router.put('/actualizarProducto/:id', auth, role, productoControlador.updateProducto);
router.delete('/eliminarProducto/:id', auth, role, productoControlador.deleteProducto);

//PARA USUARIOS SOLO ADMIN
router.get('/usuarios', auth, role, userControlador.getUsuarios);
//REGISTRO YA SEA NORMAL O REGISTRO DE UN NUEVO USUARIO PARA UN ADMIN
router.post('/registro', userControlador.registro);
//SEGUIMOS CON EL CRUD PARA ADMIN
router.put('/actualizarUsuario/:id', auth, role, userControlador.updateUsuario);
router.delete('/eliminarUsuario/:id', auth, role, userControlador.deleteUsuario);

//LOGIN
router.post('/login', userControlador.login);

module.exports = router;
