import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NuevaTareaInfo, tarea } from '../components/tarea/tarea.model';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TareaService {
  private tareasSignal = signal<tarea[]>([]);
  private http = inject(HttpClient);

  constructor() {
    this.cargarTareasDesdeBackend();
  }

  private async cargarTareasDesdeBackend() {
    try {
      const response = await firstValueFrom(
        this.http.get<tarea[]>(`${environment.apiUrl}/tareas?_t=${new Date().getTime()}`)
      );
      this.tareasSignal.set(response);
    } catch (e) {
      console.error('Error al conectar con el backend.', e);
    }
  }

  obtenerTareasDeUsuario(idUsuario: number) {
    // Convierte a Number ambos por si desde el backend llega como string
    return this.tareasSignal().filter((t) => Number(t.idUsuario) === Number(idUsuario));
  }

  async agregarTarea(info: NuevaTareaInfo, idUsuario: number) {
    const nueva: tarea = {
      id: new Date().getTime().toString(),
      titulo: info.titulo,
      resumen: info.resumen,
      expira: info.fecha,
      idUsuario,
      completada: 0,
      imagenFondo: info.imagenFondo,
    };
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/tareas`, nueva)
      );
      await this.cargarTareasDesdeBackend();
    } catch (e) {
      console.error('Error guardando', e);
    }
  }

  async completarTarea(id: string) {
    try {
      await firstValueFrom(
        this.http.put(`${environment.apiUrl}/tareas/${id}`, {})
      );
      await this.cargarTareasDesdeBackend();
    } catch (e) {
      console.error('Error completando', e);
    }
  }

  async reabrirTarea(id: string) {
    try {
      await firstValueFrom(
        this.http.put(`${environment.apiUrl}/tareas/${id}/reabrir`, {})
      );
      await this.cargarTareasDesdeBackend();
    } catch (e) {
      console.error('Error reabriendo', e);
    }
  }

  async borrarTarea(id: string) {
    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/tareas/${id}`)
      );
      await this.cargarTareasDesdeBackend();
    } catch (e) {
      console.error('Error borrando', e);
    }
  }

  async editarTarea(id: string, titulo: string, resumen: string, expira: string, imagenFondo?: string) {
    try {
      const data: any = { titulo, resumen, expira };
      if (imagenFondo) data.imagenFondo = imagenFondo;

      await firstValueFrom(
        this.http.put(`${environment.apiUrl}/tareas/${id}/editar`, data)
      );
      await this.cargarTareasDesdeBackend();
    } catch (e) {
      console.error('Error editando', e);
    }
  }

  /** Recarga las tareas desde el servidor (útil post-login o post-eliminación de usuario) */
  async recargar() {
    await this.cargarTareasDesdeBackend();
  }
}