import { Component, EventEmitter, inject, Output } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-encabezado',
  imports: [],
  templateUrl: './encabezado.html',
  styleUrl: './encabezado.css',
})
export class Encabezado {
  @Output() abrirLogin = new EventEmitter<void>();
  @Output() abrirPerfil = new EventEmitter<void>();
  @Output() irAInicio = new EventEmitter<void>();
  auth = inject(AuthService);
}