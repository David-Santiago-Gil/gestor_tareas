import { Component, Input, inject, OnInit, signal } from '@angular/core';
import { Tarea } from "../tarea/tarea";
import { NuevaTarea } from "../nueva-tarea/nueva-tarea";
import { TareaService } from '../../servicios/tarea.service';
import { AuthService } from '../../servicios/auth.service';

@Component({
  selector: 'app-tareas',
  imports: [Tarea, NuevaTarea],
  templateUrl: './tareas.html',
  styleUrl: './tareas.css',
})
export class Tareas implements OnInit {
  @Input({ required: true }) nombre!: string;
  @Input({ required: true }) idUsuario!: string;
  estaAgregandoTareaNueva = false;

  auth = inject(AuthService);
  cargando = signal(true);

  constructor(private tareasService: TareaService) { }

  async ngOnInit() {
    // Si queremos mostrar el skeleton siempre que se renderiza el componente:
    this.cargando.set(true);
    // Esperamos a que estén cargadas, en caso de estar cargando
    // En el servicio TareaService la Promise está en el constructor.
    // Vamos a simular el skeleton o esperar que get tareas no devuelva vacio temporalmente.
    setTimeout(() => {
      this.cargando.set(false);
    }, 800); // Demo de carga
  }

  get tareasUsuarioSeleccionado() {
    return this.tareasService.obtenerTareasDeUsuario(this.idUsuario)
  }

  alIniciarNuevaTarea() {
    this.estaAgregandoTareaNueva = true;
  }

  alCerrarTareaNueva() {
    this.estaAgregandoTareaNueva = false;
  }
}
