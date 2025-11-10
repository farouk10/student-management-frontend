// src/app/components/user-form/user-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { User, RegisterRequest } from '../../interfaces/user';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-user-form',
  standalone: false,
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEditMode = false;
  userId: string | null = null;
  isLoading = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.userId;

    if (this.isEditMode) {
      this.loadUser();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['user', Validators.required],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(6)]]
    });
  }

  loadUser(): void {
    if (!this.userId) return;

    this.isLoading = true;
    this.authService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.userForm.patchValue({
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role
        });
        // Remove password validation in edit mode
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.updateValueAndValidity();
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.show({
          message: 'Erreur lors du chargement de l\'utilisateur',
          type: 'error',
          duration: 5000
        });
        this.isLoading = false;
        this.router.navigate(['/admin/users']);
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    const formData = this.userForm.value;

    if (this.isEditMode && this.userId) {
      // For edit, remove password if empty
      if (!formData.password) {
        delete formData.password;
      }

      this.authService.updateUser(this.userId, formData).subscribe({
        next: () => {
          this.toastService.show({
            message: 'Utilisateur mis à jour avec succès',
            type: 'success',
            duration: 3000
          });
          this.router.navigate(['/admin/users']);
        },
        error: (error) => {
          this.handleError(error, 'mise à jour');
        }
      });
    } else {
      // For create
      const newUser: RegisterRequest = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };

      this.authService.createUser(newUser).subscribe({
        next: () => {
          this.toastService.show({
            message: 'Utilisateur créé avec succès',
            type: 'success',
            duration: 3000
          });
          this.router.navigate(['/admin/users']);
        },
        error: (error) => {
          this.handleError(error, 'création');
        }
      });
    }
  }

  private handleError(error: any, action: string): void {
    console.error(`Error during ${action}:`, error);
    let errorMessage = `Erreur lors de la ${action} de l'utilisateur`;
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 400) {
      errorMessage = 'Données invalides';
    } else if (error.status === 409) {
      errorMessage = 'Un utilisateur avec cet email existe déjà';
    }

    this.toastService.show({
      message: errorMessage,
      type: 'error',
      duration: 5000
    });
    this.isSubmitting = false;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }

  get title(): string {
    return this.isEditMode ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur';
  }

  get submitButtonText(): string {
    return this.isSubmitting ? 'Enregistrement...' : 
           this.isEditMode ? 'Mettre à jour' : 'Créer l\'utilisateur';
  }

  // Form field getters for easy access in template
  get nom() { return this.userForm.get('nom'); }
  get prenom() { return this.userForm.get('prenom'); }
  get email() { return this.userForm.get('email'); }
  get password() { return this.userForm.get('password'); }
  get role() { return this.userForm.get('role'); }
}