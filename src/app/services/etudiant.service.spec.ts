import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EtudiantService } from './etudiant.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { Etudiant, EtudiantCreate, PaginatedResponse } from '../interfaces/etudiant';
import { HttpHeaders } from '@angular/common/http';

fdescribe('EtudiantService', () => {
  let service: EtudiantService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockToken = 'mock-jwt-token';
  const apiUrl = `${environment.apiBaseUrl}/etudiants`;

  const mockEtudiant: Etudiant = {
    id: 1,
    prenom: 'Ali',
    nom: 'Test',
    email: 'ali@test.com',
    matiere: ['Math', 'Physique']
  };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);
    authServiceSpy.getToken.and.returnValue(mockToken);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EtudiantService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(EtudiantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding requests
  });

  // ---------- BASIC CREATION ----------
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---------- getAllEtudiants ----------
  it('should call GET with pagination params', () => {
    const mockResponse: PaginatedResponse<Etudiant> = {
      etudiants: [mockEtudiant],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1,
        itemsPerPage: 6,
        hasNext: false,
        hasPrev: false
      }
    };

    service.getAllEtudiants(1, 6, 'Ali').subscribe((response) => {
      expect(response.etudiants.length).toBe(1);
      expect(response.etudiants[0].prenom).toBe('Ali');
    });

    const req = httpMock.expectOne(
      (request) =>
        request.url === apiUrl &&
        request.params.get('page') === '1' &&
        request.params.get('limit') === '6' &&
        request.params.get('search') === 'Ali'
    );

    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    req.flush(mockResponse);
  });

  // ---------- getEtudiantById ----------
  it('should fetch etudiant by ID', () => {
    service.getEtudiantById(1).subscribe((result) => {
      expect(result).toEqual(mockEtudiant);
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEtudiant);
  });

  // ---------- checkEmailExists ----------
  it('should return true if email exists', () => {
    service.checkEmailExists('ali@test.com').subscribe((exists) => {
      expect(exists).toBeTrue();
    });

    const req = httpMock.expectOne(`${apiUrl}/check-email?email=ali@test.com`);
    expect(req.request.method).toBe('GET');
    req.flush({ exists: true });
  });

  it('should return false if checkEmailExists throws error', () => {
    service.checkEmailExists('ali@test.com').subscribe((exists) => {
      expect(exists).toBeFalse();
    });

    const req = httpMock.expectOne(`${apiUrl}/check-email?email=ali@test.com`);
    req.error(new ProgressEvent('network error'));
  });

  // ---------- createEtudiant ----------
  it('should create a new etudiant', () => {
    const newEtudiant: EtudiantCreate = {
      prenom: 'Sara',
      nom: 'Smith',
      email: 'sara@test.com',
      matiere: ['Science']
    };

    service.createEtudiant(newEtudiant).subscribe((created) => {
      expect(created.nom).toBe('Smith');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newEtudiant);
    req.flush({ id: 2, ...newEtudiant });
  });

  // ---------- addEtudiantWithPhoto ----------
  it('should upload a student with photo', () => {
    const formData = new FormData();
    formData.append('prenom', 'Ali');

    service.addEtudiantWithPhoto(formData).subscribe((response) => {
      expect(response.prenom).toBe('Ali');
    });

    const req = httpMock.expectOne(`${apiUrl}/add-with-photo`);
    expect(req.request.method).toBe('POST');
    req.flush(mockEtudiant);
  });

  it('should handle error when addEtudiantWithPhoto fails', () => {
    const formData = new FormData();
    spyOn(console, 'error');

    service.addEtudiantWithPhoto(formData).subscribe({
      error: (error) => {
        expect(console.error).toHaveBeenCalled();
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/add-with-photo`);
    req.flush('Upload error', { status: 500, statusText: 'Server Error' });
  });

  // ---------- updateEtudiant ----------
  it('should update an etudiant', () => {
    const updatedEtudiant = { nom: 'Updated' };

    service.updateEtudiant(1, updatedEtudiant).subscribe((result) => {
      expect(result.nom).toBe('Updated');
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatedEtudiant);
    req.flush({ ...mockEtudiant, ...updatedEtudiant });
  });

  // ---------- updateEtudiantWithPhoto ----------
  it('should update a student with photo', () => {
    const formData = new FormData();
    service.updateEtudiantWithPhoto(1, formData).subscribe((resp) => {
      expect(resp).toEqual({ success: true });
    });

    const req = httpMock.expectOne(`${apiUrl}/1/update-with-photo`);
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true });
  });

  // ---------- deleteEtudiant ----------
  it('should delete a student', () => {
    service.deleteEtudiant(1).subscribe((resp) => {
      expect(resp).toEqual({ success: true });
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });
});
