const moongose = require('mongoose');

const UsersSchema = new moongose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
    },
    apellido: {
        type: String, 
        required: [true, 'Un apellido es obigatorio'],
    },
    fechaNacimiento: {
        type: Date
    },
    fechaCreacionUsuario: {
        type: Date,
        default: Date.now
    },
    nombreUsuario: {
        type: String,
        required: [true, 'Un nombre de usuario es obligatorio'],
        unique: true
    },
    correoElectronico: {
        type: String,
        required: [true, 'El correo electronico es obligatorio'],
        unique: true
    },
    contrasena: {
        type: String,
        required: [true, 'La contrasena es obligatoria']
    },
    rol:{
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
});

module.exports = moongose.model('Users', UsersSchema);