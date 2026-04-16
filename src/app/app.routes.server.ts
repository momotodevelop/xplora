import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Server
  },
  {
    path: 'inicio',
    renderMode: RenderMode.Server
  },
  {
    path: 'nosotros',
    renderMode: RenderMode.Server
  },
  {
    path: 'confianza',
    renderMode: RenderMode.Server
  },
  {
    path: 'contacto',
    renderMode: RenderMode.Server
  },
  {
    path: 'ayuda',
    renderMode: RenderMode.Server
  },
  {
    path: 'blog',
    renderMode: RenderMode.Server
  },
  {
    path: 'blog/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
