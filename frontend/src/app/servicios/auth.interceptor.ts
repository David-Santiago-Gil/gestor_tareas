import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const TOKEN_KEY = 'gestor_jwt';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  // Intentamos obtener el token directamente de localStorage porque AuthService
  // depende de esto, o podemos leerlo de AuthService si lo inyectamos aquí.
  // Es más limpio inyectarlo si evitamos ciclos.
  const token = isBrowser ? localStorage.getItem(TOKEN_KEY) : null;

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};
