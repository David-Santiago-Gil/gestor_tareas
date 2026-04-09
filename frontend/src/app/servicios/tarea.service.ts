import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NuevaTareaInfo, tarea } from '../components/tarea/tarea.model';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TareaService {
  private tareas: tarea[] = [];
  private http = inject(HttpClient);

  constructor() {
    this.cargarTareasDesdeBackend();
  }

  private async cargarTareasDesdeBackend() {
    try {
      const response = await firstValueFrom(
        this.http.get<tarea[]>('http://localhost:3000/tareas')
      );
      this.tareas = response;
    } catch (e) {
      console.error('Error al conectar con el backend.', e);
    }
  }

  obtenerTareasDeUsuario(idUsuario: string) {
    return this.tareas.filter((t) => t.idUsuario === idUsuario);
  }

  async agregarTarea(info: NuevaTareaInfo, idUsuario: string) {
    const nueva: tarea = {
      id: new Date().getTime().toString(),
      titulo: info.titulo,
      resumen: info.resumen,
      expira: info.fecha,
      idUsuario,
      completada: 0,
    };
    try {
      await firstValueFrom(
        this.http.post('http://localhost:3000/tareas', nueva)
      );
      await this.cargarTareasDesdeBackend();
    } catch (e) {
      console.error('Error guardando', e);
    }
  }

  async completarTarea(id: string) {
    try {
      await firstValueFrom(
        this.http.put(`http://localhost:3000/tareas/${id}`, {})
      );
      await this.cargarTareasDesdeBackend();
    } catch (e) {
      console.error('Error completando', e);
    }
  }

  async borrarTarea(id: string) {
    try {
      await firstValueFrom(
        this.http.delete(`http://localhost:3000/tareas/${id}`)
      );
      await this.cargarTareasDesdeBackend();
    } catch (e) {
      console.error('Error borrando', e);
    }
  }

  async editarTarea(id: string, titulo: string, resumen: string, expira: string) {
    try {
      await firstValueFrom(
        this.http.put(`http://localhost:3000/tareas/${id}/editar`, { titulo, resumen, expira })
      );
      await this.cargarTareasDesdeBackend();
    } catch (e) {
      console.error('Error editando', e);
    }
  }

  /** Recarga las tareas desde el servidor (útil post-login) */
  async recargar() {
    await this.cargarTareasDesdeBackend();
  }
}