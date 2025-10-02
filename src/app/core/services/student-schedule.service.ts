import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StudentSchedule, ScheduleWeekView, ScheduleCalendarEvent } from '../models/student-schedule.model';

@Injectable({
  providedIn: 'root'
})
export class StudentScheduleService {
  private apiUrl = `${environment.apiUrl}/student-schedules`;

  constructor(private http: HttpClient) {}

  // Lấy lịch học của học sinh theo tuần
  getWeeklySchedule(studentId: number, weekStart?: Date): Observable<ScheduleWeekView> {
    let params = new HttpParams().set('studentId', studentId.toString());

    if (weekStart) {
      params = params.set('weekStart', weekStart.toISOString());
    }

    return this.http.get<StudentSchedule[]>(`${this.apiUrl}/weekly`, { params })
      .pipe(
        map(schedules => this.groupSchedulesByDay(schedules))
      );
  }

  // Lấy lịch học theo tháng (cho calendar view)
  getMonthlySchedule(studentId: number, month: Date): Observable<ScheduleCalendarEvent[]> {
    let params = new HttpParams()
      .set('studentId', studentId.toString())
      .set('month', month.toISOString());

    return this.http.get<StudentSchedule[]>(`${this.apiUrl}/monthly`, { params })
      .pipe(
        map(schedules => this.convertToCalendarEvents(schedules))
      );
  }

  // Lấy lịch học hôm nay
  getTodaySchedule(studentId: number): Observable<StudentSchedule[]> {
    const params = new HttpParams().set('studentId', studentId.toString());

    return this.http.get<StudentSchedule[]>(`${this.apiUrl}/today`, { params });
  }

  // Lấy lịch học sắp tới
  getUpcomingSchedule(studentId: number, days: number = 7): Observable<StudentSchedule[]> {
    let params = new HttpParams()
      .set('studentId', studentId.toString())
      .set('days', days.toString());

    return this.http.get<StudentSchedule[]>(`${this.apiUrl}/upcoming`, { params });
  }

  // Helper methods
  private groupSchedulesByDay(schedules: StudentSchedule[]): ScheduleWeekView {
    const grouped: ScheduleWeekView = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };

    schedules.forEach(schedule => {
      switch (schedule.dayOfWeek) {
        case 'MONDAY': grouped.monday.push(schedule); break;
        case 'TUESDAY': grouped.tuesday.push(schedule); break;
        case 'WEDNESDAY': grouped.wednesday.push(schedule); break;
        case 'THURSDAY': grouped.thursday.push(schedule); break;
        case 'FRIDAY': grouped.friday.push(schedule); break;
        case 'SATURDAY': grouped.saturday.push(schedule); break;
        case 'SUNDAY': grouped.sunday.push(schedule); break;
      }
    });

    return grouped;
  }

  private convertToCalendarEvents(schedules: StudentSchedule[]): ScheduleCalendarEvent[] {
    return schedules.map(schedule => ({
      id: schedule.id,
      title: `${schedule.className} - ${schedule.courseName}`,
      start: this.combineDateTime(schedule.date!, schedule.startTime),
      end: this.combineDateTime(schedule.date!, schedule.endTime),
      className: schedule.className,
      teacher: schedule.teacherName,
      room: schedule.room,
      status: schedule.status,
      description: schedule.description
    }));
  }

  private combineDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':');
    const result = new Date(date);
    result.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return result;
  }

  // Mock data methods
  private getMockWeeklySchedule(): Observable<ScheduleWeekView> {
    const mockData: ScheduleWeekView = {
      monday: [
        {
          id: 1,
          className: 'IELTS Advanced A1',
          courseName: 'IELTS Preparation',
          teacherName: 'Ms. Sarah Johnson',
          dayOfWeek: 'MONDAY',
          startTime: '09:00',
          endTime: '11:00',
          room: 'Room 101',
          status: 'SCHEDULED',
          description: 'IELTS Speaking & Listening practice'
        },
        {
          id: 2,
          className: 'Grammar Intermediate B2',
          courseName: 'English Grammar',
          teacherName: 'Mr. David Wilson',
          dayOfWeek: 'MONDAY',
          startTime: '14:00',
          endTime: '16:00',
          room: 'Room 203',
          status: 'SCHEDULED',
          description: 'Advanced grammar structures'
        }
      ],
      tuesday: [
        {
          id: 3,
          className: 'Business English C1',
          courseName: 'Business Communication',
          teacherName: 'Ms. Emily Brown',
          dayOfWeek: 'TUESDAY',
          startTime: '10:00',
          endTime: '12:00',
          room: 'Room 105',
          status: 'SCHEDULED',
          description: 'Business presentations and negotiations'
        }
      ],
      wednesday: [
        {
          id: 4,
          className: 'IELTS Advanced A1',
          courseName: 'IELTS Preparation',
          teacherName: 'Ms. Sarah Johnson',
          dayOfWeek: 'WEDNESDAY',
          startTime: '09:00',
          endTime: '11:00',
          room: 'Room 101',
          status: 'SCHEDULED',
          description: 'IELTS Writing practice'
        }
      ],
      thursday: [
        {
          id: 5,
          className: 'Grammar Intermediate B2',
          courseName: 'English Grammar',
          teacherName: 'Mr. David Wilson',
          dayOfWeek: 'THURSDAY',
          startTime: '14:00',
          endTime: '16:00',
          room: 'Room 203',
          status: 'SCHEDULED',
          description: 'Conditional sentences and passive voice'
        }
      ],
      friday: [
        {
          id: 6,
          className: 'Business English C1',
          courseName: 'Business Communication',
          teacherName: 'Ms. Emily Brown',
          dayOfWeek: 'FRIDAY',
          startTime: '10:00',
          endTime: '12:00',
          room: 'Room 105',
          status: 'SCHEDULED',
          description: 'Business writing and emails'
        }
      ],
      saturday: [
        {
          id: 7,
          className: 'IELTS Advanced A1',
          courseName: 'IELTS Preparation',
          teacherName: 'Ms. Sarah Johnson',
          dayOfWeek: 'SATURDAY',
          startTime: '08:00',
          endTime: '10:00',
          room: 'Room 101',
          status: 'SCHEDULED',
          description: 'IELTS Reading comprehension'
        }
      ],
      sunday: []
    };

    return of(mockData);
  }

  private getMockMonthlySchedule(): Observable<ScheduleCalendarEvent[]> {
    const events: ScheduleCalendarEvent[] = [];
    const today = new Date();

    // Generate events for current month
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      if (date.getDay() === 1 || date.getDay() === 3) { // Monday & Wednesday
        events.push({
          id: i * 10 + 1,
          title: 'IELTS Advanced A1',
          start: new Date(date.setHours(9, 0, 0, 0)),
          end: new Date(date.setHours(11, 0, 0, 0)),
          className: 'IELTS Advanced A1',
          teacher: 'Ms. Sarah Johnson',
          room: 'Room 101',
          status: 'SCHEDULED'
        });
      }

      if (date.getDay() === 2 || date.getDay() === 5) { // Tuesday & Friday
        events.push({
          id: i * 10 + 2,
          title: 'Business English C1',
          start: new Date(date.setHours(10, 0, 0, 0)),
          end: new Date(date.setHours(12, 0, 0, 0)),
          className: 'Business English C1',
          teacher: 'Ms. Emily Brown',
          room: 'Room 105',
          status: 'SCHEDULED'
        });
      }
    }

    return of(events);
  }

  private getMockTodaySchedule(): Observable<StudentSchedule[]> {
    const today = new Date().getDay();
    const mockWeekly = this.getMockWeeklySchedule();

    return mockWeekly.pipe(
      map(weekly => {
        switch (today) {
          case 1: return weekly.monday;
          case 2: return weekly.tuesday;
          case 3: return weekly.wednesday;
          case 4: return weekly.thursday;
          case 5: return weekly.friday;
          case 6: return weekly.saturday;
          case 0: return weekly.sunday;
          default: return [];
        }
      })
    );
  }

  private getMockUpcomingSchedule(): Observable<StudentSchedule[]> {
    const upcoming: StudentSchedule[] = [
      {
        id: 1,
        className: 'IELTS Advanced A1',
        courseName: 'IELTS Preparation',
        teacherName: 'Ms. Sarah Johnson',
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '11:00',
        room: 'Room 101',
        status: 'SCHEDULED',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        description: 'IELTS Speaking practice'
      },
      {
        id: 2,
        className: 'Business English C1',
        courseName: 'Business Communication',
        teacherName: 'Ms. Emily Brown',
        dayOfWeek: 'TUESDAY',
        startTime: '10:00',
        endTime: '12:00',
        room: 'Room 105',
        status: 'SCHEDULED',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        description: 'Business presentations'
      }
    ];

    return of(upcoming);
  }

  // Debug methods - for testing purposes
  getMockWeeklyScheduleForDebug(): Observable<ScheduleWeekView> {
    return this.getMockWeeklySchedule();
  }

  getMockTodayScheduleForDebug(): Observable<StudentSchedule[]> {
    return this.getMockTodaySchedule();
  }

  getMockUpcomingScheduleForDebug(): Observable<StudentSchedule[]> {
    return this.getMockUpcomingSchedule();
  }

  getMockMonthlyScheduleForDebug(): Observable<ScheduleCalendarEvent[]> {
    return this.getMockMonthlySchedule();
  }
}
