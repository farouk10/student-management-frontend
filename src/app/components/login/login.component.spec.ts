import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let route: ActivatedRoute;
  let queryParamsSubject: Subject<any>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'isLoggedIn'
    ]);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['show']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    queryParamsSubject = new Subject();
    route = {
      queryParams: queryParamsSubject.asObservable()
    } as any;

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: route }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  // ---------------------------------------------------------
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------
  it('should initialize login form with empty values', () => {
    expect(component.loginForm.value).toEqual({ email: '', password: '' });
  });

  // ---------------------------------------------------------
  it('should show toast message when query param message exists', fakeAsync(() => {
    routerSpy.navigate.and.stub();

    fixture.detectChanges(); // triggers ngOnInit
    queryParamsSubject.next({ message: 'Session expirée' });
    tick();

    expect(toastServiceSpy.show).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Session expirée',
      type: 'warning'
    }));
    expect(routerSpy.navigate).toHaveBeenCalled(); // clears query params
  }));

  // ---------------------------------------------------------
  it('should redirect to dashboard if already logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    fixture.detectChanges();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  // ---------------------------------------------------------
  it('should not submit if form is invalid', () => {
    fixture.detectChanges();

    component.loginForm.setValue({ email: '', password: '' });
    component.onSubmit();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------
  it('should call login and navigate on success', fakeAsync(() => {
    const mockUser = {
      _id: '1',
      nom: 'Test',
      prenom: 'User',
      email: 'test@test.com',
      token: 'abc123',
      role: 'user'
    };
  
    authServiceSpy.login.and.returnValue(of(mockUser));
    authServiceSpy.isLoggedIn.and.returnValue(false);
    
    fixture.detectChanges();
    component.loginForm.setValue({ email: 'test@test.com', password: '123456' });
    component.onSubmit();
    tick();
  
    expect(authServiceSpy.login).toHaveBeenCalledWith({ email: 'test@test.com', password: '123456' });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.isLoading).toBeFalse();
  }));
  
  // ---------------------------------------------------------
  it('should handle login error correctly', fakeAsync(() => {
    const errorResponse = { error: { message: 'Invalid credentials' } };
    authServiceSpy.login.and.returnValue(throwError(() => errorResponse));
    authServiceSpy.isLoggedIn.and.returnValue(false);

    fixture.detectChanges();
    component.loginForm.setValue({ email: 'fail@test.com', password: 'wrongpass' });
    component.onSubmit();
    tick();

    expect(component.errorMessage).toBe('Invalid credentials');
    expect(component.isLoading).toBeFalse();
  }));

  // ---------------------------------------------------------
  it('should show default error message if backend has no message', fakeAsync(() => {
    const errorResponse = { error: {} };
    authServiceSpy.login.and.returnValue(throwError(() => errorResponse));

    fixture.detectChanges();
    component.loginForm.setValue({ email: 'fail@test.com', password: 'wrongpass' });
    component.onSubmit();
    tick();

    expect(component.errorMessage).toBe('Erreur de connexion');
  }));

  // ---------------------------------------------------------
  it('should disable submit button when form invalid or loading', () => {
    fixture.detectChanges();
    component.isLoading = true;
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBeTrue();
  });
});
