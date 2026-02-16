const request = require('supertest');
const app = require('../index'); 
const mongoose = require('mongoose');
const Usuario = require('../database/users'); 
const Producto = require('../database/productos'); // <--- AJUSTA ESTA RUTA A TU SCHEMA DE PRODUCTOS

describe('Pruebas de CRUD Productos y Roles', () => {
    let adminToken;
    let userToken;
    let productoId;

    beforeAll(async () => {
        // Limpiamos usuarios previos para evitar errores de duplicado (400)
        await Usuario.deleteMany({ 
            correoElectronico: { $in: ['admin_prod@test.com', 'user_prod@test.com'] } 
        });

        // 1. Crear Admin con todos los campos requeridos
        const admin = new Usuario({
            nombre: "Admin",
            apellido: "Pruebas",
            fechaNacimiento: "1990-01-01",
            nombreUsuario: `admin-prod-${Date.now()}`,
            correoElectronico: "admin_prod@test.com",
            contrasena: await require('bcryptjs').hash("admin123", 10),
            rol: "admin"
        });
        await admin.save();

        // 2. Crear Usuario normal
        const user = new Usuario({
            nombre: "User",
            apellido: "Pruebas",
            fechaNacimiento: "1992-05-10",
            nombreUsuario: `user-prod-${Date.now()}`,
            correoElectronico: "user_prod@test.com",
            contrasena: await require('bcryptjs').hash("user123", 10),
            rol: "user"
        });
        await user.save();

        // 3. Login para obtener Tokens (usando 'identifier' como en tu controlador)
        const resAdmin = await request(app).post('/api/login').send({
            identifier: "admin_prod@test.com",
            contrasena: "admin123"
        });
        adminToken = resAdmin.body.token;

        const resUser = await request(app).post('/api/login').send({
            identifier: "user_prod@test.com",
            contrasena: "user123"
        });
        userToken = resUser.body.token;
    });

    afterAll(async () => {
        // Limpiamos los productos creados durante el test
        await Producto.deleteMany({ categoria: "Electronica-Test" });
        await mongoose.connection.close();
    });

    describe('POST /api/crearProducto', () => {
        test('Debería denegar acceso a un User normal (403)', async () => {
            const res = await request(app)
                .post('/api/crearProducto')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    nombre: "Intento Fallido",
                    precio: 10,
                    stock: 5,
                    categoria: "Electronica-Test"
                });

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toBe('No cuentas con permiso de Administrador');
        });

        test('Debería permitir al Admin crear un producto con todos los campos (201)', async () => {
            const res = await request(app)
                .post('/api/crearProducto')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    nombre: `Laptop Gamer ${Date.now()}`, // Unique: true, por eso el Date.now()
                    precio: 1500,
                    descripcion: "M3 Pro, 16GB RAM",
                    stock: 10,              // <--- Agregado (Requerido por Schema)
                    categoria: "Electronica-Test", // <--- Agregado (Requerido por Schema)
                    imagen: "url-de-imagen.jpg"
                });

            expect(res.statusCode).toBe(201);
            productoId = res.body._id || (res.body.producto && res.body.producto._id);
        });
    });

    describe('DELETE /api/eliminarProducto/:id', () => {
        test('Debería permitir al Admin eliminar el producto creado (200)', async () => {
            const res = await request(app)
                .delete(`/api/eliminarProducto/${productoId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Producto eliminado correctamente');
        });
    });
});