import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EtudiantListComponent } from './components/etudiant-list/etudiant-list.component';
import { EtudiantFormComponent } from './components/etudiant-form/etudiant-form.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component'; // Add this

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { EtudiantConfirmComponent } from './components/etudiant-confirm/etudiant-confirm.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { UserConfirmComponent } from './components/user-confirm/user-confirm.component';
import { ChatComponent } from './components/chat/chat.component';
import { LogInterceptor } from './interceptors/log.interceptor';
import { LogsComponent } from './components/logs/logs.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    EtudiantListComponent,
    EtudiantFormComponent,
    UserProfileComponent,
    ProfileEditComponent,
    EtudiantConfirmComponent,
    UserListComponent,
    UserFormComponent,
    UserConfirmComponent,
    ChatComponent,
    LogsComponent // Add this
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    { provide: HTTP_INTERCEPTORS, useClass: LogInterceptor, multi: true },

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }