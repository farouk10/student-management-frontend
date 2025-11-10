import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EtudiantService } from '../../services/etudiant.service';
import { Etudiant, EtudiantCreate } from '../../interfaces/etudiant';
import { ToastService } from '../../services/toast.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subscription, of } from 'rxjs';

@Component({
  selector: 'app-etudiant-form',
  standalone: false,
  templateUrl: './etudiant-form.component.html',
  styleUrls: ['./etudiant-form.component.scss']
})
export class EtudiantFormComponent implements OnInit {
  @Input() etudiant: Etudiant | null = null;
  @Input() etudiantData: EtudiantCreate | null = null;
  @Input() isEditMode: boolean = false;
  @Output() studentUpdated = new EventEmitter<EtudiantCreate>();
  @Output() cancel = new EventEmitter<void>();

  etudiantForm: FormGroup;
  isLoading = false;
  isCheckingEmail = false;
  errorMessage = '';
  availableMatieres: string[] = [
    'Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Informatique',
    'Histoire', 'Géographie', 'Philosophie', 'Anglais', 'Espagnol',
    'Français', 'Économie', 'Droit', 'Arts', 'Sport'
  ];

  private emailSub?: Subscription;

  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private etudiantService: EtudiantService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) {
    this.etudiantForm = this.createForm();
  }

  ngOnInit(): void {
    // ✅ Récupération via resolver
    const etu = this.route.snapshot.data['etu'];
  
    if (etu) {
      this.etudiant = etu;
      this.isEditMode = true;
      this.populateForm(etu);
    } else if (this.etudiantData) {
      this.populateFormWithData(this.etudiantData);
    }
  }
  
  createForm(): FormGroup {
    return this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      matiere: this.fb.array([])
    });
  }

  setupEmailValidation(): void {
    // Unsubscribe old listener if exists
    if (this.emailSub) {
      this.emailSub.unsubscribe();
    }
  
    const emailControl = this.etudiantForm.get('email');
    if (emailControl) {
      this.emailSub = emailControl.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(email => {
          if (
            !email ||
            !emailControl.valid ||
            (this.isEditMode && email === this.etudiant?.email)
          ) {
            return of(false);
          }
          this.isCheckingEmail = true;
          const excludeId = this.isEditMode && this.etudiant ? this.etudiant.id : undefined;
          return this.etudiantService.checkEmailExists(email, excludeId);
        })
      ).subscribe(emailExists => {
        this.isCheckingEmail = false;
        if (emailExists && emailControl.valid) {
          emailControl.setErrors({ emailExists: true });
        } else {
          // ✅ clear previous error if user reverts to valid state
          if (emailControl.hasError('emailExists')) {
            const errors = { ...emailControl.errors };
            delete errors['emailExists'];
            if (Object.keys(errors).length === 0) {
              emailControl.setErrors(null);
            } else {
              emailControl.setErrors(errors);
            }
          }
        }
      });
    }
  }
  
  populateForm(etudiant: Etudiant): void {
    this.etudiantForm.patchValue({
      nom: etudiant.nom,
      prenom: etudiant.prenom,
      email: etudiant.email
    });

    this.matiereArray.clear();
    etudiant.matiere.forEach(m => this.matiereArray.push(this.fb.control(m)));

    // ✅ Clear any previously selected file when loading existing student
    this.selectedFile = null;
    this.previewUrl = null;
    
    // The template will show etudiant.photo instead

    this.etudiantForm.markAsPristine();
    this.etudiantForm.markAsUntouched();
    this.etudiantForm.updateValueAndValidity();

    // ✅ Reinitialize email validation now that etudiant is loaded
    this.setupEmailValidation();
  }
  
  populateFormWithData(etudiantData: EtudiantCreate): void {
    this.etudiantForm.patchValue({
      nom: etudiantData.nom,
      prenom: etudiantData.prenom,
      email: etudiantData.email
    });

    // Clear existing matieres and add loaded ones
    this.matiereArray.clear();
    etudiantData.matiere.forEach(matiere => {
      this.matiereArray.push(this.fb.control(matiere));
    });
  }

  get matiereArray(): FormArray {
    return this.etudiantForm.get('matiere') as FormArray;
  }

  get formTitle(): string {
    return this.isEditMode ? 'Modifier l\'étudiant' : 'Nouvel étudiant';
  }

  get submitButtonText(): string {
    if (this.etudiantData) {
      return 'Mettre à jour les informations';
    }
    return this.isLoading 
      ? (this.isEditMode ? 'Modification...' : 'Création...')
      : (this.isEditMode ? 'Modifier' : 'Créer');
  }

  loadEtudiant(id: number): void {
    this.isLoading = true;
    this.etudiantService.getEtudiantById(id).subscribe({
      next: (etudiant) => {
        this.etudiant = etudiant;
        this.populateForm(etudiant);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement de l\'étudiant';
        this.isLoading = false;
      }
    });

    this.etudiantForm.updateValueAndValidity({ onlySelf: false, emitEvent: true });
  }

  onMatiereToggle(matiere: string, event: any): void {
    const isChecked = event.target.checked;
    
    if (isChecked) {
      this.matiereArray.push(this.fb.control(matiere));
    } else {
      const index = this.matiereArray.controls.findIndex(control => control.value === matiere);
      if (index >= 0) {
        this.matiereArray.removeAt(index);
      }
    }
  }

  isMatiereSelected(matiere: string): boolean {
    return this.matiereArray.controls.some(control => control.value === matiere);
  }

  async onSubmit(): Promise<void> {
    if (this.etudiantForm.valid) {
      // Final email check before proceeding
      const email = this.etudiantForm.get('email')?.value;
      if (email) {
        this.isLoading = true;
        this.errorMessage = '';

        try {
          const excludeId = this.isEditMode && this.etudiant ? this.etudiant.id : undefined;
          console.log('Checking email for excludeId:', excludeId);
          const emailExists = await this.etudiantService.checkEmailExists(email, excludeId).toPromise();
                    
          if (emailExists) {
            this.errorMessage = 'Un étudiant avec cet email existe déjà.';
            this.isLoading = false;
            return;
          }

          // If email is unique, proceed with the flow
          this.proceedWithSubmission();
        } catch (error) {
          this.handleError(error);
        }
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private proceedWithSubmission(): void {
    const etudiantData: EtudiantCreate = this.etudiantForm.value;
  
    console.log('🚀 proceedWithSubmission called');
    console.log('📋 isEditMode:', this.isEditMode);
    console.log('📋 etudiant?.id:', this.etudiant?.id);
    console.log('📋 selectedFile:', this.selectedFile);
  
    // ✅ CASE 1: EDIT MODE
    if (this.isEditMode && this.etudiant?.id) {
      // If user selected a new photo → send FormData to update-with-photo endpoint
      if (this.selectedFile) {
        console.log('📤 Updating student WITH photo');
        
        const formData = new FormData();
        formData.append('nom', etudiantData.nom);
        formData.append('prenom', etudiantData.prenom);
        formData.append('email', etudiantData.email);
        formData.append('matiere', JSON.stringify(etudiantData.matiere));
        formData.append('photo', this.selectedFile, this.selectedFile.name);
  
        // Log FormData contents
        console.log('📦 FormData contents:');
        formData.forEach((value, key) => {
          console.log(`  ${key}:`, value);
        });
  
        this.isLoading = true;
        this.etudiantService.updateEtudiantWithPhoto(this.etudiant.id, formData).subscribe({
          next: (res) => {
            console.log('✅ Update with photo response:', res);
            this.isLoading = false;
            this.toastService.show({
              message: 'Étudiant mis à jour avec succès avec nouvelle photo!',
              type: 'success',
              duration: 3000
            });
            const updatedStudent = res;
            this.studentUpdated.emit(updatedStudent);
            this.router.navigate(['/etudiants']);
          },
          error: (err) => {
            console.error('❌ Error updating with photo:', err);
            this.handleError(err);
          }
        });
        return; // ✅ Stop here
      }
  
      // Otherwise (no new photo), use standard JSON update
      console.log('📤 Updating student WITHOUT photo change');
      this.etudiantService.updateEtudiant(this.etudiant.id, etudiantData).subscribe({
        next: (updatedEtudiant) => {
          this.isLoading = false;
          this.toastService.show({
            message: 'Étudiant modifié avec succès!',
            type: 'success',
            duration: 3000
          });
          this.studentUpdated.emit(updatedEtudiant);
          this.router.navigate(['/etudiants']);
        },
        error: (error) => this.handleError(error)
      });
      return;
    }
  
    // ✅ CASE 2: CREATE MODE with photo
    if (this.selectedFile) {
      console.log('📤 Creating student WITH photo');
      
      const formData = new FormData();
      formData.append('nom', etudiantData.nom);
      formData.append('prenom', etudiantData.prenom);
      formData.append('email', etudiantData.email);
      formData.append('matiere', JSON.stringify(etudiantData.matiere));
      formData.append('photo', this.selectedFile, this.selectedFile.name);
  
      this.isLoading = true;
      this.etudiantService.addEtudiantWithPhoto(formData).subscribe({
        next: (res) => {
          console.log('✅ Create with photo response:', res);
          this.isLoading = false;
          this.toastService.show({
            message: 'Étudiant ajouté avec succès avec photo!',
            type: 'success',
            duration: 3000
          });
          this.router.navigate(['/etudiants']);
        },
        error: (err) => {
          console.error('❌ Error creating with photo:', err);
          this.handleError(err);
        }
      });
      return;
    }
  
    // ✅ CASE 3: CREATE MODE without photo (confirmation page flow)
    console.log('📤 Creating student WITHOUT photo (confirmation flow)');
    if (this.etudiantData) {
      this.isLoading = false;
      this.studentUpdated.emit(etudiantData);
    } else {
      this.router.navigate(['/etudiants/confirm'], {
        state: { etudiantData: { ...etudiantData, id: this.etudiant?.id } }
      }).then(() => {
        this.isLoading = false;
      }).catch(error => {
        this.isLoading = false;
        this.errorMessage = 'Erreur de navigation';
      });
    }
  }
    
  private handleError(error: any): void {
    this.isLoading = false;
    if (error.error?.message) {
      this.errorMessage = error.error.message;
    } else {
      this.errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.etudiantForm.controls).forEach(key => {
      const control = this.etudiantForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    // If used as child component, emit cancel event
    if (this.cancel.observers.length > 0) {
      this.cancel.emit();
    } else {
      // Otherwise use default navigation
      this.router.navigate(['/etudiants']);
    }
  }

  // Form field validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.etudiantForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.etudiantForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Ce champ est requis';
      }
      if (field.errors['email']) {
        return 'Format d\'email invalide';
      }
      if (field.errors['minlength']) {
        return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      }
      if (field.errors['emailExists']) {
        return 'Un étudiant avec cet email existe déjà';
      }
    }
    return '';
  }

  // Helper to show email checking status
  isEmailChecking(): boolean {
    return this.isCheckingEmail && (this.etudiantForm.get('email')?.valid ?? false);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    console.log('📸 File selected:', file);
    
    if (file) {
      this.selectedFile = file;
      console.log('✅ selectedFile set to:', this.selectedFile ? this.selectedFile.name : 'No file selected');
    
      // Show preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
        console.log('🖼️ Preview URL set');
      };
      reader.readAsDataURL(file);
    } else {
      console.warn('⚠️ No file selected');
    }
  }

  // Allow user to cancel photo selection
  clearSelectedFile(fileInput: HTMLInputElement): void {
    this.selectedFile = null;
    this.previewUrl = null;
    fileInput.value = ''; // Clear the file input
    console.log('🗑️ Selected file cleared');
  }
}