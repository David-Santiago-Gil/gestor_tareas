const mysql = require('mysql2');
require('dotenv').config();

const sql = mysql.createConnection({
    host:     process.env.MYSQLHOST     || process.env.SQL_HOST     || 'localhost',
    port:     process.env.MYSQLPORT     || process.env.SQL_PORT     || 3306,
    user:     process.env.MYSQLUSER     || process.env.SQL_USER     || 'root',
    password: process.env.MYSQLPASSWORD || process.env.SQL_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.SQL_NAME     || 'tareas_db',
});

sql.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
    sql.query("ALTER TABLE tareas ADD COLUMN imagenFondo VARCHAR(100) DEFAULT 'bg_jujutsu.png'", function (err, result) {
      if (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
        } else {
            console.log(err);
        }
      } else {
        console.log("Table altered");
      }
      process.exit(0);
    });
});
