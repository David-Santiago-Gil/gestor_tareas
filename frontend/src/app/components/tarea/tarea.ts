import { Component, inject, Input } from '@angular/core';
import { tarea } from './tarea.model';
import { Tarjeta } from '../tarjeta/tarjeta';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TareaService } from '../../servicios/tarea.service';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-tarea',
  imports: [Tarjeta, DatePipe, FormsModule, NgClass],
  templateUrl: './tarea.html',
  styleUrl: './tarea.css',
})
export class Tarea {
  @Input({ required: true }) tarea!: tarea;

  private tareasService = inject(TareaService);
  auth = inject(AuthService);

  // Estados
  editando = false;
  tituloEditado = '';
  resumenEditado = '';
  expiraEditado = '';

  alCompletarTarea() {
    if (this.auth.estaAutenticado()) {
      this.tareasService.completarTarea(this.tarea.id);
    }
  }

  async alReabrirTarea() {
    await this.tareasService.reabrirTarea(this.tarea.id);
  }

  alBorrarTarea() {
    if (this.auth.estaAutenticado()) {
      this.tareasService.borrarTarea(this.tarea.id);
    }
  }

  alEditarTarea() {
    if (this.auth.estaAutenticado()) {
      this.tituloEditado = this.tarea.titulo;
      this.resumenEditado = this.tarea.resumen;
      
      // Formatear la fecha para un input type="date" (YYYY-MM-DD)
      if (this.tarea.expira) {
        try {
          const d = new Date(this.tarea.expira);
          this.expiraEditado = isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
        } catch(e) {
          this.expiraEditado = '';
        }
      } else {
        this.expiraEditado = '';
      }
      
      this.editando = true;
    }
  }

  alGuardarEdicion() {
    if (this.auth.estaAutenticado()) {
      this.tareasService.editarTarea(
        this.tarea.id,
        this.tituloEditado,
        this.resumenEditado,
        this.expiraEditado
      );
    }
    this.editando = false;
  }

  alCancelarEdicion() {
    this.editando = false;
  }
}