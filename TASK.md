# TASK.md — Gestor de Tareas Administrativo
> Este archivo es leído por el agente de Antigravity para validar y corregir el código del proyecto.
> Por cada tarea, el agente debe: (1) verificar si ya está implementada, (2) corregirla o implementarla si no lo está.

---

## CONTEXTO DEL PROYECTO

- **Frontend:** Angular (con SSR habilitado, desplegado en Vercel)
- **Backend:** Node.js + Express (desplegado en Railway)
- **Base de datos:** MySQL (plugin de Railway)
- **Autenticación:** JWT + bcrypt
- **URL backend producción:** variable de entorno `API_URL`

---

## MÓDULO 1 — ACCESO Y SESIÓN

### TASK-01 · Login de Administrador
**Validar:** Existe un endpoint `POST /login` que recibe `{ username, password }` y devuelve un token JWT.
**Corregir si falla:** Crear el endpoint con validación contra la tabla `administradores`, usando `bcrypt.compare()` y `jwt.sign()`.

### TASK-02 · Protección de rutas con JWT
**Validar:** Todos los endpoints excepto `POST /login` tienen un middleware que verifica el token JWT en el header `Authorization: Bearer <token>`.
**Corregir si falla:** Crear middleware `verificarToken.js` y aplicarlo a todas las rutas protegidas.

### TASK-03 · Auto-Seeding de administrador inicial
**Validar:** Al iniciar el backend, si la tabla `administradores` está vacía, se inserta automáticamente `{ username: 'admin', password: hash('admin123') }`.
**Corregir si falla:** Agregar lógica de seeding en `index.js` usando `bcrypt.hash()` antes de arrancar el servidor.

### TASK-04 · Encriptación de contraseñas
**Validar:** Las contraseñas nunca se guardan en texto plano. Se usa `bcrypt.hash()` al crear/actualizar administradores.
**Corregir si falla:** Envolver todos los `INSERT`/`UPDATE` de contraseñas con `await bcrypt.hash(password, 10)`.

---

## MÓDULO 2 — FRONTEND ANGULAR

### TASK-05 · Variables de entorno por ambiente
**Validar:** `src/environments/environment.prod.ts` tiene `apiUrl` apuntando a la URL de Railway (no a `localhost`). `environment.ts` apunta a `http://localhost:3000`.
**Corregir si falla:**
```ts
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://TU-APP.up.railway.app'
};

// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

### TASK-06 · Interceptor HTTP con JWT
**Validar:** Existe un interceptor Angular que inyecta el token JWT en el header `Authorization` de cada petición saliente.
**Corregir si falla:** Crear `auth.interceptor.ts`:
```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
```
Y registrarlo en `app.config.ts` con `withInterceptors([authInterceptor])`.

### TASK-07 · Servicios desacoplados
**Validar:** Existe `AuthService` con métodos de login/logout y `TareasService` con el CRUD de tareas. Ningún componente hace `HttpClient` directamente.
**Corregir si falla:** Mover toda lógica HTTP a los servicios correspondientes e inyectarlos en los componentes.

### TASK-08 · Modo Lectura vs Modo Admin en la UI
**Validar:** Los botones Agregar, Editar, Completar y Eliminar solo son visibles cuando hay sesión activa. Sin login, la interfaz es solo de lectura.
**Corregir si falla:** Usar `*ngIf="authService.isLoggedIn()"` (o signal equivalente) para condicionar la visibilidad de los botones de acción.

### TASK-09 · Skeletons de carga
**Validar:** Mientras se esperan respuestas del servidor, se muestran placeholders visuales (skeleton screens) en lugar de pantallas en blanco.
**Corregir si falla:** Agregar variable `isLoading = true` antes de cada llamada HTTP y `isLoading = false` en el `subscribe`/`then`. Mostrar el skeleton con `*ngIf="isLoading"`.

---

## MÓDULO 3 — GESTIÓN DE USUARIOS

### TASK-10 · CRUD completo de usuarios
**Validar:** Existen endpoints `GET /usuarios`, `POST /usuarios`, `PUT /usuarios/:id`, `DELETE /usuarios/:id` conectados a la tabla `usuarios` en MySQL.
**Corregir si falla:** Implementar los endpoints faltantes con las queries SQL correspondientes.

### TASK-11 · Integridad referencial de tareas
**Validar:** La tabla `tareas` tiene una FK `usuario_id` que referencia `usuarios.id`. No se pueden crear tareas sin un `usuario_id` válido.
**Corregir si falla:** Agregar la FK en la definición de tabla:
```sql
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
```

### TASK-12 · Eliminación en cascada
**Validar:** Al eliminar un usuario, sus tareas se eliminan automáticamente (por FK con `ON DELETE CASCADE` o por lógica en el endpoint).
**Corregir si falla:** Agregar `ON DELETE CASCADE` en la FK o ejecutar `DELETE FROM tareas WHERE usuario_id = ?` antes de eliminar el usuario.

### TASK-13 · Gestión de avatares
**Validar:** Existe un endpoint `GET /avatares` que devuelve la lista de imágenes disponibles. El endpoint `PUT /usuarios/:id` acepta un campo `avatar`.
**Corregir si falla:** Exponer el directorio de avatares como endpoint y actualizar la query de edición de usuario para incluir el campo `avatar`.

### TASK-14 · Reactividad con Angular Signals
**Validar:** Los cambios en usuarios (crear/editar/eliminar) se reflejan automáticamente en la lista sin recargar la página, usando Signals o `BehaviorSubject`.
**Corregir si falla:** Convertir la lista de usuarios a un `signal<Usuario[]>([])` y actualizarlo después de cada operación CRUD.

---

## MÓDULO 4 — INFRAESTRUCTURA Y SEGURIDAD

### TASK-15 · Variables de entorno en backend (sin hardcoding)
**Validar:** `index.js` no contiene ninguna credencial literal. Todo se lee desde `process.env.*`. Existe `.env.example` con las claves necesarias.
**Corregir si falla:** Reemplazar valores literales por `process.env.VARIABLE` y crear `.env.example`:
```
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=
FRONTEND_URL=
```

### TASK-16 · CORS configurado correctamente
**Validar:** El backend permite requests desde `http://localhost:4200` y desde la URL de producción de Vercel. Permite métodos GET, POST, PUT, DELETE y el header `Authorization`.
**Corregir si falla:**
```js
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:4200'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### TASK-17 · Conexión MySQL sin localhost
**Validar:** La conexión a MySQL usa `process.env.DB_HOST` (nunca `localhost` o `127.0.0.1` hardcodeado). En Railway, `DB_HOST` apunta al host del plugin MySQL.
**Corregir si falla:** Asegurarse de que todas las variables de conexión provienen de `process.env` y están correctamente configuradas en Railway.

---

## INSTRUCCIONES PARA EL AGENTE

1. Leer este archivo completo antes de tocar cualquier archivo del proyecto.
2. Ejecutar cada TASK en orden.
3. Por cada TASK: primero buscar en el código si ya está implementada. Si lo está y es correcta, marcarla como ✅. Si no lo está o está incorrecta, corregirla.
4. No eliminar funcionalidad existente que sí cumpla los requerimientos.
5. Al finalizar, generar un resumen con el estado de cada TASK (✅ cumplida / 🔧 corregida / ❌ no implementada).
