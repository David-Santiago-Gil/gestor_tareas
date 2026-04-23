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
// CONEXIÓN MYSQL — Soporte TiDB Cloud + SSL
// ==========================================
// Detecta automáticamente si se necesita SSL (TiDB Cloud, PlanetScale, etc.)
const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || process.env.SQL_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || process.env.SQL_PORT || '3306', 10);
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || process.env.SQL_USER || 'root';
const dbPass = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.SQL_PASSWORD || '';
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.SQL_NAME || 'tareas_db';

// SSL: se activa por variable de entorno o si el host es TiDB Cloud
const necesitaSSL =
    process.env.DB_SSL === 'true' ||
    dbHost.includes('tidbcloud.com') ||
    dbHost.includes('planetscale') ||
    !!process.env.DATABASE_URL;

const poolConfig = {
    host:     dbHost,
    port:     dbPort,
    user:     dbUser,
    password: dbPass,
    database: dbName,
    connectionLimit: 10,
    waitForConnections: true,
    connectTimeout: 30000,   // 30s — TiDB Cloud puede ser lento al inicio
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
};

// Configurar SSL/TLS si es necesario
if (necesitaSSL) {
    // Si se proporcionó un archivo CA personalizado, úsalo
    const caPath = process.env.DB_CA_PATH;
    if (caPath && fs.existsSync(caPath)) {
        poolConfig.ssl = {
            ca: fs.readFileSync(caPath),
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true,
        };
        console.log(`🔒 SSL activado con CA personalizado: ${caPath}`);
    } else {
        // TiDB Cloud Serverless usa ISRG Root X1 (Let's Encrypt)
        // que está en el trust store de la mayoría de sistemas
        poolConfig.ssl = {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true,
        };
        console.log('🔒 SSL/TLS activado (trust store del sistema)');
    }
}

console.log(`📡 Conectando a ${dbHost}:${dbPort} — DB: ${dbName}`);

const sql = mysql.createPool(poolConfig);

// ==========================================
// CONEXIÓN CON REINTENTOS (Exponential Backoff)
// ==========================================
const MAX_RETRIES   = 5;
const BASE_DELAY_MS = 2000;

function conectarConReintentos(intento = 1) {
    sql.getConnection((err, connection) => {
        if (err) {
            console.error(`❌ Intento ${intento}/${MAX_RETRIES} — Error conexión MySQL:`, err.message);

            if (intento < MAX_RETRIES) {
                const delay = BASE_DELAY_MS * Math.pow(2, intento - 1);
                console.log(`⏳ Reintentando en ${delay / 1000}s...`);
                setTimeout(() => conectarConReintentos(intento + 1), delay);
            } else {
                console.error('💀 Se agotaron los reintentos. Verifica la conexión a la base de datos.');
                process.exit(1);
            }
            return;
        }

        if (connection) connection.release();
        console.log('✅ Conectado a MySQL/TiDB exitosamente');

        // Una vez conectados, ejecutar auto-healing
        inicializarBaseDeDatos();
    });
}

conectarConReintentos();

// ==========================================
// AUTO-HEALING: CREACIÓN + REPARACIÓN DE TABLAS
// ==========================================
// Esquema maestro: define la estructura esperada de cada tabla.
// Si una tabla no existe, se crea. Si existe pero le faltan columnas,
// se agregan automáticamente con ALTER TABLE.
// ==========================================
const SCHEMA_MAESTRO = {
    administradores: {
        createSQL: `
            CREATE TABLE IF NOT EXISTS administradores (
                id       INT          AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            )
        `,
        columnas: {
            id:       { type: 'INT',          extra: 'AUTO_INCREMENT PRIMARY KEY' },
            username: { type: 'VARCHAR(100)',  extra: 'NOT NULL UNIQUE' },
            password: { type: 'VARCHAR(255)',  extra: 'NOT NULL' },
        },
    },
    usuarios: {
        createSQL: `
            CREATE TABLE IF NOT EXISTS usuarios (
                id        INT          AUTO_INCREMENT PRIMARY KEY,
                nombre    VARCHAR(150) NOT NULL,
                avatar    VARCHAR(100) NOT NULL DEFAULT 'usuario-1.png',
                fondoCard VARCHAR(100) NOT NULL DEFAULT 'bg_jujutsu.png'
            )
        `,
        columnas: {
            id:        { type: 'INT',          extra: 'AUTO_INCREMENT PRIMARY KEY' },
            nombre:    { type: 'VARCHAR(150)',  extra: 'NOT NULL' },
            avatar:    { type: 'VARCHAR(100)',  extra: "NOT NULL DEFAULT 'usuario-1.png'" },
            fondoCard: { type: 'VARCHAR(100)',  extra: "NOT NULL DEFAULT 'bg_jujutsu.png'" },
        },
    },
    tareas: {
        createSQL: `
            CREATE TABLE IF NOT EXISTS tareas (
                id          VARCHAR(50)  PRIMARY KEY,
                titulo      VARCHAR(255) NOT NULL,
                resumen     TEXT,
                expira      DATE,
                idUsuario   INT          NOT NULL,
                completada  TINYINT      DEFAULT 0,
                imagenFondo VARCHAR(100) DEFAULT 'bg_jujutsu.png',
                FOREIGN KEY (idUsuario) REFERENCES usuarios(id) ON DELETE CASCADE
            )
        `,
        columnas: {
            id:          { type: 'VARCHAR(50)',  extra: 'PRIMARY KEY' },
            titulo:      { type: 'VARCHAR(255)', extra: 'NOT NULL' },
            resumen:     { type: 'TEXT',          extra: '' },
            expira:      { type: 'DATE',          extra: '' },
            idUsuario:   { type: 'INT',           extra: 'NOT NULL' },
            completada:  { type: 'TINYINT',       extra: 'DEFAULT 0' },
            imagenFondo: { type: 'VARCHAR(100)',  extra: "DEFAULT 'bg_jujutsu.png'" },
        },
    },
};

/**
 * Ejecuta una query como Promise (útil para async/await)
 */
function queryPromise(query, params = []) {
    return new Promise((resolve, reject) => {
        sql.query(query, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

/**
 * Auto-Healing: verifica las columnas de una tabla existente
 * y agrega las que falten con ALTER TABLE.
 */
async function repararTabla(nombreTabla, columnasEsperadas) {
    try {
        const columnas = await queryPromise(`SHOW COLUMNS FROM ${nombreTabla}`);
        const existentes = new Set(columnas.map(c => c.Field));

        for (const [col, def] of Object.entries(columnasEsperadas)) {
            if (!existentes.has(col)) {
                const alterSQL = `ALTER TABLE ${nombreTabla} ADD COLUMN ${col} ${def.type} ${def.extra}`;
                console.log(`🔧 Auto-healing: agregando columna "${col}" a "${nombreTabla}"`);
                await queryPromise(alterSQL);
                console.log(`   ✅ Columna "${col}" agregada exitosamente`);
            }
        }
    } catch (err) {
        console.error(`❌ Error reparando tabla "${nombreTabla}":`, err.message);
    }
}

/**
 * Inicializa la base de datos:
 *   1. Crea tablas si no existen (en orden de dependencias)
 *   2. Repara esquemas con columnas faltantes
 *   3. Inserta datos semilla si las tablas están vacías
 */
async function inicializarBaseDeDatos() {
    console.log('\n🔄 Iniciando auto-healing de la base de datos...');
    console.log('================================================');

    try {
        // ── PASO 1: Crear tablas en orden de dependencias ──
        const orden = ['administradores', 'usuarios', 'tareas'];

        for (const tabla of orden) {
            await queryPromise(SCHEMA_MAESTRO[tabla].createSQL);
            console.log(`✅ Tabla "${tabla}" lista`);
        }

        // ── PASO 2: Auto-healing — reparar columnas faltantes ──
        console.log('\n🩺 Verificando integridad del esquema...');
        for (const tabla of orden) {
            await repararTabla(tabla, SCHEMA_MAESTRO[tabla].columnas);
        }
        console.log('✅ Esquema verificado y reparado\n');

        // ── PASO 3: Seed del admin por defecto ──
        const [adminCount] = await queryPromise('SELECT COUNT(*) AS total FROM administradores');
        if (adminCount.total === 0) {
            const hash = bcrypt.hashSync('admin123', 10);
            await queryPromise(
                'INSERT INTO administradores (username, password) VALUES (?, ?)',
                ['admin', hash]
            );
            console.log('🌱 Seed: admin creado — usuario: "admin", contraseña: "admin123"');
        } else {
            console.log(`ℹ️  Seed omitido: ya existen ${adminCount.total} administrador(es)`);
        }

        // ── PASO 4: Seed de usuarios por defecto ──
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
            console.log('🌱 Seed: 6 usuarios creados correctamente');
        } else {
            console.log(`ℹ️  Seed omitido: ya existen ${userCount.total} usuario(s)`);
        }

        console.log('\n================================================');
        console.log('✅ Auto-healing completado — Base de datos lista');
        console.log('================================================\n');

    } catch (err) {
        console.error('❌ Error crítico durante auto-healing:', err.message);
        console.error('   El servidor continuará, pero pueden ocurrir errores en las queries.');
    }
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