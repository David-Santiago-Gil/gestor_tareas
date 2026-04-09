import { Component, inject, signal } from '@angular/core';
import { Encabezado } from "./components/encabezado/encabezado";
import { Usuario } from './components/usuario/usuario';
import { USUARIOS_FALSOS } from './usuarios-falsos';
import { Tareas } from './components/tareas/tareas';
import { Login } from './components/login/login';
import { AdminPerfil } from './components/admin-perfil/admin-perfil';
import { AuthService } from './servicios/auth.service';

@Component({
  selector: 'app-root',
  imports: [Encabezado, Usuario, Tareas, Login, AdminPerfil],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  auth = inject(AuthService);
  usuarios = USUARIOS_FALSOS;
  idUsuarioSeleccionado?: string;

  /** Controla si el panel de login está visible */
  mostrarLogin = signal(false);
  /** Controla si el panel de perfil administrativo está visible */
  mostrarPerfil = signal(false);

  get usuarioSeleccionado() {
    return this.usuarios.find((usuario) => usuario.id === this.idUsuarioSeleccionado);
  }

  alSeleccionarUsuario(id: string) {
    this.idUsuarioSeleccionado = id;
  }

  ocultarLogin() {
    this.mostrarLogin.set(false);
  }

  ocultarPerfil() {
    this.mostrarPerfil.set(false);
  }
}
