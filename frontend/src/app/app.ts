import { Component, inject, signal } from '@angular/core';
import { Encabezado } from "./components/encabezado/encabezado";
import { Usuario } from './components/usuario/usuario';
import { Tareas } from './components/tareas/tareas';
import { Login } from './components/login/login';
import { AdminPerfil } from './components/admin-perfil/admin-perfil';
import { GestionUsuarios } from './components/gestion-usuarios/gestion-usuarios';
import { AuthService } from './servicios/auth.service';
import { UsuarioService } from './servicios/usuario.service';

@Component({
  selector: 'app-root',
  imports: [Encabezado, Usuario, Tareas, Login, AdminPerfil, GestionUsuarios],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  auth = inject(AuthService);
  usuarioService = inject(UsuarioService);

  idUsuarioSeleccionado?: number;

  /** Controla si el panel de login está visible */
  mostrarLogin = signal(false);
  /** Controla si el panel de perfil administrativo está visible */
  mostrarPerfil = signal(false);
  /** Controla si el panel de gestión de usuarios está visible */
  mostrarGestionUsuarios = signal(false);

  get usuarioSeleccionado() {
    return this.usuarioService.usuarios().find((usuario) => usuario.id === this.idUsuarioSeleccionado);
  }

  alSeleccionarUsuario(id: number) {
    this.idUsuarioSeleccionado = id;
  }

  ocultarLogin() {
    this.mostrarLogin.set(false);
  }

  ocultarPerfil() {
    this.mostrarPerfil.set(false);
  }

  ocultarGestionUsuarios() {
    this.mostrarGestionUsuarios.set(false);
  }
}
