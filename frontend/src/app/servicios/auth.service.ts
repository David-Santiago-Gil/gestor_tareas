import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminPayload {
  id: number;
  username: string;
}

const TOKEN_KEY = 'gestor_jwt';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private http = inject(HttpClient);

  private leerToken(): string | null {
    return this.isBrowser ? localStorage.getItem(TOKEN_KEY) : null;
  }

  private readonly _token = signal<string | null>(this.leerToken());

  /** El token actual (null si no hay sesión) */
  readonly token = this._token.asReadonly();

  /** true si hay sesión activa */
  readonly estaAutenticado = computed(() => !!this._token());

  /** Datos del payload del token (sin verificar firma — solo para UI) */
  readonly adminActual = computed<AdminPayload | null>(() => {
    const t = this._token();
    if (!t) return null;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return { id: payload.id, username: payload.username };
    } catch {
      return null;
    }
  });

  /**
   * Inicia sesión con username y password.
   * Lanza un error si las credenciales son inválidas.
   */
  async login(username: string, password: string): Promise<void> {
    try {
      const resp = await firstValueFrom(
        this.http.post<{ token: string }>(`${environment.apiUrl}/api/auth/login`, { username, password })
      );
      
      const token = resp.token;
      if (this.isBrowser) localStorage.setItem(TOKEN_KEY, token);
      this._token.set(token);
    } catch (e: any) {
      if (e instanceof HttpErrorResponse) {
        throw new Error(e.error?.error ?? 'Credenciales inválidas');
      }
      throw e;
    }
  }

  /** Cierra la sesión limpiando el token */
  logout(): void {
    if (this.isBrowser) localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
  }

  /** Actualiza el perfil del admin autenticado */
  async actualizarPerfil(datos: { username?: string; password?: string }): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(`${environment.apiUrl}/api/auth/admins/perfil`, datos)
      );
    } catch (e: any) {
      if (e instanceof HttpErrorResponse) {
        throw new Error(e.error?.error ?? 'Error al actualizar perfil');
      }
      throw e;
    }
  }

  /** Crea un nuevo administrador (requiere sesión activa) */
  async crearAdmin(username: string, password: string): Promise<{ id: number; username: string }> {
    try {
      const resp = await firstValueFrom(
        this.http.post<{ id: number; username: string }>(`${environment.apiUrl}/api/auth/admins`, { username, password })
      );
      return resp;
    } catch (e: any) {
      if (e instanceof HttpErrorResponse) {
        throw new Error(e.error?.error ?? 'Error al crear admin');
      }
      throw e;
    }
  }

  /** Obtiene la lista de administradores */
  async obtenerAdmins(): Promise<AdminPayload[]> {
    try {
      return await firstValueFrom(
        this.http.get<AdminPayload[]>(`${environment.apiUrl}/api/auth/admins`)
      );
    } catch (e: any) {
      if (e instanceof HttpErrorResponse) {
        throw new Error(e.error?.error ?? 'Error al listar administradores');
      }
      throw e;
    }
  }

  /** Elimina un administrador por ID */
  async borrarAdmin(id: number): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/api/auth/admins/${id}`)
      );
    } catch (e: any) {
      if (e instanceof HttpErrorResponse) {
        throw new Error(e.error?.error ?? 'Error al borrar admin');
      }
      throw e;
    }
  }

  /** Edita los credenciales de otro administrador */
  async editarAdmin(id: number, datos: { username?: string; password?: string }): Promise<void> {
    try {
      await firstValueFrom(
        this.http.put(`${environment.apiUrl}/api/auth/admins/${id}`, datos)
      );
    } catch (e: any) {
      if (e instanceof HttpErrorResponse) {
        throw new Error(e.error?.error ?? 'Error al editar admin');
      }
      throw e;
    }
  }
}

