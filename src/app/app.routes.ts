import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Stream } from './pages/stream/stream';
import { Login } from './pages/login/login';
import { Images } from './pages/images/images';
import { MainLayout } from './layouts/main-layout/main-layout';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { UnprocessedImages } from './pages/unprocessed-images/unprocessed-images';
import { Datasets } from './pages/dataset/dataset';
import { DatasetDetail } from './pages/dataset-detail/dataset-detail';

export const routes: Routes = [
  // Sin navbar
  { path: 'login', component: Login },

  // Con navbar (authGuard protege a todos los hijos)
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      // Cualquier usuario con sesión
      { path: '', component: Dashboard },

      // Solo algunos roles (ajusta a los tuyos)
      {
        path: 'stream',
        component: Stream,
        canActivate: [roleGuard('ADMIN', 'MANAGER')]
      },
      {
        path: 'images',
        component: Images,
        canActivate: [roleGuard('ADMIN')]
      },
      {
        path: 'unprocessed-images',
        component: UnprocessedImages,
        canActivate: [roleGuard('ADMIN')]
      },
      {
        path: 'datasets',
        component: Datasets,
        canActivate: [roleGuard('ADMIN')]
      },
      {
        path: 'datasets/:id',
        component: DatasetDetail,
        canActivate: [roleGuard('ADMIN')]
      },

      // Página de "sin permiso" (dentro del layout, solo requiere sesión)
      /*{
        path: 'forbidden',
        loadComponent: () =>
          import('./pages/forbidden/forbidden').then(m => m.Forbidden)
      }*/
    ]
  },

  { path: '**', redirectTo: '' }
];