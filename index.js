require('dotenv').config();
const express = require('express');
const PORT = process.env.PORT || 3000;
const app = express();
const path = require('path');
const rutas = require('./Router');
const mongoose = require('mongoose');
const mongo_uri = process.env.MONGO_URI;
const dns = require('node:dns/promises');
dns.setServers(['1.1.1.1','8.8.8.8']);
const connectDB = async () => {
    try{
        if (!mongo_uri) {
            throw new Error("La URI de MongoDB no está definida. Revisa tu archivo .env");
        }
        await mongoose.connect(mongo_uri);
        console.log('Conexion exitosa a MongoDB')
    } catch(error){
        console.error('Error al conectar a MongoDB', error.message);
        process.exit(1);
    }
};

app.use(express.json());
app.use('/api', rutas);
connectDB();

app.use((err, req, res, next) => {
    console.error('Log de errores: ', err.message);
    let status = err.status || 500;
    if(err.name === 'JsonWebTokenError'){
        status = 401;
        message = 'Token Invalido'
    };
    if(err.name === 'TokenExpiredError'){
        status = 401;
        message = 'El token esta expirado'
    };
    res.status(status).json({
        message: err.message,
        codigo: status
    });
});

if (process.env.NODE_ENV !== 'test' && process.env.ENVIRONMENT !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor activo en puerto: http://localhost:${PORT}`);
    });
}

module.exports = app;

