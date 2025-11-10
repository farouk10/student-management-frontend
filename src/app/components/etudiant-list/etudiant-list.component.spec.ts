import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { EtudiantListComponent } from './etudiant-list.component';
import { EtudiantService } from '../../services/etudiant.service';
import { AuthService } from '../../services/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('EtudiantListComponent', () => {
  let component: EtudiantListComponent;
  let fixture: ComponentFixture<EtudiantListComponent>;
  let etudiantServiceSpy: jasmine.SpyObj<EtudiantService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockEtudiants = [
    { id: 1, prenom: 'Ali', nom: 'Test', email: 'ali@test.com', matiere: ['Math', 'Physique'] },
    { id: 2, prenom: 'Sara', nom: 'Smith', email: 'sara@test.com', matiere: [] }
  ];

  const mockPaginatedResponse = {
    etudiants: mockEtudiants,
    pagination: {
      currentPage: 1,
      totalPages: 3,
      totalItems: 2,
      itemsPerPage: 6,
      hasNext: true,
      hasPrev: false
    }
      };

  beforeEach(async () => {
    etudiantServiceSpy = jasmine.createSpyObj('EtudiantService', [
      'getAllEtudiants',
      'deleteEtudiant'
    ]);

    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAdmin', 'getToken']);
    authServiceSpy.isAdmin.and.returnValue(true);
    etudiantServiceSpy.getAllEtudiants.and.returnValue(of(mockPaginatedResponse));

    await TestBed.configureTestingModule({
      declarations: [EtudiantListComponent],
      imports: [
        FormsModule,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: EtudiantService, useValue: etudiantServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA] // Ignore child Angular components
    }).compileComponents();

    fixture = TestBed.createComponent(EtudiantListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load students on init', () => {
    fixture.detectChanges();
    expect(etudiantServiceSpy.getAllEtudiants).toHaveBeenCalled();
    expect(component.etudiants.length).toBe(2);
  });

  it('should call search with debounce', fakeAsync(() => {
    fixture.detectChanges();
    component.searchTerm = 'Ali';
    component.onSearchInput();
    tick(300); // debounce delay
    expect(etudiantServiceSpy.getAllEtudiants).toHaveBeenCalledTimes(2);
  }));

  it('should show loading spinner when loading', fakeAsync(() => {
    spyOn(component, 'loadEtudiants'); // 👈 Prevent auto-loading logic from hiding spinner
  
    component.isLoading = true;
    fixture.detectChanges();
    tick();
  
    const spinner = fixture.nativeElement.querySelector('.spinner-border');
    expect(spinner).toBeTruthy();
  }));
      
  it('should show error message on load error', () => {
    spyOn(console, 'error'); // 👈 Prevent error log in test output
    
    etudiantServiceSpy.getAllEtudiants.and.returnValue(
      throwError(() => new Error('Failed'))
    );
  
    fixture.detectChanges();
    expect(component.errorMessage).toBe('Erreur lors du chargement des étudiants');
  });
  
  it('should paginate to next page if hasNext = true', fakeAsync(() => {
    mockPaginatedResponse.pagination.hasNext = true;
    mockPaginatedResponse.pagination.currentPage = 2; // simulate server change
  
    etudiantServiceSpy.getAllEtudiants.and.returnValue(of(mockPaginatedResponse));
  
    component.nextPage();
    tick(300); 
    fixture.detectChanges();
  
    expect(component.currentPage).toBe(2);
  }));
  
  it('should not go to previous page when hasPrev = false', fakeAsync(() => {
    fixture.detectChanges();
    tick(300); // 👈 Wait async subscription to complete
    
    const previousPage = component.currentPage;
    component.prevPage();
    
    expect(component.currentPage).toBe(previousPage);
  }));
  
  it('should select a student if admin', () => {
    fixture.detectChanges();
    component.selectStudent(mockEtudiants[0]);
    expect(component.selectedStudent?.id).toBe(1);
  });

  it('should navigate to edit page', () => {
    const router = TestBed.inject(RouterTestingModule);
    spyOn(component['router'], 'navigate');
    fixture.detectChanges();

    component.editEtudiant(mockEtudiants[0]);
    expect(component['router'].navigate)
      .toHaveBeenCalledWith(['/etudiants/edit', 1]);
  });

  it('should delete student when confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    etudiantServiceSpy.deleteEtudiant.and.returnValue(of(true));

    fixture.detectChanges();
    component.deleteEtudiant(mockEtudiants[0]);

    expect(etudiantServiceSpy.deleteEtudiant).toHaveBeenCalledWith(1);
  });

  it('should not delete student when cancel confirm', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    fixture.detectChanges();

    component.deleteEtudiant(mockEtudiants[0]);
    expect(etudiantServiceSpy.deleteEtudiant).not.toHaveBeenCalled();
  });

  it('should toggle matieres display', () => {
    fixture.detectChanges();
    const event = new Event('click');
    spyOn(event, 'stopPropagation');

    component.toggleMatieres(mockEtudiants[0], event);
    expect(component.isMatieresExpanded(mockEtudiants[0])).toBeTrue();
    expect(event.stopPropagation).toHaveBeenCalled();
  });
});
