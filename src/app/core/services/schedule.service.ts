import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Schedule } from '../models/schedule.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private baseUrl = `${environment.apiUrl}/schedules`;

  // Mock data with new format
  private mockSchedules: Schedule[] = [
    {
      id: 1,
      name: "Lịch học 2,4,6 tối",
      description: "Lịch học buổi tối các ngày 2,4,6",
      details: [
        {
          dayOfWeek: "MONDAY",
          startTime: "20:00",
          endTime: "22:00"
        },
        {
          dayOfWeek: "WEDNESDAY",
          startTime: "20:00",
          endTime: "22:00"
        },
        {
          dayOfWeek: "FRIDAY",
          startTime: "20:00",
          endTime: "22:00"
        }
      ]
    },
    {
      id: 2,
      name: "Lịch học 3,5,7 sáng",
      description: "Lịch học buổi sáng các ngày 3,5,7",
      details: [
        {
          dayOfWeek: "TUESDAY",
          startTime: "08:00",
          endTime: "10:00"
        },
        {
          dayOfWeek: "THURSDAY",
          startTime: "08:00",
          endTime: "10:00"
        },
        {
          dayOfWeek: "SATURDAY",
          startTime: "08:00",
          endTime: "10:00"
        }
      ]
    },
    {
      id: 3,
      name: "Lịch học cuối tuần",
      description: "Lịch học dành cho học viên bận trong tuần",
      details: [
        {
          dayOfWeek: "SATURDAY",
          startTime: "14:00",
          endTime: "17:00"
        },
        {
          dayOfWeek: "SUNDAY",
          startTime: "14:00",
          endTime: "17:00"
        }
      ]
    }
  ];

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
    return of(this.mockSchedules);
  }
}
