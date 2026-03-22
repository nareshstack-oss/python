import { Routes } from '@angular/router';
import { AdminPageComponent } from './pages/admin-page.component';
import { CustomerPageComponent } from './pages/customer-page.component';

export const routes: Routes = [
  { path: '', component: CustomerPageComponent },
  { path: 'admin', component: AdminPageComponent },
  { path: '**', redirectTo: '' }
];
