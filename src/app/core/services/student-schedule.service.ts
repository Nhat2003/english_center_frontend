import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  StudentSchedule,
  StudentScheduleResponse,
  ScheduleWeekView,
  ScheduleCalendarEvent
} from '../models/student-schedule.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StudentScheduleService {
  private apiUrl = `${environment.apiUrl}/students`;

  constructor(private http: HttpClient) {}

  // Gọi API /students/me/schedule để lấy lịch học của student hiện tại
  getMySchedule(): Observable<StudentSchedule[]> {
    // Debug: Check if we have token
    const token = localStorage.getItem('token');
    return this.http.get<StudentScheduleResponse[]>(`${this.apiUrl}/me/schedule`)
      .pipe(
        map(response => this.flattenScheduleData(response)),
        catchError(this.handleError)
      );
  }

  // Lấy lịch học theo ngày
  getMyScheduleByDay(date: Date): Observable<StudentSchedule[]> {
    const dateStr = date.toISOString().split('T')[0]; // Format: 2025-10-07
    const params = new HttpParams()
      .set('type', 'day')
      .set('date', dateStr);

    return this.http.get<StudentScheduleResponse[]>(`${this.apiUrl}/me/schedule`, { params })
      .pipe(
        map(response => this.flattenScheduleData(response)),
        catchError(this.handleError)
      );
  }

  // Lấy lịch học theo tuần
  getMyScheduleByWeek(weekStart: Date): Observable<StudentSchedule[]> {
    const year = weekStart.getFullYear();
    const week = this.getWeekNumber(weekStart);

    const params = new HttpParams()
      .set('type', 'week')
      .set('week', week.toString())
      .set('year', year.toString());

    return this.http.get<StudentScheduleResponse[]>(`${this.apiUrl}/me/schedule`, { params })
      .pipe(
        map(response => this.flattenScheduleData(response)),
        catchError(this.handleError)
      );
  }

  // Lấy lịch học theo tháng
  getMyScheduleByMonth(month: Date): Observable<StudentSchedule[]> {
    const year = month.getFullYear();
    const monthNum = month.getMonth() + 1; // JS months are 0-based

    const params = new HttpParams()
      .set('type', 'month')
      .set('month', monthNum.toString())
      .set('year', year.toString());

    return this.http.get<StudentScheduleResponse[]>(`${this.apiUrl}/me/schedule`, { params })
      .pipe(
        map(response => this.flattenScheduleData(response)),
        catchError(this.handleError)
      );
  }

  // Method để test API với explicit headers (bypass interceptor issues)
  getMyScheduleWithExplicitHeaders(): Observable<StudentSchedule[]> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return throwError(() => new Error('No authentication token found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    console.log('Headers being sent:', headers.keys());

    return this.http.get<StudentScheduleResponse[]>(`${this.apiUrl}/me/schedule`, { headers })
      .pipe(
        map(response => {
          return this.flattenScheduleData(response);
        }),
        catchError(error => {
          console.error('Explicit headers request failed:', error);
          console.error('Error status:', error.status);
          console.error('Error headers:', error.headers);
          return this.handleError(error);
        })
      );
  }

  // Flatten dữ liệu từ API response thành format dùng trong component
  private flattenScheduleData(responseData: StudentScheduleResponse[]): StudentSchedule[] {
    const flattenedSchedules: StudentSchedule[] = [];

    if (!responseData || !Array.isArray(responseData)) {
      return flattenedSchedules;
    }

    responseData.forEach(classData => {
      if (!classData.schedules || !Array.isArray(classData.schedules)) {
        return;
      }

      classData.schedules.forEach(schedule => {
        const scheduleItem: StudentSchedule = {
          id: classData.id,
          scheduleId: classData.scheduleId,
          className: classData.className,
          courseName: classData.courseName,
          teacherName: classData.teacherName,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          room: classData.room,
          status: classData.status,
          description: classData.description
        };

        // Nếu có date từ API response (cho type=day), sử dụng nó
        if ((classData as any).date) {
          scheduleItem.date = new Date((classData as any).date);
        }

        flattenedSchedules.push(scheduleItem);
      });
    });

    return flattenedSchedules;
  }

  // Lấy lịch học theo tuần dựa trên data từ API /students/me/schedule
  getWeeklySchedule(studentId: number, weekStart: Date): Observable<ScheduleWeekView> {
    return this.getMyScheduleByWeek(weekStart).pipe(
      map(schedules => this.formatSchedulesToWeekView(schedules, weekStart))
    );
  }

  // Lấy lịch học hôm nay
  getTodaySchedule(studentId: number): Observable<StudentSchedule[]> {
    return this.getMyScheduleByDay(new Date());
  }

  // Lấy lịch học sắp tới trong n ngày
  getUpcomingSchedule(studentId: number, days: number): Observable<StudentSchedule[]> {
    const today = new Date();
    return this.getMyScheduleByWeek(today).pipe(
      map(schedules => this.filterUpcomingSchedule(schedules, days))
    );
  }

  // Lấy events cho calendar view
  getMonthlySchedule(studentId: number, month: Date): Observable<ScheduleCalendarEvent[]> {
    return this.getMyScheduleByMonth(month).pipe(
      map(schedules => this.formatSchedulesToCalendarEvents(schedules, month))
    );
  }

  // Helper method để tính số tuần trong năm
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // Helper method để format schedules thành week view
  private formatSchedulesToWeekView(schedules: StudentSchedule[], weekStart: Date): ScheduleWeekView {
    const weekView: ScheduleWeekView = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    schedules.forEach(schedule => {
      if (schedule.date) {
        const scheduleDate = new Date(schedule.date);
        if (scheduleDate >= weekStart && scheduleDate <= weekEnd) {
          const dayKey = this.getDayKeyFromDate(scheduleDate);
          if (dayKey) {
            weekView[dayKey].push(schedule);
          }
        }
      } else {
        // Nếu không có date cụ thể, sử dụng dayOfWeek
        const dayKey = this.getDayKeyFromDayOfWeek(schedule.dayOfWeek);
        if (dayKey) {
          weekView[dayKey].push(schedule);
        }
      }
    });

    // Sort schedules by time for each day
    Object.keys(weekView).forEach(day => {
      weekView[day as keyof ScheduleWeekView].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );
    });

    return weekView;
  }

  // Helper method để lọc lịch học hôm nay
  private filterTodaySchedule(schedules: StudentSchedule[]): StudentSchedule[] {
    const today = new Date();
    const todayDayOfWeek = this.getDayOfWeekFromDate(today);

    return schedules.filter(schedule => {
      if (schedule.date) {
        const scheduleDate = new Date(schedule.date);
        return this.isSameDay(scheduleDate, today);
      } else {
        return schedule.dayOfWeek === todayDayOfWeek;
      }
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  // Helper method để lọc lịch học sắp tới
  private filterUpcomingSchedule(schedules: StudentSchedule[], days: number): StudentSchedule[] {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + days);

    return schedules.filter(schedule => {
      if (schedule.date) {
        const scheduleDate = new Date(schedule.date);
        return scheduleDate >= today && scheduleDate <= endDate;
      }
      return false; // Chỉ lấy những schedule có date cụ thể
    }).sort((a, b) => {
      if (a.date && b.date) {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare === 0) {
          return a.startTime.localeCompare(b.startTime);
        }
        return dateCompare;
      }
      return 0;
    });
  }

  // Helper method để format schedules thành calendar events
  private formatSchedulesToCalendarEvents(schedules: StudentSchedule[], month: Date): ScheduleCalendarEvent[] {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    return schedules
      .filter(schedule => {
        if (schedule.date) {
          const scheduleDate = new Date(schedule.date);
          return scheduleDate >= monthStart && scheduleDate <= monthEnd;
        }
        return false;
      })
      .map(schedule => {
        const scheduleDate = new Date(schedule.date!);
        const startTime = this.parseTime(schedule.startTime);
        const endTime = this.parseTime(schedule.endTime);

        const start = new Date(scheduleDate);
        start.setHours(startTime.hours, startTime.minutes);

        const end = new Date(scheduleDate);
        end.setHours(endTime.hours, endTime.minutes);

        return {
          id: schedule.id,
          title: `${schedule.className}${schedule.courseName ? ' - ' + schedule.courseName : ''}`,
          start,
          end,
          className: schedule.className,
          teacher: schedule.teacherName,
          room: schedule.room,
          status: schedule.status,
          description: schedule.description
        };
      });
  }

  // Utility methods
  private getDayKeyFromDate(date: Date): keyof ScheduleWeekView | null {
    const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayKeys: (keyof ScheduleWeekView)[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayKeys[dayIndex];
  }

  private getDayKeyFromDayOfWeek(dayOfWeek: string): keyof ScheduleWeekView | null {
    const dayMap: { [key: string]: keyof ScheduleWeekView } = {
      'MONDAY': 'monday',
      'TUESDAY': 'tuesday',
      'WEDNESDAY': 'wednesday',
      'THURSDAY': 'thursday',
      'FRIDAY': 'friday',
      'SATURDAY': 'saturday',
      'SUNDAY': 'sunday'
    };
    return dayMap[dayOfWeek] || null;
  }

  private getDayOfWeekFromDate(date: Date): string {
    const dayMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return dayMap[date.getDay()];
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Student Schedule API Error:', error);
    console.error('Error status:', error.status);
    console.error('Error message:', error.message);
    console.error('Error body:', error.error);

    if (error.status === 401) {
      console.error('Unauthorized - Token may be expired');
    } else if (error.status === 403) {
      console.error('Forbidden - Insufficient permissions');
    } else if (error.status === 404) {
      console.error('Not Found - Schedule not found or API endpoint may not exist');
    }

    return throwError(() => error);
  }
}
