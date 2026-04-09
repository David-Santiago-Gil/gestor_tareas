import { Component, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, AdminPayload } from '../../servicios/auth.service';

@Component({
  selector: 'app-admin-perfil',
  imports: [FormsModule],
  templateUrl: './admin-perfil.html',
  styleUrl: './admin-perfil.css',
})
export class AdminPerfil implements OnInit {
  @Output() cerrar = new EventEmitter<void>();

  auth = inject(AuthService);

  cargando = signal(false);
  mensajeExito = signal('');
  mensajeError = signal('');

  vistaActual: 'editar' | 'crear' | 'gestionar' = 'editar';

  perfilNuevoUsername = '';
  perfilNuevaPassword = '';
  crearUsername = '';
  crearPassword = '';

  // Variables para la vista Gestionar
  listaAdmins = signal<AdminPayload[]>([]);
  adminEditando: AdminPayload | null = null;
  gestionarUsername = '';
  gestionarPassword = '';

  ngOnInit() {
    this.cargarAdmins();
  }

  async cargarAdmins() {
    try {
      const admins = await this.auth.obtenerAdmins();
      this.listaAdmins.set(admins);
    } catch(e) {
      console.error(e);
    }
  }

  cambiarVista(vista: 'editar' | 'crear' | 'gestionar') {
    this.vistaActual = vista;
    this.mensajeExito.set('');
    this.mensajeError.set('');
    if (vista === 'gestionar') {
      this.adminEditando = null;
      this.cargarAdmins(); // refrescar lista
    }
  }

  async actualizarPerfil() {
    if (!this.perfilNuevoUsername && !this.perfilNuevaPassword) {
      this.mensajeError.set('Proporciona username o password a actualizar.');
      return;
    }
    this.cargando.set(true);
    this.mensajeError.set('');
    this.mensajeExito.set('');

    try {
      await this.auth.actualizarPerfil({
        username: this.perfilNuevoUsername || undefined,
        password: this.perfilNuevaPassword || undefined,
      });
      this.mensajeExito.set('Perfil actualizado con éxito. Si cambiaste username, reinicia sesión.');
      this.perfilNuevoUsername = '';
      this.perfilNuevaPassword = '';
      await this.cargarAdmins();
    } catch (e: any) {
      this.mensajeError.set(e.message ?? 'Error al actualizar perfil');
    } finally {
      this.cargando.set(false);
    }
  }

  async crearAdmin() {
    if (!this.crearUsername || !this.crearPassword) {
      this.mensajeError.set('Proporciona username y password para crear.');
      return;
    }
    this.cargando.set(true);
    this.mensajeError.set('');
    this.mensajeExito.set('');

    try {
      await this.auth.crearAdmin(this.crearUsername, this.crearPassword);
      this.mensajeExito.set('Administrador creado con éxito.');
      this.crearUsername = '';
      this.crearPassword = '';
      this.cambiarVista('gestionar');
    } catch (e: any) {
      this.mensajeError.set(e.message ?? 'Error al crear administrador');
    } finally {
      this.cargando.set(false);
    }
  }

  iniciarEdicion(admin: AdminPayload) {
    this.adminEditando = admin;
    this.gestionarUsername = admin.username;
    this.gestionarPassword = '';
    this.mensajeError.set('');
    this.mensajeExito.set('');
  }

  cancelarEdicion() {
    this.adminEditando = null;
  }

  async guardarEdicionAdmin() {
    if (!this.adminEditando) return;
    if (!this.gestionarUsername && !this.gestionarPassword) {
      this.mensajeError.set('Proporciona un nuevo username o password.');
      return;
    }

    this.cargando.set(true);
    this.mensajeError.set('');
    this.mensajeExito.set('');

    try {
      await this.auth.editarAdmin(this.adminEditando.id, {
        username: this.gestionarUsername || undefined,
        password: this.gestionarPassword || undefined
      });
      this.mensajeExito.set('Administrador actualizado.');
      this.adminEditando = null;
      await this.cargarAdmins();
    } catch (e: any) {
      this.mensajeError.set(e.message ?? 'Error actualizando admin');
    } finally {
      this.cargando.set(false);
    }
  }

  async eliminarAdmin(id: number) {
    if (!confirm('¿Estás seguro de eliminar este administrador?')) return;
    this.cargando.set(true);
    this.mensajeError.set('');
    this.mensajeExito.set('');

    try {
      await this.auth.borrarAdmin(id);
      this.mensajeExito.set('Administrador eliminado exitosamente.');
      await this.cargarAdmins();
    } catch (e: any) {
      this.mensajeError.set(e.message ?? 'Error eliminando admin');
    } finally {
      this.cargando.set(false);
    }
  }

  alCancelar() {
    this.cerrar.emit();
  }
}
