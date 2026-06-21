import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { User, AuthResponse, LoginRequest, SignupRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Load user from localStorage on service initialization
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  /**
   * Get current user value
   */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is logged in
   */
  get isLoggedIn(): boolean {
    return !!this.currentUserSubject.value && !!this.getToken();
  }

  /**
   * Check if user is referrer
   */
  get isReferrer(): boolean {
    return this.currentUserValue?.user_type === 'referrer';
  }

  /**
   * Check if user is candidate
   */
  get isCandidate(): boolean {
    return this.currentUserValue?.user_type === 'candidate';
  }

  /**
   * User signup
   */
  signup(signupData: SignupRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup/`, signupData).pipe(
      tap(response => {
        this.setAuthData(response);
      })
    );
  }

  /**
   * User login
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/`, credentials).pipe(
      tap(response => {
        this.setAuthData(response);
      })
    );
  }

  /**
   * User logout
   */
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Get access token
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<{ access: string }> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<{ access: string }>(`${this.apiUrl}/token/refresh/`, {
      refresh: refreshToken
    }).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access);
      })
    );
  }

  /**
   * Get user profile
   */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile/`);
  }

  /**
   * Update user profile
   */
  updateProfile(userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/profile/`, userData).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      })
    );
  }

  /**
   * Set authentication data in localStorage
   */
  private setAuthData(response: AuthResponse): void {
    localStorage.setItem('currentUser', JSON.stringify(response.user));
    localStorage.setItem('access_token', response.tokens.access);
    localStorage.setItem('refresh_token', response.tokens.refresh);
    this.currentUserSubject.next(response.user);
  }
}
