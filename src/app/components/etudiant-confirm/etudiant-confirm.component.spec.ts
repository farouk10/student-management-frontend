// src/app/components/etudiant-confirm/etudiant-confirm.component.spec.tsimport { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { EtudiantService } from '../../services/etudiant.service';
import { EtudiantConfirmComponent } from './etudiant-confirm.component';
import { EtudiantCreate } from '../../interfaces/etudiant';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('EtudiantConfirmComponent', () => {
  let component: EtudiantConfirmComponent;
  let fixture: ComponentFixture<EtudiantConfirmComponent>;
  let router: Router;
  let etudiantService: EtudiantService;  const mockRouter = {
    navigate: jasmine.createSpy('navigate'),
    getCurrentNavigation: jasmine.createSpy('getCurrentNavigation').and.returnValue({
      extras: { state: { etudiantData: { nom: 'Doe', prenom: 'John', email: 'john.doe@example.com', matiere: [] } } }
    })
  };  const mockActivatedRoute = {
    snapshot: { params: {} }
  };  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [EtudiantConfirmComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        EtudiantService
      ]
    }).compileComponents();
  });  beforeEach(() => {
    fixture = TestBed.createComponent(EtudiantConfirmComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    etudiantService = TestBed.inject(EtudiantService);
    fixture.detectChanges();
  });  it('should create', () => {
    expect(component).toBeTruthy();
  });  
  
  it('should load student data from navigation state on init', () => {
    component.ngOnInit();
    expect(component.etudiantData).toEqual(jasmine.objectContaining({
      nom: 'Doe',
      prenom: 'John'
    }));
  });  

  it('should call confirmAndAdd and navigate to /etudiants on success', () => {
    const mockResponse = of({ id: 1, nom: 'Doe', prenom: 'John', email: 'john.doe@example.com', matiere: [] });
    spyOn(etudiantService, 'createEtudiant').and.returnValue(mockResponse);
    component.confirmAndAdd();
    expect(etudiantService.createEtudiant).toHaveBeenCalledWith(component.etudiantData as EtudiantCreate);
    expect(router.navigate).toHaveBeenCalledWith(['/etudiants'], {
      queryParams: { message: 'Étudiant ajouté avec succès' }
    });
  });
  
  it('should show an error message if creating student fails', () => {
    const mockError = 'Erreur lors de l\'ajout de l\'étudiant';
    spyOn(etudiantService, 'createEtudiant').and.returnValue(throwError(mockError));
    component.confirmAndAdd();
    expect(component.errorMessage).toBe(mockError);
  });
    // Add more tests for other methods like startEditing, cancelEditing, etc
});

