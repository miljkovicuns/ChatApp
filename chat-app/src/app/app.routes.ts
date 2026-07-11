import { Routes } from '@angular/router';
import {Login} from './pages/login/login';
import {Register} from './pages/register/register';
import {Dashboard} from './pages/dashboard/dashboard';
import {RegistrationReview} from './pages/registration-review/registration-review';
import {SavedMessagesComponent} from './pages/saved-messages-component/saved-messages-component';
import {UserManagement} from './pages/user-management/user-management';
import {AdminAnalytics} from './pages/admin-analytics/admin-analytics';

export const routes: Routes = [
  {path: '', component: Login},
  {path: 'register', component: Register},
  {path: 'dashboard', component: Dashboard},
  {path: 'admin/registration-review', component: RegistrationReview},
  { path: 'saved-messages', component: SavedMessagesComponent },
  { path: 'admin/user-management', component: UserManagement },
  { path: 'admin/analytics', component: AdminAnalytics }
];
