import { Component, EventEmitter, inject, Output } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';

import { LogoAnimadoComponent } from '../logo-animado/logo-animado';

@Component({
  selector: 'app-encabezado',
  imports: [LogoAnimadoComponent],
  templateUrl: './encabezado.html',
  styleUrl: './encabezado.css',
})
export class Encabezado {
  @Output() abrirLogin = new EventEmitter<void>();
  @Output() abrirPerfil = new EventEmitter<void>();
  @Output() abrirGestionUsuarios = new EventEmitter<void>();
  @Output() irAInicio = new EventEmitter<void>();
  auth = inject(AuthService);
}