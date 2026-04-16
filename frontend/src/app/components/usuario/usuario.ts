import { Component, EventEmitter, Input, Output } from '@angular/core';
import { type Usuarios } from './usuario.model';
import { Tarjeta } from "../tarjeta/tarjeta";

@Component({
  selector: 'app-usuario',
  imports: [Tarjeta],
  templateUrl: './usuario.html',
  styleUrl: './usuario.css',
})
export class Usuario {

  @Input({ required: true }) usuario!: Usuarios;
  @Input({ required: true }) seleccionado!: boolean;
  @Output() seleccion = new EventEmitter<number>();


  get rutaImagen() {
    return 'img/' + this.usuario.avatar;
  }

  alSeleccionarUsuario() {
    this.seleccion.emit(this.usuario.id);
  }
}