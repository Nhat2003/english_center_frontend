import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
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
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'user';
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

    // Gọi backend API (bắt buộc)
    return this.http.post<any>(`${this.API_URL}/users/login`, loginRequest)
      .pipe(
        map(response => {
          console.log('Backend response:', response);

          // Backend cần trả về format: { token: "...", user: { id, username, role, fullName, email... } }
          // Lưu ý: Backend cần có cột fullName trong bảng User
          if (response && response.user && response.user.id && response.user.username && response.user.role) {
            const user: User = {
              id: response.user.id,
              username: response.user.username,
              role: response.user.role,
              fullName: response.user.fullName || response.user.username,
              email: response.user.email || `${response.user.username}@englishcenter.com`,
              status: response.user.status,
              root: response.user.root
            };

            // Sử dụng token từ backend
            const token = response.token;
            this.setCurrentUser(user, token);

            return {
              success: true,
              message: 'Đăng nhập thành công!',
              user: user,
              token: token
            };
          }

          console.error('Invalid response format:', response);
          return { success: false, message: 'Phản hồi từ server không hợp lệ' };
        }),
        catchError(error => {
          console.error('Lỗi đăng nhập API:', error);

          // Xử lý các lỗi cụ thể
          if (error.status === 401) {
            return of({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' });
          } else if (error.status === 403) {
            return of({ success: false, message: 'Tài khoản của bạn đã bị khóa!' });
          } else if (error.status === 0) {
            return of({ success: false, message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!' });
          } else {
            return of({ success: false, message: 'Có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại!' });
          }
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
          console.warn('Backend register failed, using fallback:', error);
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
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    const user = this.getCurrentUser();
    const token = this.getToken();
    return !!(user && token && !this.isTokenExpired(token));
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
        return payload.exp * 1000 < Date.now();
      } else {
        // Fake token
        const payload = JSON.parse(atob(token));
        return payload.exp < Date.now();
      }
    } catch {
      return true;
    }
  }

  hasRole(role: string): boolean {
    return this.getUserRole() === role;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.includes(this.getUserRole());
  }
}
