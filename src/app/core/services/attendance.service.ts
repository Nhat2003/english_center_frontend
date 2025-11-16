import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Attendance,
  AttendanceSessionDto,
  AttendanceSessionResponse
} from '../models/attendance.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Get all attendance records
  getAll(): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // Get attendance by ID
  getById(id: number): Observable<Attendance> {
    return this.http.get<Attendance>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Get attendance by class and date
  getByClassAndDate(classId: number, date: string): Observable<Attendance[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<Attendance[]>(
      `${this.apiUrl}/class/${classId}`,
      { headers: this.getHeaders(), params }
    );
  }

  // Get attendance by student
  getByStudent(studentId: number): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(
      `${this.apiUrl}/student/${studentId}`,
      { headers: this.getHeaders() }
    );
  }

  // Get current user's attendance (for students)
  getMyAttendance(): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(
      `${this.apiUrl}/me`,
      { headers: this.getHeaders() }
    );
  }

  // Create a new attendance session (bulk create)
  createSession(sessionDto: AttendanceSessionDto): Observable<AttendanceSessionResponse> {
    return this.http.post<AttendanceSessionResponse>(
      `${this.apiUrl}/session`,
      sessionDto,
      { headers: this.getHeaders() }
    );
  }

  // Create attendance session for today
  createSessionToday(sessionDto: { classId: number; items: Array<{ studentId: number; status: string; note?: string }> }): Observable<AttendanceSessionResponse> {
    return this.http.post<AttendanceSessionResponse>(
      `${this.apiUrl}/session/today`,
      sessionDto,
      { headers: this.getHeaders() }
    );
  }

  // Replace an existing attendance session
  replaceSession(sessionDto: { classId: number; sessionDate: string; items: Array<{ studentId: number; status: string; note?: string }> }): Observable<AttendanceSessionResponse> {
    return this.http.put<AttendanceSessionResponse>(
      `${this.apiUrl}/session`,
      sessionDto,
      { headers: this.getHeaders() }
    );
  }

  // Create single attendance record
  create(attendance: Attendance): Observable<Attendance> {
    return this.http.post<Attendance>(
      this.apiUrl,
      attendance,
      { headers: this.getHeaders() }
    );
  }

  // Update single attendance record
  update(id: number, attendance: Attendance): Observable<Attendance> {
    return this.http.put<Attendance>(
      `${this.apiUrl}/${id}`,
      attendance,
      { headers: this.getHeaders() }
    );
  }

  // Delete attendance record
  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }
}
