import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'aufgaben' },
  { path: 'heute', pathMatch: 'full', redirectTo: 'aufgaben' },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: 'aufgaben',
    loadChildren: () =>
      import('./features/aufgaben/aufgaben.routes').then((m) => m.AUFGABEN_ROUTES),
  },
  {
    path: 'kalender',
    loadChildren: () =>
      import('./features/calendar/calendar.routes').then((m) => m.CALENDAR_ROUTES),
  },
  {
    path: 'projekte',
    loadChildren: () =>
      import('./features/projekte/projekte.routes').then((m) => m.PROJEKTE_ROUTES),
  },
  {
    path: 'einstellungen',
    loadChildren: () =>
      import('./features/einstellungen/einstellungen.routes').then((m) => m.EINSTELLUNGEN_ROUTES),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/ui/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
