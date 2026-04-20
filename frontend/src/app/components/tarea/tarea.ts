import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { tarea } from './tarea.model';
import { Tarjeta } from '../tarjeta/tarjeta';
import { DatePipe, NgClass, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TareaService } from '../../servicios/tarea.service';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-tarea',
  imports: [Tarjeta, DatePipe, FormsModule, NgClass, CommonModule],
  templateUrl: './tarea.html',
  styleUrl: './tarea.css',
})
export class Tarea {
  @Input({ required: true }) tarea!: tarea;
  @Output() solicitarEdicion = new EventEmitter<void>();

  private tareasService = inject(TareaService);
  auth = inject(AuthService);

  // Estados

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
      this.solicitarEdicion.emit();
    }
  }
}