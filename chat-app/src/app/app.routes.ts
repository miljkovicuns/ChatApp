import { Routes } from '@angular/router';
import {Login} from './pages/login/login';
import {Register} from './pages/register/register';
import {Dashboard} from './pages/dashboard/dashboard';
import {RegistrationReview} from './pages/registration-review/registration-review';

export const routes: Routes = [
  {path: '', component: Login},
  {path: 'register', component: Register},
  {path: 'dashboard', component: Dashboard},
  {path: 'admin/registration-review', component: RegistrationReview}
];
