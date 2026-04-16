import { Component, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../servicios/usuario.service';
import { TareaService } from '../../servicios/tarea.service';
import { type Usuarios } from '../usuario/usuario.model';

@Component({
  selector: 'app-gestion-usuarios',
  imports: [FormsModule],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.css',
})
export class GestionUsuarios implements OnInit {
  @Output() cerrar = new EventEmitter<void>();

  usuarioService = inject(UsuarioService);
  private tareaService = inject(TareaService);

  // Estado del modal
  cargando = signal(false);
  mensajeExito = signal('');
  mensajeError = signal('');

  // Sub-modal crear/editar
  mostrarFormulario = signal(false);
  modoEdicion = signal(false);
  usuarioEditandoId: number | null = null;

  // Campos del formulario
  nombreIngresado = '';
  avatarSeleccionado = 'usuario-1.png';

  ngOnInit() {
    this.usuarioService.cargar();
    this.usuarioService.cargarAvatares();
  }

  // ==========================================
  // ABRIR FORMULARIO
  // ==========================================
  abrirCrear() {
    this.nombreIngresado = '';
    this.avatarSeleccionado = 'usuario-1.png';
    this.modoEdicion.set(false);
    this.usuarioEditandoId = null;
    this.limpiarMensajes();
    this.mostrarFormulario.set(true);
  }

  abrirEditar(usuario: Usuarios) {
    this.nombreIngresado = usuario.nombre;
    this.avatarSeleccionado = usuario.avatar;
    this.modoEdicion.set(true);
    this.usuarioEditandoId = usuario.id;
    this.limpiarMensajes();
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario() {
    this.mostrarFormulario.set(false);
    this.usuarioEditandoId = null;
  }

  // ==========================================
  // OPERACIONES CRUD
  // ==========================================
  async guardarUsuario() {
    if (!this.nombreIngresado.trim()) {
      this.mensajeError.set('El nombre del usuario es obligatorio.');
      return;
    }

    this.cargando.set(true);
    this.limpiarMensajes();

    try {
      if (this.modoEdicion() && this.usuarioEditandoId !== null) {
        await this.usuarioService.actualizar(
          this.usuarioEditandoId,
          this.nombreIngresado.trim(),
          this.avatarSeleccionado
        );
        this.mensajeExito.set('Usuario actualizado exitosamente.');
      } else {
        await this.usuarioService.crear(
          this.nombreIngresado.trim(),
          this.avatarSeleccionado
        );
        this.mensajeExito.set('Usuario creado exitosamente.');
      }
      this.cerrarFormulario();
    } catch (e: any) {
      this.mensajeError.set(e.message ?? 'Error al guardar usuario.');
    } finally {
      this.cargando.set(false);
    }
  }

  async eliminarUsuario(usuario: Usuarios) {
    this.limpiarMensajes();
    this.cargando.set(true);

    try {
      await this.usuarioService.eliminar(usuario.id);
      // RF-06: Las tareas se eliminan en cascada en la BD
      // Recargamos tareas en el frontend para reflejar el cambio
      await this.tareaService.recargar();
      this.mensajeExito.set(`Usuario "${usuario.nombre}" y sus tareas eliminados.`);
    } catch (e: any) {
      this.mensajeError.set(e.message ?? 'Error al eliminar usuario.');
    } finally {
      this.cargando.set(false);
    }
  }

  // Controla la visibilidad del diálogo de confirmación
  usuarioAEliminar: Usuarios | null = null;
  mostrarConfirmacion = signal(false);

  pedirConfirmacion(usuario: Usuarios) {
    this.usuarioAEliminar = usuario;
    this.mostrarConfirmacion.set(true);
  }

  cancelarEliminacion() {
    this.usuarioAEliminar = null;
    this.mostrarConfirmacion.set(false);
  }

  async confirmarEliminacion() {
    if (this.usuarioAEliminar) {
      await this.eliminarUsuario(this.usuarioAEliminar);
    }
    this.cancelarEliminacion();
  }

  // ==========================================
  // HELPERS
  // ==========================================
  seleccionarAvatar(avatar: string) {
    this.avatarSeleccionado = avatar;
  }

  limpiarMensajes() {
    this.mensajeExito.set('');
    this.mensajeError.set('');
  }

  alCerrar() {
    this.cerrar.emit();
  }
}
