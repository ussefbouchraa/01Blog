// Purpose: Authentication service for the 01Blog Frontend.
// Handles user login, registration, logout, JWT storage in localStorage,
// and provides helpers to check auth state and user role.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  usernameOrEmail?: string;
  username?: string;
  email?: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type?: string;
  username?: string;
  role?: string;
  userId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.apiUrl + '/auth';
  private accessToken = 'auth_token';
  private userData = 'auth_user';

  constructor(private http: HttpClient) {}

  // Register new user
  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  // Login user and save token
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, data).pipe(
      tap((res) => {
        if (res?.token) {
          this.saveToken(res.token);
          if (res.username || res.role || res.userId) {
            const user = {
              username: res.username,
              role: res.role,
              userId: res.userId
            };
            localStorage.setItem(this.userData, JSON.stringify(user));
          }
        }
      })
    );
  }

  // Save JWT token
  saveToken(token: string): void {
    localStorage.setItem(this.accessToken, token);
  }

  // Get JWT token
  getToken(): string | null {
    return localStorage.getItem(this.accessToken);
  }

  // Get logged in user info
  getUser(): any {
    const user = localStorage.getItem(this.userData);
    return user ? JSON.parse(user) : null;
  }

  // Get user role (normalized to ROLE_ prefix, e.g. "ROLE_ADMIN")
  getRole(): string | null {
    const user = this.getUser();
    if (user?.role) {
      return this.normalizeRole(user.role);
    }
    // Try to decode token if role not stored
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = this.decodeToken();
      if (!payload) return null;
      const role = payload.role ?? (Array.isArray(payload.roles) ? payload.roles[0] : payload.roles);
      return this.normalizeRole(role);
    } catch {
      return null;
    }
  }

  // Get logged in username (from stored user info, falling back to JWT subject)
  getUsername(): string {
    const user = this.getUser();
    if (user?.username) {
      return user.username;
    }
    return this.decodeToken()?.sub ?? '';
  }

  private decodeToken(): any | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  // Backend JWT stores plain roles like "ADMIN"; UI and guards expect "ROLE_ADMIN"
  private normalizeRole(role: unknown): string | null {
    if (typeof role !== 'string' || role.length === 0) return null;
    const upper = role.toUpperCase();
    return upper.startsWith('ROLE_') ? upper : `ROLE_${upper}`;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      if (exp && Date.now() >= exp * 1000) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      return !!token;
    }
  }

  // Logout user
  logout(): void {
    localStorage.removeItem(this.accessToken);
    localStorage.removeItem(this.userData);
    //redirect to login page
  }
}
