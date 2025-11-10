import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { EtudiantFormComponent } from './etudiant-form.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { EtudiantService } from '../../services/etudiant.service';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('EtudiantFormComponent', () => {
  let component: EtudiantFormComponent;
  let fixture: ComponentFixture<EtudiantFormComponent>;
  let mockEtudiantService: any;
  let mockRouter: any;
  let mockToastService: any;

  beforeEach(async () => {
    mockEtudiantService = {
      checkEmailExists: jasmine.createSpy('checkEmailExists').and.returnValue(of(false)),
      addEtudiantWithPhoto: jasmine.createSpy('addEtudiantWithPhoto').and.returnValue(of({})),
      updateEtudiant: jasmine.createSpy('updateEtudiant').and.returnValue(of({ id: 1 })),
      updateEtudiantWithPhoto: jasmine.createSpy('updateEtudiantWithPhoto').and.returnValue(of({ student: { id: 1 } })),
      getEtudiantById: jasmine.createSpy('getEtudiantById').and.returnValue(of({
        id: 1,
        nom: 'John',
        prenom: 'Doe',
        email: 'john@example.com',
        matiere: ['Mathématiques']
      }))
    };

    mockRouter = { navigate: jasmine.createSpy('navigate') };
    mockToastService = { show: jasmine.createSpy('show') };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [EtudiantFormComponent],
      providers: [
        FormBuilder,
        { provide: EtudiantService, useValue: mockEtudiantService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EtudiantFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the form', () => {
    expect(component).toBeTruthy();
    expect(component.etudiantForm).toBeDefined();
  });

  it('should populate form with EtudiantData', () => {
    const etuData = { nom: 'Alice', prenom: 'Smith', email: 'alice@example.com', matiere: ['Physique'] };
    component.populateFormWithData(etuData);
    expect(component.etudiantForm.value.nom).toBe('Alice');
    expect(component.matiereArray.length).toBe(1);
    expect(component.matiereArray.at(0).value).toBe('Physique');
  });

  it('should toggle matiere selection', () => {
    component.onMatiereToggle('Mathématiques', { target: { checked: true } });
    expect(component.matiereArray.value).toContain('Mathématiques');

    component.onMatiereToggle('Mathématiques', { target: { checked: false } });
    expect(component.matiereArray.value).not.toContain('Mathématiques');
  });

  it('should set selected file and preview URL', fakeAsync(() => {
    const mockFile = new File(['dummy'], 'photo.png', { type: 'image/png' });

    const mockReader: {
      result: string | ArrayBuffer | null;
      onload: ((e: any) => void) | null;
      readAsDataURL: (file: File) => void;
    } = {
      result: null,
      onload: null,
      readAsDataURL: () => {}
    };

    mockReader.readAsDataURL = function(file: File) {
      this.result = 'data:image/png;base64,test';
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    };

    spyOn(window as any, 'FileReader').and.returnValue(mockReader);

    const event = { target: { files: [mockFile] } };
    component.onFileSelected(event);

    tick();

    expect(component.selectedFile).toBe(mockFile);
    expect(component.previewUrl).toBe('data:image/png;base64,test');
  }));

  it('should call checkEmailExists and navigate when creating new student', fakeAsync(() => {
    const etuData = { nom: 'Bob', prenom: 'Marley', email: 'bob@example.com', matiere: ['Chimie'] };
    component.etudiantForm.patchValue(etuData);

    component.onSubmit();
    tick();

    expect(mockEtudiantService.checkEmailExists).toHaveBeenCalledWith('bob@example.com', undefined);
  }));

  it('should update existing student without photo', fakeAsync(() => {
    component.isEditMode = true;
    component.etudiant = { id: 1, nom: 'John', prenom: 'Doe', email: 'john@example.com', matiere: ['Mathématiques'] };
    component.etudiantForm.patchValue({ nom: 'John Updated', prenom: 'Doe', email: 'john@example.com', matiere: ['Mathématiques'] });

    component.onSubmit();
    tick();

    expect(mockEtudiantService.updateEtudiant).toHaveBeenCalled();
    expect(mockToastService.show).toHaveBeenCalled();
  }));

  it('should handle cancel event', () => {
    component.onCancel();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/etudiants']);
  });
});
