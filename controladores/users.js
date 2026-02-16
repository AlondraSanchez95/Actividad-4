require('dotenv').config();
const Usuario = require('../database/users');
const bcryptjs = require('bcryptjs');
const JWT = require('jsonwebtoken');

exports.getUsuarios = async (req,res,next) => {
    try{
        const Users = await Usuario.find().select('-contrasena');
        res.status(200).json(Users);
        console.log('Exito al cargar usuarios')
    } catch(error){
        next(error);
        console.error(error);
    }
};

exports.registro = async (req,res,next) => {
    try{
        const {nombre, apellido, fechaNacimiento, fechaCreacionUsuario, nombreUsuario, correoElectronico, contrasena, rol} = req.body;
        const userExistente = await Usuario.findOne({
            $or : [{correoElectronico}, {nombreUsuario}]
        });
        if(userExistente){
            return res.status(400).json({message: 'Este correo o nombre de usuario ya esta registrado'});
        }
        const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
        const salt = await bcryptjs.genSalt(saltRounds);
        const passwordH = await bcryptjs.hash(contrasena, salt);
        const nuevoUser = new Usuario({
            nombre,
            apellido,
            fechaNacimiento,
            fechaCreacionUsuario,
            nombreUsuario,
            correoElectronico,
            contrasena : passwordH,
            rol: rol || 'user'
        });
        await nuevoUser.save();
        res.status(201).json({message: 'Cuenta creada con exito', usuario: nombreUsuario});
        console.log('Exito al crear un nuevo usuario', nombreUsuario);
    } catch (error) {
        console.error(error); 
        next(error);
    }
};

exports.login = async (req,res,next) => {
    try{
        const {identifier,contrasena} = req.body;
        const usuario = await Usuario.findOne({
            $or:[
                {correoElectronico: identifier},{nombreUsuario:identifier}
            ]
        });
        if(!usuario){
            return res.status(404).json({message: 'Este usuario/email no esta registrado'});
        }
        const contrasenaCorrecta = await bcryptjs.compare(contrasena, usuario.contrasena);
        if(!contrasenaCorrecta){
            return res.status(400).json({message: 'La contrasena es incorrecta, intenta otra vez'})
        }
        const Token = JWT.sign(
            {id: usuario._id, nombreUsuario: usuario.nombreUsuario,rol: usuario.rol},
            process.env.JWT_SECRET,
            {expiresIn : process.env.JWT_EXPIRES_IN}
        )
        res.status(200).json({
            message: 'Bienvenido',
            token: Token,
            usuario: {
                id: usuario._id,
                username: usuario.nombreUsuario,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.correoElectronico,
                role: usuario.rol
            }
        })
        console.log('Exito al hacer login');
    } catch(error){
        next(error);
        console.error(error);
    }
};

exports.updateUsuario = async (req,res,next) => {
    try{
        const{id} = req.params;
        const{nombre, apellido, fechaNacimiento, nombreUsuario, contrasena} = req.body;
        const datosaActualizar = {
            nombre,
            apellido,
            fechaNacimiento,
            nombreUsuario,
            contrasena,
            ultimaFechaActualizacion: Date.now()};
        if(contrasena){
            const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
            const salt = await bcryptjs.genSalt(saltRounds);
            datosaActualizar.contrasena = await bcryptjs.hash(contrasena, salt);
        }
        const userEditado = await Usuario.findByIdAndUpdate(
            id, datosaActualizar, {new: true, runValidators: true}
        ).select('-contrasena');
        if(!userEditado){
            return res.status(404).json({message: 'Usuario no encontrado'});
        }
        res.status(200).json({message: 'Perfil Actualizado', usuario: userEditado});
        console.log(`Usuario con id ${id} actualizado con exito`);
    } catch(error){
        if(error.code == 11000){
            return res.status(400).json({message: 'Ese email o username ya esta en uso'});
        }
        next(error);
        console.error(error);
    }
}

exports.deleteUsuario = async (req,res,next) => {
    try{
        const {id} = req.params;
        const usuarioDelete = await Usuario.findByIdAndDelete(id);
        if(!usuarioDelete){
            return res.status(400).json({message: 'No se pudo borrar este perfil'});
        }
        res.status(200).json({message: 'Perfil Eliminado'});
        console.log(`Usuario con id ${id} eliminado correctamente`);
    } catch(error){
        res.status(500).json({message: 'Ocurrio un error al intentar eliminar este perfil', error});
        console.error(error);
    }
}