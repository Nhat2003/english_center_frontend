import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Schedule } from '../models/schedule.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private baseUrl = `${environment.apiUrl}/schedules`;

  constructor(private http: HttpClient) {}

  // Get all schedules
  getSchedules(): Observable<Schedule[]> {
    return this.http.get<Schedule[]>(this.baseUrl);
  }  // Get all schedules (for dropdown)
  getAllSchedules(): Observable<Schedule[]> {
    return this.http.get<Schedule[]>(this.baseUrl);
  }

  // Get schedule by id
  getSchedule(id: number): Observable<Schedule> {
    return this.http.get<Schedule>(`${this.baseUrl}/${id}`);
  }

  // Create new schedule
  createSchedule(schedule: Partial<Schedule>): Observable<any> {
    return this.http.post<any>(this.baseUrl, schedule);
  }

  // Update schedule
  updateSchedule(id: number, schedule: Partial<Schedule>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, schedule);
  }

  // Delete schedule
  deleteSchedule(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
