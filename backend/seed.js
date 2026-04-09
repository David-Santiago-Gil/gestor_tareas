/**
 * seed.js
 * -------
 * Script independiente de seeding. Puede ejecutarse manualmente con:
 *   node seed.js
 *
 * También es invocado internamente por index.js al arrancar.
 * Detecta si la tabla 'administradores' está vacía e inserta
 * el usuario "admin" con contraseña "admin123" (bcrypt, salt=10).
 */

require('dotenv').config();
const mysql  = require('mysql2');
const bcrypt = require('bcryptjs');

if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET no encontrado en .env, pero seed.js solo necesita SQL_*');
}

const sql = mysql.createConnection({
    host:     process.env.MYSQLHOST     || process.env.SQL_HOST     || 'localhost',
    port:     process.env.MYSQLPORT     || process.env.SQL_PORT     || 3306,
    user:     process.env.MYSQLUSER     || process.env.SQL_USER     || 'root',
    password: process.env.MYSQLPASSWORD || process.env.SQL_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.SQL_NAME     || 'tareas_db',
});

sql.connect((err) => {
    if (err) {
        console.error('❌ Error conexión MySQL en seed:', err);
        process.exit(1);
    }
    console.log('✅ Seed: conectado a MySQL');
    correrSeed();
});

function correrSeed() {
    // Paso 1: garantizar que la tabla existe
    const crearTabla = `
        CREATE TABLE IF NOT EXISTS administradores (
            id       INT          AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL
        )
    `;

    sql.query(crearTabla, (err) => {
        if (err) {
            console.error('❌ Error creando tabla administradores:', err);
            sql.end();
            return;
        }

        // Paso 2: contar registros SOLO después de crear la tabla
        sql.query('SELECT COUNT(*) AS total FROM administradores', (err2, rows) => {
            if (err2) {
                console.error('❌ Error contando administradores:', err2);
                sql.end();
                return;
            }

            if (rows[0].total > 0) {
                console.log(`ℹ️  Seed omitido: ya existen ${rows[0].total} administrador(es).`);
                sql.end();
                return;
            }

            // Paso 3: insertar admin por defecto
            const hash = bcrypt.hashSync('admin123', 10);
            sql.query(
                'INSERT INTO administradores (username, password) VALUES (?, ?)',
                ['admin', hash],
                (err3) => {
                    if (err3) {
                        console.error('❌ Error insertando admin por defecto:', err3);
                    } else {
                        console.log('🌱 Seed completado: admin creado con contraseña "admin123"');
                        console.log('⚠️  Cambia la contraseña de admin en producción vía PUT /api/auth/admins/perfil');
                    }
                    sql.end();
                }
            );
        });
    });
}
