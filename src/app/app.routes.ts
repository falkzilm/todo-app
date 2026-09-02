import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'heute' },
  {
    path: 'heute',
    loadChildren: () => import('./features/heute/heute.routes').then((m) => m.HEUTE_ROUTES),
  },
  {
    path: 'kalender',
    loadChildren: () =>
      import('./features/calendar/calendar.routes').then((m) => m.CALENDAR_ROUTES),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/ui/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
