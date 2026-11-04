// Purpose: Authentication service for the 01Blog frontend.
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

  // Get user role
  getRole(): string | null {
    const user = this.getUser();
    if (user?.role) {
      return user.role;
    }
    // Try to decode token if role not stored
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || payload.roles || null;
    } catch {
      return null;
    }
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
