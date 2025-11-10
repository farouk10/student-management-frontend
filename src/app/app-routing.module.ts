// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EtudiantListComponent } from './components/etudiant-list/etudiant-list.component';
import { EtudiantFormComponent } from './components/etudiant-form/etudiant-form.component';
import { EtudiantConfirmComponent } from './components/etudiant-confirm/etudiant-confirm.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { UserConfirmComponent } from './components/user-confirm/user-confirm.component';
import { ChatComponent } from './components/chat/chat.component';
import { etudiantResolverResolver } from './etudiant-resolver.resolver';
import { LogsComponent } from './components/logs/logs.component';
import { LogsResolver } from './logs.resolver';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  
  // Student routes
  { path: 'etudiants', component: EtudiantListComponent, canActivate: [AuthGuard] },
  { path: 'etudiants/new', component: EtudiantFormComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'etudiants/edit/:id', component: EtudiantFormComponent, canActivate: [AuthGuard, AdminGuard], resolve: {etu:etudiantResolverResolver} },
  { path: 'etudiants/confirm', component: EtudiantConfirmComponent, canActivate: [AuthGuard, AdminGuard]},
  
  // User management routes - FIXED PATH
  { 
    path: 'admin/users', 
    component: UserListComponent, 
    canActivate: [AuthGuard, AdminGuard] 
  },
  { 
    path: 'admin/users/new', 
    component: UserFormComponent, 
    canActivate: [AuthGuard, AdminGuard] 
  },
  { 
    path: 'admin/users/edit/:id', 
    component: UserFormComponent, 
    canActivate: [AuthGuard, AdminGuard] 
  },
  { 
    path: 'admin/users/confirm', 
    component: UserConfirmComponent, 
    canActivate: [AuthGuard, AdminGuard] 
  },

  {
    path: 'admin/logs',
    component: LogsComponent,
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'admin/logs',
    component: LogsComponent,
    canActivate: [AuthGuard, AdminGuard],
    resolve: { logs: LogsResolver } // ✅ add resolver here
  },
  
  
  
  // Profile routes
  { path: 'profile', component: UserProfileComponent, canActivate: [AuthGuard] },
  { path: 'profile/edit', component: ProfileEditComponent, canActivate: [AuthGuard] },
  
  { 
    path: 'chat', 
    component: ChatComponent, 
    canActivate: [AuthGuard] // Both user and admin can access
  },
  // Wildcard route
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }