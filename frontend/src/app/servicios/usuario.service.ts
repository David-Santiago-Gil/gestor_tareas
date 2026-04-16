import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { type Usuarios } from '../components/usuario/usuario.model';

/**
 * RF-07: Reactividad Automatizada con Angular Signals.
 * Servicio centralizado para la gestión de usuarios.
 * Todos los cambios se reflejan globalmente sin recargar la página.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private http = inject(HttpClient);

  /** Signal reactivo con la lista de usuarios desde MySQL */
  private _usuarios = signal<Usuarios[]>([]);

  /** Lista pública de usuarios (solo lectura) */
  readonly usuarios = this._usuarios.asReadonly();

  /** Signal reactivo con la lista de avatares disponibles */
  private _avatares = signal<string[]>([]);
  readonly avatares = this._avatares.asReadonly();

  constructor() {
    if (this.isBrowser) {
      this.cargar();
      this.cargarAvatares();
    }
  }

  /** Obtiene un usuario por ID (computed-like) */
  obtenerPorId(id: number): Usuarios | undefined {
    return this._usuarios().find(u => u.id === id);
  }

  /** RF-01: Carga todos los usuarios desde MySQL */
  async cargar(): Promise<void> {
    try {
      const usuarios = await firstValueFrom(
        this.http.get<Usuarios[]>(`${environment.apiUrl}/api/usuarios`)
      );
      this._usuarios.set(usuarios);
    } catch (e) {
      console.error('Error al cargar usuarios:', e);
    }
  }

  /** RF-05: Carga la lista de avatares disponibles en el servidor */
  async cargarAvatares(): Promise<void> {
    try {
      const avatares = await firstValueFrom(
        this.http.get<string[]>(`${environment.apiUrl}/api/avatares`)
      );
      this._avatares.set(avatares);
    } catch (e) {
      console.error('Error al cargar avatares:', e);
    }
  }

  /** RF-02: Crear un nuevo usuario */
  async crear(nombre: string, avatar: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/api/usuarios`, { nombre, avatar })
      );
      await this.cargar(); // RF-07: reactividad automática
    } catch (e: any) {
      if (e instanceof HttpErrorResponse) {
        throw new Error(e.error?.error ?? 'Error al crear usuario');
      }
      throw e;
    }
  }

  /** RF-02: Actualizar nombre y/o avatar de un usuario */
  async actualizar(id: number, nombre: string, avatar: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(`${environment.apiUrl}/api/usuarios/${id}`, { nombre, avatar })
      );
      await this.cargar(); // RF-07: reactividad automática
    } catch (e: any) {
      if (e instanceof HttpErrorResponse) {
        throw new Error(e.error?.error ?? 'Error al actualizar usuario');
      }
      throw e;
    }
  }

  /** RF-02 + RF-06: Eliminar usuario (cascade elimina sus tareas) */
  async eliminar(id: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/api/usuarios/${id}`)
      );
      await this.cargar(); // RF-07: reactividad automática
    } catch (e: any) {
      if (e instanceof HttpErrorResponse) {
        throw new Error(e.error?.error ?? 'Error al eliminar usuario');
      }
      throw e;
    }
  }
}
