import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'user';

  // Fake users để test
  private users = [
    { username: 'admin', password: '123', role: 'ADMIN' },
    { username: 'teacher', password: '123', role: 'TEACHER' },
    { username: 'student', password: '123', role: 'STUDENT' }
  ];

  login(username: string, password: string): boolean {
    const user = this.users.find(u => u.username === username && u.password === password);
    if (user) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      return true;
    }
    return false;
  }

  register(username: string, password: string): boolean {
    if (this.users.find(u => u.username === username)) {
      return false; // trùng username
    }
    this.users.push({ username, password, role: 'STUDENT' }); // mặc định STUDENT
    return true;
  }

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.STORAGE_KEY);
  }

  getUserRole(): string {
    const user = localStorage.getItem(this.STORAGE_KEY);
    return user ? JSON.parse(user).role : '';
  }
}
