import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  /** El padre (app.ts) escucha este evento para cerrar el modal */
  @Output() cerrar = new EventEmitter<void>();

  private auth = inject(AuthService);

  username = '';
  password = '';
  error = signal('');
  cargando = signal(false);

  async alEnviar() {
    if (!this.username || !this.password) {
      this.error.set('Por favor completa todos los campos.');
      return;
    }
    this.cargando.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.username, this.password);
      // Login exitoso → cerrar el modal
      this.cerrar.emit();
    } catch (e: any) {
      this.error.set(e.message ?? 'Error al iniciar sesión');
    } finally {
      this.cargando.set(false);
    }
  }

  alCancelar() {
    this.cerrar.emit();
  }
}
