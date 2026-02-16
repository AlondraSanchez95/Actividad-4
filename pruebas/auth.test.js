require('dotenv').config();
const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');
const Usuario = require('../database/users');

describe('Pruebas de Autenticación (Auth)', () => {
    beforeAll(async () => {
        // Borramos al usuario de prueba para que el registro no de error 400
        await Usuario.deleteOne({ correoElectronico: 'juan@correo.com' });
    });
    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('POST /api/registro', () => {
        test('Debería registrar un nuevo usuario exitosamente', async () => {
            const nuevoUsuario = {
                nombre: "Juan",
                apellido: "Pérez",
                fechaNacimiento: "1995-05-20",
                nombreUsuario: `user-${Date.now()}`,
                correoElectronico: `juan@correo.com`,
                contrasena: "123456",
                rol: 'user'
            };

            const res = await request(app)
                .post('/api/registro')
                .send(nuevoUsuario);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('message', 'Cuenta creada con exito');
        });
    });

    // 2. PRUEBA DE LOGIN
    describe('POST /api/login', () => {
        test('Debería devolver un token con credenciales válidas', async () => {
            const credenciales = {
                identifier: "juan@correo.com",
                contrasena: "123456"
            };

            const res = await request(app)
                .post('/api/login')
                .send(credenciales);

            if (res.statusCode === 200) {
                expect(res.body).toHaveProperty('token');
                console.log('Token recibido:', res.body.token);
            } else {
                expect(res.statusCode).toBe(200);
            }
        });

        test('Debería rebotar el login con contraseña incorrecta', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({
                    identifier: "juan@correo.com",
                    contrasena: "password_falsa"
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('message', 'La contrasena es incorrecta, intenta otra vez');
        });
    });
});