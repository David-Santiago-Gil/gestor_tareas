// ==========================================
// IMPORTACIONES
// ==========================================
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const mysql      = require('mysql2');
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const fs         = require('fs');
const path       = require('path');

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

// ✅ TASK-16: CORS configurado correctamente — agregado por auditoría
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:4200'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ==========================================
// CONEXIÓN MYSQL (POOL para Railway)
// ==========================================
// Railway exige manejar límites de conexión, Pool es obligatorio para no crashear
// ✅ TASK-15: Variables de entorno en backend (sin hardcoding) — agregado por auditoría
const sql = mysql.createPool({
    host:     process.env.DB_HOST     || process.env.MYSQLHOST     || process.env.SQL_HOST     || 'localhost',
    port:     process.env.DB_PORT     || process.env.MYSQLPORT     || process.env.SQL_PORT     || 3306,
    user:     process.env.DB_USER     || process.env.MYSQLUSER     || process.env.SQL_USER     || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.SQL_PASSWORD || '',
    database: process.env.DB_NAME     || process.env.MYSQLDATABASE || process.env.SQL_NAME     || 'tareas_db',
    connectionLimit: 10,
    waitForConnections: true
});

sql.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error conexión MySQL (Railway Pool):', err);
        return;
    }
    if (connection) connection.release();
    console.log('✅ Conectado a MySQL (Railway Pool)');

    // Una vez conectados, garantizamos las tablas y corremos el seed
    inicializarBaseDeDatos();
});

// ==========================================
// AUTO-CREACIÓN DE TABLAS + SEEDING
// Crea las tablas si no existen, luego verifica
// si administradores/usuarios están vacías e inserta datos por defecto.
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

    const crearTablaUsuarios = `
        CREATE TABLE IF NOT EXISTS usuarios (
            id        INT          AUTO_INCREMENT PRIMARY KEY,
            nombre    VARCHAR(150) NOT NULL,
            avatar    VARCHAR(100) NOT NULL DEFAULT 'usuario-1.png',
            fondoCard VARCHAR(100) NOT NULL DEFAULT 'bg_jujutsu.png'
        )
    `;

    const crearTablaTareas = `
        CREATE TABLE IF NOT EXISTS tareas (
            id         VARCHAR(50)  PRIMARY KEY,
            titulo     VARCHAR(255) NOT NULL,
            resumen    TEXT,
            expira     DATE,
            idUsuario  INT          NOT NULL,
            completada TINYINT      DEFAULT 0,
            imagenFondo VARCHAR(100) DEFAULT 'bg_jujutsu.png',
            FOREIGN KEY (idUsuario) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    `;

    // Paso 1: Crear tabla administradores
    sql.query(crearTablaAdmins, (err) => {
        if (err) {
            console.error('❌ Error creando tabla administradores:', err);
            return;
        }
        console.log('✅ Tabla administradores lista');

        // Paso 2: Crear tabla usuarios
        sql.query(crearTablaUsuarios, (err2) => {
            if (err2) {
                console.error('❌ Error creando tabla usuarios:', err2);
                return;
            }
            console.log('✅ Tabla usuarios lista');

            // Paso 3: Crear tabla tareas (depende de usuarios por la FK)
            sql.query(crearTablaTareas, (err3) => {
                if (err3) {
                    console.error('❌ Error creando tabla tareas:', err3);
                    return;
                }
                console.log('✅ Tabla tareas lista');

                // Paso 4: Seed del admin por defecto
                sql.query('SELECT COUNT(*) AS total FROM administradores', (err4, rows) => {
                    if (err4) {
                        console.error('❌ Error contando administradores:', err4);
                        return;
                    }
                    if (rows[0].total === 0) {
                        const hash = bcrypt.hashSync('admin123', 10);
                        sql.query(
                            'INSERT INTO administradores (username, password) VALUES (?, ?)',
                            ['admin', hash],
                            (err5) => {
                                if (err5) {
                                    console.error('❌ Error insertando admin por defecto:', err5);
                                } else {
                                    console.log('🌱 Seed: admin creado con contraseña "admin123"');
                                }
                            }
                        );
                    } else {
                        console.log(`ℹ️  Seed omitido: ya existen ${rows[0].total} administrador(es)`);
                    }
                });

                // Paso 5: Seed de usuarios por defecto
                sql.query('SELECT COUNT(*) AS total FROM usuarios', (err4, rows) => {
                    if (err4) {
                        console.error('❌ Error contando usuarios:', err4);
                        return;
                    }
                    if (rows[0].total === 0) {
                        const usuariosIniciales = [
                            ['Antonia Céspedes', 'usuario-1.png'],
                            ['Emilia Torres',    'usuario-2.png'],
                            ['Marcos Jeremías',  'usuario-3.png'],
                            ['David Mercado',    'usuario-4.png'],
                            ['Pamela Chan',      'usuario-5.png'],
                            ['Adrián Serbio',    'usuario-6.png'],
                        ];
                        const insertQuery = 'INSERT INTO usuarios (nombre, avatar) VALUES ?';
                        sql.query(insertQuery, [usuariosIniciales], (err5) => {
                            if (err5) {
                                console.error('❌ Error insertando usuarios por defecto:', err5);
                            } else {
                                console.log('🌱 Seed: 6 usuarios creados correctamente');
                            }
                        });
                    } else {
                        console.log(`ℹ️  Seed omitido: ya existen ${rows[0].total} usuario(s)`);
                    }
                });
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

    // Permitimos modificar todos los admins (incluso el principal ID=1)
    

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
// RF-02 — GET /api/usuarios (PÚBLICO)
// Listar todos los usuarios
// ==========================================
app.get('/api/usuarios', (req, res) => {
    sql.query('SELECT id, nombre, avatar, fondoCard FROM usuarios ORDER BY id ASC', (err, results) => {
        if (err) {
            console.error('❌ Error GET usuarios:', err);
            return res.status(500).json({ error: 'Error al obtener usuarios' });
        }
        res.json(results);
    });
});

// ==========================================
// RF-02 — POST /api/usuarios (PROTEGIDO)
// Crear un nuevo usuario
// ==========================================
app.post('/api/usuarios', verificarToken, (req, res) => {
    const { nombre, avatar, fondoCard } = req.body;

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'El nombre del usuario es requerido' });
    }

    const avatarFinal = avatar || 'usuario-1.png';
    const fondoFinal  = fondoCard || 'bg_jujutsu.png';

    sql.query(
        'INSERT INTO usuarios (nombre, avatar, fondoCard) VALUES (?, ?, ?)',
        [nombre.trim(), avatarFinal, fondoFinal],
        (err, result) => {
            if (err) {
                console.error('❌ Error POST usuario:', err);
                return res.status(500).json({ error: 'Error al crear usuario' });
            }
            res.status(201).json({
                id: result.insertId,
                nombre: nombre.trim(),
                avatar: avatarFinal,
                fondoCard: fondoFinal,
                mensaje: 'Usuario creado exitosamente'
            });
        }
    );
});

// ==========================================
// RF-02 — PUT /api/usuarios/:id (PROTEGIDO)
// Actualizar nombre y/o avatar de un usuario
// ==========================================
app.put('/api/usuarios/:id', verificarToken, (req, res) => {
    const { id } = req.params;
    const { nombre, avatar, fondoCard } = req.body;

    if (!nombre && !avatar && !fondoCard) {
        return res.status(400).json({ error: 'Debes proporcionar nombre, avatar y/o fondo a actualizar' });
    }

    const campos = [];
    const valores = [];

    if (nombre) {
        campos.push('nombre = ?');
        valores.push(nombre.trim());
    }

    if (avatar) {
        campos.push('avatar = ?');
        valores.push(avatar);
    }

    if (fondoCard) {
        campos.push('fondoCard = ?');
        valores.push(fondoCard);
    }

    valores.push(id);

    const query = `UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`;

    sql.query(query, valores, (err, result) => {
        if (err) {
            console.error('❌ Error PUT usuario:', err);
            return res.status(500).json({ error: 'Error al actualizar usuario' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ mensaje: 'Usuario actualizado exitosamente' });
    });
});

// ==========================================
// RF-02 + RF-06 — DELETE /api/usuarios/:id (PROTEGIDO)
// Eliminar usuario y sus tareas (CASCADE)
// ==========================================
app.delete('/api/usuarios/:id', verificarToken, (req, res) => {
    const { id } = req.params;

    sql.query('DELETE FROM usuarios WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('❌ Error DELETE usuario:', err);
            return res.status(500).json({ error: 'Error al eliminar usuario' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        // Gracias a ON DELETE CASCADE, las tareas del usuario ya fueron eliminadas
        res.json({ mensaje: 'Usuario y sus tareas eliminados exitosamente' });
    });
});

// ==========================================
// RF-05 — GET /api/avatares (PÚBLICO)
// Listar avatares disponibles en el servidor
// ==========================================
app.get('/api/avatares', (req, res) => {
    // Lista estática de avatares disponibles en el proyecto
    const avatares = [
        'usuario-1.png',
        'usuario-2.png',
        'usuario-3.png',
        'usuario-4.png',
        'usuario-5.png',
        'usuario-6.png',
        'usuario-7.png',
        'usuario-8.png',
        'usuario-9.png',
        'usuario-10.png',
    ];
    res.json(avatares);
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
    const { id, titulo, resumen, expira, idUsuario, imagenFondo } = req.body;

    console.log('📥 Datos recibidos:', req.body);

    // RF-03: Validar que el usuario existe antes de crear la tarea
    sql.query('SELECT id FROM usuarios WHERE id = ?', [idUsuario], (errU, rows) => {
        if (errU) {
            console.error('❌ Error verificando usuario:', errU);
            return res.status(500).json({ error: 'Error interno' });
        }
        if (rows.length === 0) {
            return res.status(400).json({ error: 'El usuario especificado no existe' });
        }

        const query = `
            INSERT INTO tareas (id, titulo, resumen, expira, idUsuario, completada, imagenFondo)
            VALUES (?, ?, ?, ?, ?, 0, ?)
        `;

        const fondoReal = imagenFondo || 'bg_jujutsu.png';

        sql.query(query, [id, titulo, resumen, expira, idUsuario, fondoReal], (err) => {
            if (err) {
                console.error('❌ Error INSERT tarea:', err);
                return res.status(500).json(err);
            }
            res.json({ mensaje: 'Tarea creada correctamente' });
        });
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
// RF-C2 — PUT /tareas/:id/reabrir (PROTEGIDO)
// ==========================================
app.put('/tareas/:id/reabrir', verificarToken, (req, res) => {
    const { id } = req.params;

    sql.query('UPDATE tareas SET completada = 0 WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('❌ Error UPDATE tarea (reabrir):', err);
            return res.status(500).json(err);
        }
        res.json({ mensaje: 'Tarea reabierta' });
    });
});

// ==========================================
// RF-C2 — PUT /tareas/:id/editar (PROTEGIDO)
// ==========================================
app.put('/tareas/:id/editar', verificarToken, (req, res) => {
    const { id } = req.params;
    const { titulo, resumen, expira, imagenFondo } = req.body;

    console.log('✏️ Editar ID:', id);

    const fondoReal = imagenFondo || 'bg_jujutsu.png';

    sql.query(
        'UPDATE tareas SET titulo = ?, resumen = ?, expira = ?, imagenFondo = ? WHERE id = ?',
        [titulo, resumen, expira, fondoReal, id],
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
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en el puerto ${port}`);
});