import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NuevaTareaInfo } from '../tarea/tarea.model';
import { TareaService } from '../../servicios/tarea.service';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nueva-tarea',
  imports: [FormsModule, CommonModule],
  templateUrl: './nueva-tarea.html',
  styleUrl: './nueva-tarea.css',
})
export class NuevaTarea {
  @Input({ required: true }) idUsuario!: number;
  @Output() cerrar = new EventEmitter<void>();

  tituloIngresado = '';
  resumenIngresado = '';
  fechaIngresado = '';
  fondoIngresado = 'bg_jujutsu.png'; 

  fondosAvanzados = [
    { id: 'bg_jujutsu.png', nombre: 'Jujutsu Kaisen' },
    { id: 'bg_kimetsu.png', nombre: 'Kimetsu no Yaiba' },
    { id: 'bg_solo.png',    nombre: 'Solo Leveling' },
    { id: 'bg_tokyo.png',   nombre: 'Tokyo Ghoul' },
    { id: 'bg_onepunch.png',nombre: 'One Punch Man' },
    { id: 'bg_bleach.png',  nombre: 'Bleach Cyber' },
    { id: 'bg_toji.png',    nombre: 'Toji Zenin' },
    { id: 'bg_retro.png',   nombre: 'Cyberpunk Retro' }
  ];

  private tareasService = inject(TareaService);

  alCancelar() {
    this.cerrar.emit();
  }

  async alEnviar() {
    await this.tareasService.agregarTarea({
      titulo: this.tituloIngresado,
      resumen: this.resumenIngresado,
      fecha: this.fechaIngresado,
      imagenFondo: this.fondoIngresado
    }, this.idUsuario)
    this.cerrar.emit();
  }
}
