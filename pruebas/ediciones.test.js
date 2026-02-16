const request = require('supertest');
const app = require('../index'); 
const mongoose = require('mongoose');
const Usuario = require('../database/users'); 
const Producto = require('../database/productos');

describe('Pruebas de CRUD: Productos y Usuarios', () => {
    let adminToken;
    let userToken;
    let productoId;
    let usuarioCreadoId;

    beforeAll(async () => {
        // 1. Limpiamos datos de prueba previos
        await Usuario.deleteMany({ 
            correoElectronico: { $in: ['admin_crud@test.com', 'user_crud@test.com'] } 
        });

        // 2. Creamos un Admin para las pruebas de edición y creación
        const admin = new Usuario({
            nombre: "Admin",
            apellido: "Master",
            fechaNacimiento: "1985-10-10",
            nombreUsuario: `admin-crud-${Date.now()}`,
            correoElectronico: "admin_crud@test.com",
            contrasena: await require('bcryptjs').hash("admin123", 10),
            rol: "admin"
        });
        await admin.save();

        // 3. Creamos un Usuario normal para probar restricciones
        const user = new Usuario({
            nombre: "User",
            apellido: "Normal",
            fechaNacimiento: "1998-01-01",
            nombreUsuario: `user-crud-${Date.now()}`,
            correoElectronico: "user_crud@test.com",
            contrasena: await require('bcryptjs').hash("user123", 10),
            rol: "user"
        });
        const usuarioGuardado = await user.save();
        usuarioCreadoId = usuarioGuardado._id;

        // 4. Logins para obtener los tokens
        const resAdmin = await request(app).post('/api/login').send({
            identifier: "admin_crud@test.com",
            contrasena: "admin123"
        });
        adminToken = resAdmin.body.token;

        const resUser = await request(app).post('/api/login').send({
            identifier: "user_crud@test.com",
            contrasena: "user123"
        });
        userToken = resUser.body.token;
    });

    afterAll(async () => {
        // Limpieza final
        await Producto.deleteMany({ categoria: "Test-CRUD" });
        await mongoose.connection.close();
    });

    // --- SECCIÓN DE PRODUCTOS ---
    describe('Operaciones de Productos', () => {
        
        test('POST - Debería crear un producto (Admin)', async () => {
            const res = await request(app)
                .post('/api/crearProducto')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    nombre: `Producto Test ${Date.now()}`,
                    precio: 500,
                    stock: 10,
                    categoria: "Test-CRUD",
                    descripcion: "Descripción de prueba"
                });

            expect(res.statusCode).toBe(201);
            // Capturamos el ID del objeto 'producto' según tu controlador corregido
            productoId = res.body.producto._id;
        });

        test('PUT - Debería editar un producto (Admin)', async () => {
            const res = await request(app)
                .put(`/api/actualizarProducto/${productoId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    precio: 999,
                    stock: 50
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.producto.precio).toBe(999);
        });

        test('DELETE - Debería eliminar un producto (Admin)', async () => {
            const res = await request(app)
                .delete(`/api/eliminarProducto/${productoId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            // Ajustado a tu mensaje del controlador
            expect(res.body.message).toBe('Producto eliminado correctamente');
        });
    });

    // --- SECCIÓN DE USUARIOS ---
    describe('Operaciones de Usuarios', () => {
        
        test('PUT - Debería actualizar datos de un usuario (Admin)', async () => {
            const res = await request(app)
                .put(`/api/actualizarUsuario/${usuarioCreadoId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    apellido: "Apellido Modificado",
                    nombre: "Nombre Modificado"
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Perfil Actualizado');
        });

        test('PUT - Debería rebotar si un Usuario intenta editar (403)', async () => {
            const res = await request(app)
                .put(`/api/actualizarUsuario/${usuarioCreadoId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ nombre: "Intento de Hack" });

            expect(res.statusCode).toBe(403);
        });
    });
});