# Prompt para Replicar CRUD Completo (Angular + Express + MySQL)

## Contexto del Proyecto
Proyecto Angular con un backend en Node.js (Express) conectado a una base de datos MySQL. La aplicación es un **gestor de tareas** donde se pueden crear, editar, completar y borrar tareas y los datos se guardan en MySQL.

## Base de Datos (MySQL Workbench)

```sql
CREATE DATABASE tareas_db;
USE tareas_db;

CREATE TABLE tareas (
    id VARCHAR(50) PRIMARY KEY,
    titulo VARCHAR(255),
    resumen TEXT,
    expira DATE,
    idUsuario VARCHAR(50),
    completada TINYINT DEFAULT 0
);
```

---

## Backend: [backend/index.js](file:///c:/Users/davi2/OneDrive/Desktop/Migel/GestoDeTareas/backend/index.js)

```javascript
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tareas_db',
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error conexión MySQL:', err);
        return;
    }
    console.log('✅ Conectado a MySQL');
});

// GET -> OBTENER TODAS LAS TAREAS
app.get('/tareas', (req, res) => {
    db.query('SELECT * FROM tareas', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// POST -> CREAR TAREA
app.post('/tareas', (req, res) => {
    const { id, titulo, resumen, expira, idUsuario } = req.body;
    const sql = `INSERT INTO tareas (id, titulo, resumen, expira, idUsuario, completada) VALUES (?, ?, ?, ?, ?, 0)`;
    db.query(sql, [id, titulo, resumen, expira, idUsuario], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: 'Tarea creada correctamente' });
    });
});

// PUT -> COMPLETAR TAREA
app.put('/tareas/:id', (req, res) => {
    const { id } = req.params;
    db.query('UPDATE tareas SET completada = 1 WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: 'Tarea completada' });
    });
});

// PUT -> EDITAR CAMPOS DE TAREA
app.put('/tareas/:id/editar', (req, res) => {
    const { id } = req.params;
    const { titulo, resumen, expira } = req.body;
    const sql = 'UPDATE tareas SET titulo = ?, resumen = ?, expira = ? WHERE id = ?';
    db.query(sql, [titulo, resumen, expira, id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: 'Tarea editada correctamente' });
    });
});

// DELETE -> ELIMINAR TAREA
app.delete('/tareas/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM tareas WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: 'Tarea eliminada' });
    });
});

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});
```

> **Dependencias backend:** `npm install express cors mysql2`

---

## Modelo: [src/app/components/tarea/tarea.model.ts](file:///c:/Users/davi2/OneDrive/Desktop/Migel/GestoDeTareas/src/app/components/tarea/tarea.model.ts)

```typescript
export interface tarea {
    id: string,
    idUsuario: string,
    titulo: string,
    resumen: string,
    expira: string,
    completada?: number,
}

export interface NuevaTareaInfo {
    titulo: string;
    resumen: string;
    fecha: string;
}
```

---

## Servicio: [src/app/servicios/tarea.service.ts](file:///c:/Users/davi2/OneDrive/Desktop/Migel/GestoDeTareas/src/app/servicios/tarea.service.ts)

```typescript
import { Injectable } from '@angular/core';
import { NuevaTareaInfo, tarea } from '../components/tarea/tarea.model';

@Injectable({ providedIn: 'root' })
export class TareaService {

  private tareas: tarea[] = [];

  constructor() { this.cargarTareasDesdeBackend(); }

  private async cargarTareasDesdeBackend() {
    try {
      const response = await fetch('http://localhost:3000/tareas');
      if (response.ok) { this.tareas = await response.json(); }
    } catch (e) { console.error('Error al conectar con el backend.', e); }
  }

  obtenerTareasDeUsuario(idUsuario: string) {
    return this.tareas.filter((t) => t.idUsuario === idUsuario);
  }

  async agregarTarea(info: NuevaTareaInfo, idUsuario: string) {
    const nueva: tarea = {
      id: new Date().getTime().toString(),
      titulo: info.titulo, resumen: info.resumen,
      expira: info.fecha, idUsuario, completada: 0
    };
    this.tareas.unshift(nueva);
    try {
      await fetch('http://localhost:3000/tareas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nueva)
      });
    } catch (e) { console.error('Error guardando', e); }
  }

  async completarTarea(id: string) {
    const t = this.tareas.find((t) => t.id === id);
    if (t) t.completada = 1;
    try { await fetch(`http://localhost:3000/tareas/${id}`, { method: 'PUT' }); }
    catch (e) { console.error('Error completando', e); }
  }

  async borrarTarea(id: string) {
    this.tareas = this.tareas.filter((t) => t.id !== id);
    try { await fetch(`http://localhost:3000/tareas/${id}`, { method: 'DELETE' }); }
    catch (e) { console.error('Error borrando', e); }
  }

  async editarTarea(id: string, titulo: string, resumen: string, expira: string) {
    const t = this.tareas.find((t) => t.id === id);
    if (t) { t.titulo = titulo; t.resumen = resumen; t.expira = expira; }
    try {
      await fetch(`http://localhost:3000/tareas/${id}/editar`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, resumen, expira })
      });
    } catch (e) { console.error('Error editando', e); }
  }
}
```

---

## Componente Tarea: [src/app/components/tarea/tarea.ts](file:///c:/Users/davi2/OneDrive/Desktop/Migel/GestoDeTareas/src/app/components/tarea/tarea.ts)

```typescript
import { Component, inject, Input } from '@angular/core';
import { tarea } from './tarea.model';
import { Tarjeta } from '../tarjeta/tarjeta';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TareaService } from '../../servicios/tarea.service';

@Component({
  selector: 'app-tarea',
  imports: [Tarjeta, DatePipe, FormsModule, NgClass],
  templateUrl: './tarea.html',
  styleUrl: './tarea.css',
})
export class Tarea {
  @Input({ required: true }) tarea!: tarea;
  private tareasService = inject(TareaService);

  // Estados
  editando = false;
  tituloEditado = '';
  resumenEditado = '';
  expiraEditado = '';

  alCompletarTarea() {
    this.tareasService.completarTarea(this.tarea.id);
  }

  alBorrarTarea() {
    this.tareasService.borrarTarea(this.tarea.id);
  }

  alEditarTarea() {
    this.tituloEditado = this.tarea.titulo;
    this.resumenEditado = this.tarea.resumen;
    this.expiraEditado = this.tarea.expira;
    this.editando = true;
  }

  alGuardarEdicion() {
    this.tareasService.editarTarea(
      this.tarea.id, this.tituloEditado,
      this.resumenEditado, this.expiraEditado
    );
    this.editando = false;
  }

  alCancelarEdicion() {
    this.editando = false;
  }
}
```

---

## Template: [src/app/components/tarea/tarea.html](file:///c:/Users/davi2/OneDrive/Desktop/Migel/GestoDeTareas/src/app/components/tarea/tarea.html)

```html
<!-- MODAL DE EDICIÓN -->
@if (editando) {
<div class="overlay" (click)="alCancelarEdicion()"></div>
<dialog open class="modal-editar">
    <h2>Editar Tarea</h2>
    <form (ngSubmit)="alGuardarEdicion()">
        <p>
            <label for="editTitulo">Título</label>
            <input type="text" id="editTitulo" [(ngModel)]="tituloEditado" name="titulo" />
        </p>
        <p>
            <label for="editResumen">Resumen</label>
            <textarea id="editResumen" rows="4" [(ngModel)]="resumenEditado" name="resumen"></textarea>
        </p>
        <p>
            <label for="editExpira">Fecha Límite</label>
            <input type="date" id="editExpira" [(ngModel)]="expiraEditado" name="expira" />
        </p>
        <p class="modal-acciones">
            <button type="button" (click)="alCancelarEdicion()">Cancelar</button>
            <button type="submit">Guardar</button>
        </p>
    </form>
</dialog>
}

<!-- TARJETA NORMAL -->
<app-tarjeta>
    <article [ngClass]="{ 'completada': tarea.completada === 1 }">
        <h2>{{ tarea.titulo }}</h2>
        <time>{{ tarea.expira | date: 'fullDate' }}</time>
        <p>{{ tarea.resumen }}</p>
        <div class="acciones">
            <button class="btn-terminar" (click)="alCompletarTarea()" [disabled]="tarea.completada === 1">
                {{ tarea.completada === 1 ? '✔ Completada' : 'Terminar' }}
            </button>
            <button class="btn-editar" (click)="alEditarTarea()" [disabled]="tarea.completada === 1">Editar</button>
            <button class="btn-borrar" (click)="alBorrarTarea()" [disabled]="tarea.completada === 1">Borrar</button>
        </div>
    </article>
</app-tarjeta>
```

---

## Estilos: [src/app/components/tarea/tarea.css](file:///c:/Users/davi2/OneDrive/Desktop/Migel/GestoDeTareas/src/app/components/tarea/tarea.css)

```css
:host { display: block; }

article {
    background: linear-gradient(145deg, #c5a0ec 0%, #bc95e7 100%);
    padding: 24px 28px;
    display: flex; flex-direction: column; gap: 8px;
    color: #2d1b4e; border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.3);
    box-shadow: inset 0 2px 4px rgba(255,255,255,0.4);
    transition: opacity 0.4s ease; position: relative;
}

/* COMPLETADA */
article.completada { opacity: 0.45; }
article.completada .btn-terminar,
article.completada .btn-editar,
article.completada .btn-borrar {
    pointer-events: none; cursor: not-allowed; opacity: 0.5;
}

h2 { font-size: 1.5rem; font-weight: 800; margin: 0; color: #2d1b4e; }
time { font-size: 0.9rem; font-weight: 600; color: #6a4f91; }
p { font-size: 1.05rem; color: #2d1b4e; margin: 0; line-height: 1.5; }

/* BOTONES */
.acciones { display: flex; gap: 10px; margin-top: 8px; justify-content: flex-end; flex-wrap: wrap; }
.acciones button {
    padding: 10px 20px; border-radius: 8px; border: none;
    font-size: 0.85rem; font-weight: 600; cursor: pointer;
    transition: all 0.3s ease; font-family: inherit;
}

.btn-terminar { background: #2b114d; color: white; box-shadow: 0 4px 12px rgba(43,17,77,0.3); }
.btn-terminar:hover:not(:disabled) { background: #1c0a34; transform: translateY(-2px); }

.btn-editar { background: #3b3082; color: white; box-shadow: 0 4px 12px rgba(59,48,130,0.3); }
.btn-editar:hover:not(:disabled) { background: #2a2266; transform: translateY(-2px); }

.btn-borrar { background: #7a1c3a; color: white; box-shadow: 0 4px 12px rgba(122,28,58,0.3); }
.btn-borrar:hover:not(:disabled) { background: #5e1230; transform: translateY(-2px); }

/* OVERLAY */
.overlay {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 999;
}

/* MODAL DE EDICIÓN */
.modal-editar {
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%,-50%); margin: 0;
    background: #1e1e2d; border-radius: 16px; padding: 30px;
    width: 90%; max-width: 500px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.1);
    z-index: 1000; color: white;
    animation: modalIn 0.3s ease-out;
}

.modal-editar h2 { color: white; margin-bottom: 16px; }
.modal-editar label { display: block; margin-bottom: 6px; font-weight: 600; color: #c0b3d9; font-size: 0.9rem; }
.modal-editar input, .modal-editar textarea {
    width: 100%; background: #2a2040; color: #e0d0f5;
    border: 1px solid rgba(186,92,255,0.4); border-radius: 8px;
    padding: 10px 14px; font-size: 0.95rem; font-family: inherit;
    outline: none; box-sizing: border-box; resize: vertical;
}
.modal-editar input:focus, .modal-editar textarea:focus {
    border-color: #ba5cff; box-shadow: 0 0 10px rgba(186,92,255,0.2);
}
.modal-editar p { color: white; margin: 0 0 14px 0; }

.modal-acciones { display: flex; gap: 12px; justify-content: flex-end; margin-top: 10px; }
.modal-acciones button {
    padding: 10px 22px; border-radius: 8px; border: none;
    font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.3s ease;
}
.modal-acciones button[type="button"] { background: rgba(255,255,255,0.1); color: white; }
.modal-acciones button[type="button"]:hover { background: rgba(255,255,255,0.2); }
.modal-acciones button[type="submit"] { background: #2b8a3e; color: white; box-shadow: 0 4px 12px rgba(43,138,62,0.3); }
.modal-acciones button[type="submit"]:hover { background: #237032; transform: translateY(-2px); }

@keyframes modalIn {
    from { opacity: 0; transform: translate(-50%,-60%) scale(0.95); }
    to { opacity: 1; transform: translate(-50%,-50%) scale(1); }
}
```

---

## Flujo de Ejecución
1. Crear la base de datos con el SQL de arriba
2. `cd backend && npm install && node index.js`
3. En otra terminal: `npm start`
4. Abrir `http://localhost:4200`

## Comportamiento
| Botón | Acción Visual | Acción en MySQL |
|-------|--------------|-----------------|
| **Terminar** | Tarjeta se vuelve translúcida, botones se deshabilitan | `completada = 1` |
| **Editar** | Abre modal con los 3 campos editables | `UPDATE titulo, resumen, expira` |
| **Borrar** | La tarjeta desaparece inmediatamente | `DELETE FROM tareas WHERE id = ?` |
