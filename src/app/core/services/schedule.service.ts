import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Schedule } from '../models/schedule.model';
import { FixedSchedule, ScheduleItemDTO, ScheduleItemForStudentDTO, ScheduleItemForTeacherDTO, Room } from '../models/fixed-schedule.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private baseUrl = `${environment.apiUrl}/schedule`; // Đổi từ 'schedules' thành 'schedule'

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

  // Debug method - use mock data for testing
  getMockSchedules(): Observable<Schedule[]> {
    const mockData: Schedule[] = [
      {
        id: 1,
        name: 'Mock Schedule 1',
        description: 'Test schedule',
        details: [
          { dayOfWeek: 'MONDAY', startTime: '08:00:00', endTime: '10:00:00' }
        ]
      }
    ];
    return of(mockData);
  }

  // ===== NEW API METHODS =====

  // Get fixed schedules from new API
  getFixedSchedules(): Observable<FixedSchedule[]> {
    return this.http.get<FixedSchedule[]>(`${this.baseUrl}/fixed`);
  }

  // Get student schedule by ID with optional date range
  getStudentSchedule(studentId: number, from?: string, to?: string, excludeOverridden: boolean = true): Observable<ScheduleItemForStudentDTO[]> {
    let params = new HttpParams();
    if (from) {
      params = params.set('from', from);
    }
    if (to) {
      params = params.set('to', to);
    }
    if (excludeOverridden) {
      params = params.set('excludeOverridden', 'true');
    }
    return this.http.get<ScheduleItemForStudentDTO[]>(`${this.baseUrl}/student/${studentId}`, { params });
  }

  // Get teacher schedule by ID with optional date range
  getTeacherSchedule(teacherId: number, from?: string, to?: string, includeOverrides: boolean = true): Observable<ScheduleItemForTeacherDTO[]> {
    let params = new HttpParams();
    if (from) {
      params = params.set('from', from);
    }
    if (to) {
      params = params.set('to', to);
    }
    // Add parameter to exclude overridden sessions
    if (!includeOverrides) {
      params = params.set('excludeOverridden', 'true');
    }

    return this.http.get<ScheduleItemForTeacherDTO[]>(`${this.baseUrl}/teacher/${teacherId}`, { params });
  }

  // Get teacher schedule for a specific day
  getTeacherScheduleByDate(teacherId: number, date: string): Observable<ScheduleItemForTeacherDTO[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<ScheduleItemForTeacherDTO[]>(`${this.baseUrl}/teacher/${teacherId}/day`, { params });
  }

  // Get teacher schedule for today (helper method)
  getTeacherScheduleToday(teacherId: number): Observable<ScheduleItemForTeacherDTO[]> {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    return this.getTeacherScheduleByDate(teacherId, today);
  }

  // Get current teacher's schedule by date (uses /me endpoint)
  getMyScheduleByDate(date: string): Observable<ScheduleItemForTeacherDTO[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<ScheduleItemForTeacherDTO[]>(`${this.baseUrl}/teacher/me`, { params });
  }

  // Get class schedule for today
  getClassScheduleToday(classId: number): Observable<ScheduleItemDTO[]> {
    return this.http.get<ScheduleItemDTO[]>(`${this.baseUrl}/class/${classId}/today`);
  }

  // Get class schedule for a specific day
  getClassScheduleByDate(classId: number, date: string): Observable<ScheduleItemDTO[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<ScheduleItemDTO[]>(`${this.baseUrl}/class/${classId}/day`, { params });
  }

  // Get class schedule by ID
  getClassSchedule(classId: number): Observable<ScheduleItemDTO[]> {
    return this.http.get<ScheduleItemDTO[]>(`${this.baseUrl}/class/${classId}`);
  }

  // Generate class schedule
  generateClassSchedule(
    classId: number,
    startDate: string,
    endDate: string,
    daysOfWeek: string,
    startTime: string,
    endTime: string,
    teacherId: number,
    roomId: number
  ): Observable<ScheduleItemDTO[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('daysOfWeek', daysOfWeek)
      .set('startTime', startTime)
      .set('endTime', endTime)
      .set('teacherId', teacherId.toString())
      .set('roomId', roomId.toString());

    return this.http.post<ScheduleItemDTO[]>(`${this.baseUrl}/generate/${classId}`, null, { params });
  }

  // Get all rooms
  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.baseUrl}/room`);
  }

  // Save fixed schedule
  saveFixedSchedule(schedule: FixedSchedule): Observable<FixedSchedule> {
    return this.http.post<FixedSchedule>(`${this.baseUrl}/fixed`, schedule);
  }

  // Update fixed schedule
  updateFixedSchedule(id: number, schedule: FixedSchedule): Observable<FixedSchedule> {
    return this.http.put<FixedSchedule>(`${this.baseUrl}/fixed/${id}`, schedule);
  }

  // Delete fixed schedule
  deleteFixedSchedule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/fixed/${id}`);
  }

}

