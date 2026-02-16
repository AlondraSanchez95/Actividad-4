const moongose = require('mongoose');

const ProductoSchema = new moongose.Schema({
    nombre:{
        type: String,
        required: [true, 'El nombre es obligatorio'],
        unique: true
    },
    precio:{
        type: Number,
        required: [true, 'El precio es obligatorio']
    },
    descripcion: {
        type: String
    },
    stock: {
        type: Number,
        required: [true, 'La cantidad en stock es obligatoria']
    },
    categoria: {
        type: String,
        required: [true, 'La categoria es obigatoria']
    },
    imagen: {
        type:String
    }
});

module.exports = moongose.model('Productos', ProductoSchema);