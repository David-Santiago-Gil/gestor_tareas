/**
 * setup-db.js
 * -----------
 * Script independiente de configuración de la base de datos.
 * Ejecutar con: node setup-db.js
 *
 * Crea las 3 tablas (administradores, usuarios, tareas) si no existen,
 * e inserta los datos iniciales (admin por defecto + 6 usuarios).
 * 
 * Funciona tanto en local (MySQL Workbench) como en Railway.
 * RNF-06: Disponibilidad — replicación rápida del entorno.
 */

require('dotenv').config();
const mysql  = require('mysql2');
const bcrypt = require('bcryptjs');

console.log('🔧 setup-db.js — Configuración de Base de Datos');
console.log('================================================\n');

const sql = mysql.createConnection({
    host:     process.env.MYSQLHOST     || process.env.SQL_HOST     || 'localhost',
    port:     process.env.MYSQLPORT     || process.env.SQL_PORT     || 3306,
    user:     process.env.MYSQLUSER     || process.env.SQL_USER     || 'root',
    password: process.env.MYSQLPASSWORD || process.env.SQL_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.SQL_NAME     || 'tareas_db',
});

sql.connect((err) => {
    if (err) {
        console.error('❌ Error de conexión a MySQL:', err.message);
        console.error('   Verifica que MySQL esté corriendo y las credenciales en .env sean correctas.');
        process.exit(1);
    }
    console.log('✅ Conectado a MySQL correctamente');
    console.log(`   Host: ${sql.config.host}:${sql.config.port}`);
    console.log(`   Base de datos: ${sql.config.database}\n`);
    ejecutarSetup();
});

async function ejecutarSetup() {
    try {
        // ========================================
        // PASO 1: Crear tabla administradores
        // ========================================
        await queryPromise(`
            CREATE TABLE IF NOT EXISTS administradores (
                id       INT          AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            )
        `);
        console.log('✅ Tabla "administradores" lista');

        // ========================================
        // PASO 2: Crear tabla usuarios
        // ========================================
        await queryPromise(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id     INT          AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(150) NOT NULL,
                avatar VARCHAR(100) NOT NULL DEFAULT 'usuario-1.png'
            )
        `);
        console.log('✅ Tabla "usuarios" lista');

        // ========================================
        // PASO 3: Crear tabla tareas (con FK a usuarios)
        // ========================================
        await queryPromise(`
            CREATE TABLE IF NOT EXISTS tareas (
                id         VARCHAR(50)  PRIMARY KEY,
                titulo     VARCHAR(255) NOT NULL,
                resumen    TEXT,
                expira     DATE,
                idUsuario  INT          NOT NULL,
                completada TINYINT      DEFAULT 0,
                FOREIGN KEY (idUsuario) REFERENCES usuarios(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabla "tareas" lista (con FK cascade a usuarios)\n');

        // ========================================
        // PASO 4: Seed de administrador por defecto
        // ========================================
        const [adminCount] = await queryPromise('SELECT COUNT(*) AS total FROM administradores');
        if (adminCount.total === 0) {
            const hash = bcrypt.hashSync('admin123', 10);
            await queryPromise(
                'INSERT INTO administradores (username, password) VALUES (?, ?)',
                ['admin', hash]
            );
            console.log('🌱 Admin creado: username="admin", password="admin123"');
            console.log('   ⚠️  Cambia la contraseña en producción\n');
        } else {
            console.log(`ℹ️  Seed admin omitido: ya existen ${adminCount.total} administrador(es)\n`);
        }

        // ========================================
        // PASO 5: Seed de usuarios por defecto
        // ========================================
        const [userCount] = await queryPromise('SELECT COUNT(*) AS total FROM usuarios');
        if (userCount.total === 0) {
            const usuariosIniciales = [
                ['Antonia Céspedes', 'usuario-1.png'],
                ['Emilia Torres',    'usuario-2.png'],
                ['Marcos Jeremías',  'usuario-3.png'],
                ['David Mercado',    'usuario-4.png'],
                ['Pamela Chan',      'usuario-5.png'],
                ['Adrián Serbio',    'usuario-6.png'],
            ];
            await queryPromise('INSERT INTO usuarios (nombre, avatar) VALUES ?', [usuariosIniciales]);
            console.log('🌱 6 usuarios creados:');
            usuariosIniciales.forEach(([nombre, avatar], i) => {
                console.log(`   ${i + 1}. ${nombre} (${avatar})`);
            });
        } else {
            console.log(`ℹ️  Seed usuarios omitido: ya existen ${userCount.total} usuario(s)`);
        }

        console.log('\n================================================');
        console.log('✅ Setup completado exitosamente');
        console.log('   Puedes iniciar el servidor con: node index.js');
        console.log('================================================');

    } catch (e) {
        console.error('\n❌ Error durante el setup:', e.message);
    } finally {
        sql.end();
    }
}

/**
 * Envuelve sql.query en una Promise para usar async/await
 */
function queryPromise(query, params = []) {
    return new Promise((resolve, reject) => {
        sql.query(query, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}
