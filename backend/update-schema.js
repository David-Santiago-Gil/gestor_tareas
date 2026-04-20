require('dotenv').config();
const mysql = require('mysql2');

const sql = mysql.createConnection({
    host:     process.env.MYSQLHOST     || process.env.SQL_HOST     || 'localhost',
    port:     process.env.MYSQLPORT     || process.env.SQL_PORT     || 3306,
    user:     process.env.MYSQLUSER     || process.env.SQL_USER     || 'root',
    password: process.env.MYSQLPASSWORD || process.env.SQL_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.SQL_NAME     || 'tareas_db',
});

sql.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL', err);
        return;
    }
    
    // Migration 1: Add imagenFondo to tareas
    const alterTareas = `
        ALTER TABLE tareas
        ADD COLUMN imagenFondo VARCHAR(100) DEFAULT 'bg_jujutsu.png'
    `;

    sql.query(alterTareas, (err) => {
        if (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('✅ Column tareas.imagenFondo already exists.');
            } else {
                console.error('❌ Error adding tareas.imagenFondo:', err);
            }
        } else {
            console.log('✅ Column tareas.imagenFondo added successfully.');
        }

        // Migration 2: Add fondoCard to usuarios
        const alterUsuarios = `
            ALTER TABLE usuarios
            ADD COLUMN fondoCard VARCHAR(100) NOT NULL DEFAULT 'bg_jujutsu.png'
        `;

        sql.query(alterUsuarios, (err) => {
            if (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('✅ Column usuarios.fondoCard already exists.');
                } else {
                    console.error('❌ Error adding usuarios.fondoCard:', err);
                }
            } else {
                console.log('✅ Column usuarios.fondoCard added successfully.');

                // Assign different defaults to existing users
                const defaults = [
                    'bg_jujutsu.png', 'bg_kimetsu.png', 'bg_solo.png',
                    'bg_tokyo.png', 'bg_onepunch.png'
                ];
                sql.query('SELECT id FROM usuarios ORDER BY id ASC', (err, rows) => {
                    if (!err && rows) {
                        rows.forEach((row, i) => {
                            const fondo = defaults[i % defaults.length];
                            sql.query('UPDATE usuarios SET fondoCard = ? WHERE id = ?', [fondo, row.id]);
                        });
                        console.log('✅ Assigned different default backgrounds to existing users.');
                    }
                });
            }
            sql.end();
        });
    });
});
