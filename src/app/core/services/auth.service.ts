import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface Student {
  id: number;
  userId: number;
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  address: string;
  joinedAt: string;
  email: string;
  className: string;
}

export interface Teacher {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  dob: string;
  gender: string;
  phone: string;
  address: string;
  speciality: string;
  hiredAt: string;
}

export interface User {
  id?: number;
  username: string;
  email?: string;
  fullName?: string;
  role: string;
  status?: string;
  root?: boolean;
  token?: string;
  student?: Student;
  teacher?: Teacher;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'user'; // Revert to 'user' for compatibility
  private readonly TOKEN_KEY = 'token';
  private readonly API_URL = environment.apiUrl;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Fake users để test (fallback khi backend không có)
  private users = [
    { id: 1, username: 'admin', password: '123', role: 'ADMIN', fullName: 'Administrator', email: 'admin@englishcenter.com' },
    { id: 2, username: 'teacher', password: '123', role: 'TEACHER', fullName: 'Giáo viên', email: 'teacher@englishcenter.com' },
    { id: 3, username: 'student', password: '123', role: 'STUDENT', fullName: 'Học viên', email: 'student@englishcenter.com' }
  ];

  constructor(private http: HttpClient) {
    // Load user từ localStorage khi service khởi tạo
    const storedUser = this.getCurrentUser();
    if (storedUser) {
      this.currentUserSubject.next(storedUser);
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    const loginRequest: LoginRequest = { username, password };

    // Gọi backend API
    return this.http.post<any>(`${this.API_URL}/users/login`, loginRequest)
      .pipe(
        map(response => {
          // Backend trả về: { token: "...", user: { id, username, role, teacher/student: {...} } }
          if (response && response.token && response.user) {
            const user: User = {
              id: response.user.id,
              username: response.user.username,
              role: response.user.role,
              status: response.user.status,
              root: response.user.root,
              student: response.user.student,
              teacher: response.user.teacher,
              fullName: response.user.fullName || response.user.username,
              email: response.user.student?.email || response.user.teacher?.email
            };

            // Lưu vào localStorage
            this.setCurrentUser(user, response.token);

            return {
              success: true,
              message: 'Đăng nhập thành công!',
              user: user,
              token: response.token
            };
          }

          return { success: false, message: 'Phản hồi từ server không hợp lệ' };
        }),
        catchError(error => {
          console.error('Lỗi đăng nhập:', error);
          if (error.status === 401) {
            return of({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' });
          } else if (error.status === 403) {
            return of({ success: false, message: 'Tài khoản của bạn đã bị khóa!' });
          }
          return of({ success: false, message: 'Có lỗi xảy ra. Vui lòng thử lại!' });
        })
      );
  }

  private loginWithFakeUsers(username: string, password: string): Observable<LoginResponse> {
    const user = this.users.find(u => u.username === username && u.password === password);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      const token = this.generateFakeToken(userWithoutPassword);
      this.setCurrentUser(userWithoutPassword, token);
      return of({
        success: true,
        message: `Đăng nhập thành công (chế độ demo) - ${userWithoutPassword.fullName}`,
        user: userWithoutPassword,
        token
      });
    }
    return of({
      success: false,
      message: 'Sai tài khoản hoặc mật khẩu! Thử: admin/123, teacher/123, hoặc student/123'
    });
  }

  private generateFakeToken(user: any): string {
    return btoa(JSON.stringify({ ...user, exp: Date.now() + 24 * 60 * 60 * 1000 }));
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/auth/register`, userData)
      .pipe(
        catchError(error => {
          // Fallback logic
          if (this.users.find(u => u.username === userData.username)) {
            return of({ success: false, message: 'Tên đăng nhập đã tồn tại!' });
          }
          this.users.push({
            id: this.users.length + 1,
            ...userData,
            role: 'STUDENT'
          });
          return of({ success: true, message: 'Đăng ký thành công!' });
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.STORAGE_KEY);
    this.currentUserSubject.next(null);
  }

  /**
   * Forgot password - Send reset password email
   * API: POST /auth/forgot-password
   */
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/forgot-password`, { email })
      .pipe(
        catchError(error => {
          console.error('Forgot password error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Validate reset password token
   * API: GET /auth/reset/validate?token=...
   */
  validateResetToken(token: string): Observable<any> {
    return this.http.get(`${this.API_URL}/auth/reset/validate`, {
      params: { token }
    }).pipe(
      catchError(error => {
        console.error('Validate token error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Reset password with token
   * API: POST /auth/reset-password
   */
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/reset-password`, { token, newPassword })
      .pipe(
        catchError(error => {
          console.error('Reset password error:', error);
          return throwError(() => error);
        })
      );
  }

  isLoggedIn(): boolean {
    const user = this.getCurrentUser();
    const token = this.getToken();
    return !!(user && token);
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem(this.STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  getUserRole(): string {
    const user = this.getCurrentUser();
    return user ? user.role : '';
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setCurrentUser(user: User, token: string): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(this.TOKEN_KEY, token);
    this.currentUserSubject.next(user);
  }

  private isTokenExpired(token: string): boolean {
    try {
      if (token.startsWith('ey')) {
        // JWT token
        const payload = JSON.parse(atob(token.split('.')[1]));

        // If token doesn't have exp field, consider it valid
        if (!payload.exp) {
          return false;
        }

        const expired = payload.exp * 1000 < Date.now();
        console.log('JWT token check:', { exp: payload.exp, now: Date.now(), expired });
        return expired;
      } else {
        // Fake token or custom token
        try {
          const payload = JSON.parse(atob(token));

          // If token doesn't have exp field, consider it valid
          if (!payload.exp) {
            return false;
          }

          const expired = payload.exp < Date.now();
          console.log('Custom token check:', { exp: payload.exp, now: Date.now(), expired });
          return expired;
        } catch {
          // If can't parse, consider token as valid (might be opaque token)
          return false;
        }
      }
    } catch (error) {
      console.error('Token parse error:', error);
      // If JWT parse fails but token exists, consider it valid (opaque token)
      return false;
    }
  }

  hasRole(role: string): boolean {
    return this.getUserRole() === role;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.includes(this.getUserRole());
  }
}
