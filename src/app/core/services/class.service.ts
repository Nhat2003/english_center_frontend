import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Class } from '../models/class.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClassService {
  private apiUrl = `${environment.apiUrl}/class-rooms`; // Updated endpoint

  constructor(private http: HttpClient) {}

  getClasses(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<any>(this.apiUrl, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    if (error.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      console.error('Unauthorized - Token may be expired');
      // Có thể redirect về login page
    }
    return throwError(() => error);
  }

  getClass(id: number): Observable<Class> {
    return this.http.get<Class>(`${this.apiUrl}/${id}`);
  }

  createClass(classData: Partial<Class>): Observable<Class> {
    return this.http.post<Class>(this.apiUrl, classData);
  }

  updateClass(id: number, classData: Partial<Class>): Observable<Class> {
    return this.http.put<Class>(`${this.apiUrl}/${id}`, classData);
  }

  deleteClass(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Lấy tất cả classes không phân trang để dùng cho dropdown
  getAllClasses(): Observable<Class[]> {
    return this.http.get<Class[]>(`${this.apiUrl}/all`);
  }

  // Lấy danh sách lớp của giáo viên
  getClassesByTeacher(teacherId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/by-teacher/${teacherId}`)
      .pipe(
        catchError(this.handleError)
      );
  }
}
