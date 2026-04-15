// ==========================================
// IMPORTACIONES
// ==========================================
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const mysql      = require('mysql2');
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');

// ==========================================
// VALIDACIÓN CRÍTICA DE VARIABLES DE ENTORNO
// ==========================================
if (!process.env.JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET no está definido en las variables de entorno. El servidor no puede arrancar.');
    process.exit(1);
}

const JWT_SECRET     = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '8h';

// ==========================================
// CONFIGURACIÓN APP
// ==========================================
const app = express();

// CORS explícito — NO se usa cors() vacío
const allowedOrigins = ['http://localhost:4200'];
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// ==========================================
// CONEXIÓN MYSQL
// ==========================================
const sql = mysql.createConnection({
    host:     process.env.MYSQLHOST     || process.env.SQL_HOST     || 'localhost',
    port:     process.env.MYSQLPORT     || process.env.SQL_PORT     || 3306,
    user:     process.env.MYSQLUSER     || process.env.SQL_USER     || 'root',
    password: process.env.MYSQLPASSWORD || process.env.SQL_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.SQL_NAME     || 'tareas_db',
});

sql.connect((err) => {
    if (err) {
        console.error('❌ Error conexión MySQL:', err);
        return;
    }
    console.log('✅ Conectado a MySQL');

    // Una vez conectados, garantizamos las tablas y corremos el seed
    inicializarBaseDeDatos();
});

// ==========================================
// AUTO-CREACIÓN DE TABLAS + SEEDING
// Crea las tablas si no existen, luego verifica
// si administradores está vacía e inserta el admin por defecto.
// Funciona tanto en local (MySQL Workbench) como en Railway.
// ==========================================
function inicializarBaseDeDatos() {
    const crearTablaAdmins = `
        CREATE TABLE IF NOT EXISTS administradores (
            id       INT          AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL
        )
    `;

    const crearTablaTareas = `
        CREATE TABLE IF NOT EXISTS tareas (
            id         VARCHAR(50)  PRIMARY KEY,
            titulo     VARCHAR(255) NOT NULL,
            resumen    TEXT,
            expira     DATE,
            idUsuario  VARCHAR(50)  NOT NULL,
            completada TINYINT      DEFAULT 0
        )
    `;

    // Paso 1: Crear tabla administradores
    sql.query(crearTablaAdmins, (err) => {
        if (err) {
            console.error('❌ Error creando tabla administradores:', err);
            return;
        }
        console.log('✅ Tabla administradores lista');

        // Paso 2: Crear tabla tareas
        sql.query(crearTablaTareas, (err2) => {
            if (err2) {
                console.error('❌ Error creando tabla tareas:', err2);
                return;
            }
            console.log('✅ Tabla tareas lista');

            // Paso 3: Seed del admin por defecto
            sql.query('SELECT COUNT(*) AS total FROM administradores', (err3, rows) => {
                if (err3) {
                    console.error('❌ Error contando administradores:', err3);
                    return;
                }
                if (rows[0].total === 0) {
                    const hash = bcrypt.hashSync('admin123', 10);
                    sql.query(
                        'INSERT INTO administradores (username, password) VALUES (?, ?)',
                        ['admin', hash],
                        (err4) => {
                            if (err4) {
                                console.error('❌ Error insertando admin por defecto:', err4);
                            } else {
                                console.log('🌱 Seed: admin creado con contraseña "admin123"');
                            }
                        }
                    );
                } else {
                    console.log(`ℹ️  Seed omitido: ya existen ${rows[0].total} administrador(es)`);
                }
            });
        });
    });
}

// ==========================================
// MIDDLEWARE JWT — protege rutas privadas
// ==========================================
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado' });
        }
        req.admin = payload; // { id, username }
        next();
    });
}

// ==========================================
// RF-A1 — POST /api/auth/login
// ==========================================
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'username y password son requeridos' });
    }

    sql.query(
        'SELECT * FROM administradores WHERE username = ?',
        [username],
        async (err, rows) => {
            if (err) {
                console.error('❌ Error login:', err);
                return res.status(500).json({ error: 'Error interno' });
            }

            if (rows.length === 0) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const admin = rows[0];
            const coincide = await bcrypt.compare(password, admin.password);

            if (!coincide) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const token = jwt.sign(
                { id: admin.id, username: admin.username },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRATION }
            );

            res.json({ token });
        }
    );
});

// ==========================================
// RF-A2 — POST /api/auth/admins (protegido)
// Crear nuevo administrador
// ==========================================
app.post('/api/auth/admins', verificarToken, async (req, res) => {
    // Solo el administrador principal (ID 1) puede crear otros
    if (req.admin.id !== 1) {
        return res.status(403).json({ error: 'Solo el administrador principal puede crear administradores' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'username y password son requeridos' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        sql.query(
            'INSERT INTO administradores (username, password) VALUES (?, ?)',
            [username, hash],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ error: 'El username ya existe' });
                    }
                    console.error('❌ Error creando admin:', err);
                    return res.status(500).json({ error: 'Error interno' });
                }
                res.status(201).json({ id: result.insertId, username });
            }
        );
    } catch (e) {
        console.error('❌ Error bcrypt:', e);
        res.status(500).json({ error: 'Error interno' });
    }
});

// ==========================================
// RF-A2 — PUT /api/auth/admins/perfil (protegido)
// Editar perfil del admin autenticado
// ==========================================
app.put('/api/auth/admins/perfil', verificarToken, async (req, res) => {
    const { username, password } = req.body;

    if (!username && !password) {
        return res.status(400).json({ error: 'Debes proporcionar username y/o password a actualizar' });
    }

    try {
        const campos = [];
        const valores = [];

        if (username) {
            campos.push('username = ?');
            valores.push(username);
        }

        if (password) {
            const hash = await bcrypt.hash(password, 10);
            campos.push('password = ?');
            valores.push(hash);
        }

        valores.push(req.admin.id); // WHERE id = id del token

        const query = `UPDATE administradores SET ${campos.join(', ')} WHERE id = ?`;

        sql.query(query, valores, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'El username ya está en uso' });
                }
                console.error('❌ Error actualizando perfil:', err);
                return res.status(500).json({ error: 'Error interno' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Administrador no encontrado' });
            }
            res.json({ mensaje: 'Perfil actualizado' });
        });
    } catch (e) {
        console.error('❌ Error bcrypt:', e);
        res.status(500).json({ error: 'Error interno' });
    }
});

// ==========================================
// GET /api/auth/admins (protegido)
// Listar administradores registrados
// ==========================================
app.get('/api/auth/admins', verificarToken, (req, res) => {
    sql.query('SELECT id, username FROM administradores', (err, results) => {
        if (err) {
            console.error('❌ Error listando admins:', err);
            return res.status(500).json({ error: 'Error interno' });
        }
        res.json(results);
    });
});

// ==========================================
// DELETE /api/auth/admins/:id (protegido)
// Eliminar un administrador
// ==========================================
app.delete('/api/auth/admins/:id', verificarToken, (req, res) => {
    // Solo el administrador principal puede borrar
    if (req.admin.id !== 1) {
        return res.status(403).json({ error: 'Solo el administrador principal puede eliminar otros administradores' });
    }

    const { id } = req.params;

    // No se puede borrar al administrador principal (ID 1)
    if (parseInt(id, 10) === 1) {
        return res.status(403).json({ error: 'El administrador principal no puede ser eliminado' });
    }

    // Protección para no borrarse a sí mismo si se solicita
    if (parseInt(id, 10) === req.admin.id) {
        return res.status(403).json({ error: 'No puedes borrar tu propia sesión actual remota' });
    }

    sql.query('DELETE FROM administradores WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('❌ Error DELETE admin:', err);
            return res.status(500).json({ error: 'Error interno' });
        }
        res.json({ mensaje: 'Administrador eliminado' });
    });
});

// ==========================================
// PUT /api/auth/admins/:id (protegido)
// Editar otro administrador
// ==========================================
app.put('/api/auth/admins/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;

    // No se puede modificar al administrador principal por aquí
    if (parseInt(id, 10) === 1) {
        return res.status(403).json({ error: 'El administrador principal no puede ser modificado aquí' });
    }

    if (!username && !password) {
        return res.status(400).json({ error: 'Datos insuficientes' });
    }

    try {
        const campos = [];
        const valores = [];

        if (username) {
            campos.push('username = ?');
            valores.push(username);
        }

        if (password) {
            const hash = await bcrypt.hash(password, 10);
            campos.push('password = ?');
            valores.push(hash);
        }

        valores.push(id);

        const query = `UPDATE administradores SET ${campos.join(', ')} WHERE id = ?`;

        sql.query(query, valores, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'El username ya existe' });
                }
                console.error('❌ Error actualizando admin:', err);
                return res.status(500).json({ error: 'Error interno' });
            }
            res.json({ mensaje: 'Administrador editado exitosamente' });
        });
    } catch (e) {
        console.error('❌ Error bcrypt (admin ID):', e);
        res.status(500).json({ error: 'Error interno' });
    }
});

// ==========================================
// RF-C1 — GET /tareas (PÚBLICO)
// ==========================================
app.get('/tareas', (req, res) => {
    sql.query('SELECT * FROM tareas', (err, results) => {
        if (err) {
            console.error('❌ Error GET tareas:', err);
            return res.status(500).json(err);
        }
        res.json(results);
    });
});

// ==========================================
// RF-C2 — POST /tareas (PROTEGIDO)
// ==========================================
app.post('/tareas', verificarToken, (req, res) => {
    const { id, titulo, resumen, expira, idUsuario } = req.body;

    console.log('📥 Datos recibidos:', req.body);

    const query = `
        INSERT INTO tareas (id, titulo, resumen, expira, idUsuario, completada)
        VALUES (?, ?, ?, ?, ?, 0)
    `;

    sql.query(query, [id, titulo, resumen, expira, idUsuario], (err) => {
        if (err) {
            console.error('❌ Error INSERT tarea:', err);
            return res.status(500).json(err);
        }
        res.json({ mensaje: 'Tarea creada correctamente' });
    });
});

// ==========================================
// RF-C2 — PUT /tareas/:id (PROTEGIDO) — completar
// ==========================================
app.put('/tareas/:id', verificarToken, (req, res) => {
    const { id } = req.params;

    console.log('📌 Completar ID:', id);

    sql.query('UPDATE tareas SET completada = 1 WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('❌ Error UPDATE tarea:', err);
            return res.status(500).json(err);
        }
        console.log('✔️ Filas afectadas:', result.affectedRows);
        res.json({ mensaje: 'Tarea completada' });
    });
});

// ==========================================
// RF-C2 — PUT /tareas/:id/editar (PROTEGIDO)
// ==========================================
app.put('/tareas/:id/editar', verificarToken, (req, res) => {
    const { id } = req.params;
    const { titulo, resumen, expira } = req.body;

    console.log('✏️ Editar ID:', id);

    sql.query(
        'UPDATE tareas SET titulo = ?, resumen = ?, expira = ? WHERE id = ?',
        [titulo, resumen, expira, id],
        (err) => {
            if (err) {
                console.error('❌ Error UPDATE tarea (editar):', err);
                return res.status(500).json(err);
            }
            res.json({ mensaje: 'Tarea editada correctamente' });
        }
    );
});

// ==========================================
// RF-C2 — DELETE /tareas/:id (PROTEGIDO)
// ==========================================
app.delete('/tareas/:id', verificarToken, (req, res) => {
    const { id } = req.params;

    console.log('🗑️ Eliminar ID:', id);

    sql.query('DELETE FROM tareas WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('❌ Error DELETE tarea:', err);
            return res.status(500).json(err);
        }
        res.json({ mensaje: 'Tarea eliminada' });
    });
});

// ==========================================
// SERVIDOR
// ==========================================
app.listen(3000, () => {
    console.log('🚀 Servidor corriendo en http://localhost:3000');
});