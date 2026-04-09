import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NuevaTareaInfo } from '../tarea/tarea.model';
import { TareaService } from '../../servicios/tarea.service';
import { required } from '@angular/forms/signals';

@Component({
  selector: 'app-nueva-tarea',
  imports: [FormsModule],
  templateUrl: './nueva-tarea.html',
  styleUrl: './nueva-tarea.css',
})
export class NuevaTarea {
  @Input({ required: true }) idUsuario!: string;
  @Output() cerrar = new EventEmitter<void>();

  tituloIngresado = '';
  resumenIngresado = '';
  fechaIngresado = '';

  private tareasService = inject(TareaService);

  alCancelar() {
    this.cerrar.emit();
  }

  async alEnviar() {
    await this.tareasService.agregarTarea({
      titulo: this.tituloIngresado,
      resumen: this.resumenIngresado,
      fecha: this.fechaIngresado
    }, this.idUsuario)
    this.cerrar.emit();
  }
}
