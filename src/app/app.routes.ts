import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Stream } from './pages/stream/stream';
import { Login } from './pages/login/login';
import { authGuard } from './core/guards/auth.guard';
import { Images } from './pages/images/images';

export const routes: Routes = [
    {
        path: 'login',
        component: Login
    },
    {
        path: '',
        component: Dashboard,
        canActivate: [authGuard]
    },
    {
        path: 'stream',
        component: Stream,
        canActivate: [authGuard]
    },
    {
        path: 'images',
        component: Images,
        canActivate: [authGuard]
    }
];
