import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService, User } from '../../../../core/services/auth.service';
import { StudentScheduleService } from '../../../../core/services/student-schedule.service';
import { StudentSchedule, ScheduleWeekView, ScheduleCalendarEvent } from '../../../../core/models/student-schedule.model';

@Component({
  selector: 'app-student-schedule',
  templateUrl: './student-schedule.component.html',
  styleUrls: ['./student-schedule.component.css']
})
export class StudentScheduleComponent implements OnInit {
  currentUser: User | null = null;
  loading = false;
  viewMode: 'week' | 'calendar' | 'today' = 'week';

  // Week view data
  weeklySchedule: ScheduleWeekView | null = null;
  currentWeekStart = new Date();

  // Calendar view data
  calendarEvents: ScheduleCalendarEvent[] = [];
  currentMonth = new Date();

  // Today view data
  todaySchedule: StudentSchedule[] = [];

  // Upcoming schedule
  upcomingSchedule: StudentSchedule[] = [];

  // Week days for display
  weekDays = [
    { key: 'monday', label: 'Thứ 2', short: 'T2' },
    { key: 'tuesday', label: 'Thứ 3', short: 'T3' },
    { key: 'wednesday', label: 'Thứ 4', short: 'T4' },
    { key: 'thursday', label: 'Thứ 5', short: 'T5' },
    { key: 'friday', label: 'Thứ 6', short: 'T6' },
    { key: 'saturday', label: 'Thứ 7', short: 'T7' },
    { key: 'sunday', label: 'Chủ nhật', short: 'CN' }
  ];

  constructor(
    private authService: AuthService,
    private scheduleService: StudentScheduleService,
    private message: NzMessageService
  ) {
    this.setWeekStart();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.loadScheduleData();
    } else {
      this.message.error('Không thể xác định thông tin học sinh');
    }
  }

  loadScheduleData(): void {
    if (!this.currentUser) return;

    this.loading = true;

    // Load all schedule data
    Promise.all([
      this.loadWeeklySchedule(),
      this.loadTodaySchedule(),
      this.loadUpcomingSchedule(),
      this.loadCalendarEvents()
    ]).finally(() => {
      this.loading = false;
    });
  }

  loadWeeklySchedule(): Promise<void> {
    return new Promise((resolve) => {
      this.scheduleService.getWeeklySchedule(this.currentUser!.id, this.currentWeekStart)
        .subscribe({
          next: (schedule) => {
            this.weeklySchedule = schedule;
            console.log('Weekly schedule loaded from API:', schedule);
            resolve();
          },
          error: (error) => {
            console.error('Failed to load weekly schedule from API:', error);
            this.message.error('Không thể tải lịch học tuần từ server');
            this.weeklySchedule = {
              monday: [], tuesday: [], wednesday: [], thursday: [],
              friday: [], saturday: [], sunday: []
            };
            resolve();
          }
        });
    });
  }

  loadTodaySchedule(): Promise<void> {
    return new Promise((resolve) => {
      this.scheduleService.getTodaySchedule(this.currentUser!.id)
        .subscribe({
          next: (schedule) => {
            this.todaySchedule = schedule;
            console.log('Today schedule loaded from API:', schedule);
            resolve();
          },
          error: (error) => {
            console.error('Failed to load today schedule from API:', error);
            this.message.error('Không thể tải lịch học hôm nay từ server');
            this.todaySchedule = [];
            resolve();
          }
        });
    });
  }

  loadUpcomingSchedule(): Promise<void> {
    return new Promise((resolve) => {
      this.scheduleService.getUpcomingSchedule(this.currentUser!.id, 7)
        .subscribe({
          next: (schedule) => {
            this.upcomingSchedule = schedule;
            console.log('Upcoming schedule loaded from API:', schedule);
            resolve();
          },
          error: (error) => {
            console.error('Failed to load upcoming schedule from API:', error);
            this.message.error('Không thể tải lịch học sắp tới từ server');
            this.upcomingSchedule = [];
            resolve();
          }
        });
    });
  }

  loadCalendarEvents(): Promise<void> {
    return new Promise((resolve) => {
      this.scheduleService.getMonthlySchedule(this.currentUser!.id, this.currentMonth)
        .subscribe({
          next: (events) => {
            this.calendarEvents = events;
            console.log('Calendar events loaded from API:', events);
            resolve();
          },
          error: (error) => {
            console.error('Failed to load calendar events from API:', error);
            this.message.error('Không thể tải lịch học tháng từ server');
            this.calendarEvents = [];
            resolve();
          }
        });
    });
  }

  // Navigation methods
  changeViewMode(mode: 'week' | 'calendar' | 'today'): void {
    this.viewMode = mode;
  }

  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.setWeekStart();
    this.loadWeeklySchedule();
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.setWeekStart();
    this.loadWeeklySchedule();
  }

  goToCurrentWeek(): void {
    this.currentWeekStart = new Date();
    this.setWeekStart();
    this.loadWeeklySchedule();
  }

  // Helper methods
  private setWeekStart(): void {
    const today = new Date(this.currentWeekStart);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    this.currentWeekStart = new Date(today.setDate(diff));
    this.currentWeekStart.setHours(0, 0, 0, 0);
  }

  getWeekDateRange(): string {
    const weekEnd = new Date(this.currentWeekStart);
    weekEnd.setDate(this.currentWeekStart.getDate() + 6);

    return `${this.formatDate(this.currentWeekStart)} - ${this.formatDate(weekEnd)}`;
  }

  getDateForDay(dayIndex: number): Date {
    const date = new Date(this.currentWeekStart);
    date.setDate(this.currentWeekStart.getDate() + dayIndex);
    return date;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getCurrentDate(): string {
    return this.formatDate(new Date());
  }

  formatTime(time: string): string {
    return time;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'SCHEDULED':
        return 'blue';
      case 'COMPLETED':
        return 'green';
      case 'CANCELLED':
        return 'red';
      default:
        return 'default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'SCHEDULED':
        return 'Đã lên lịch';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  }

  getDaySchedule(dayKey: string): StudentSchedule[] {
    if (!this.weeklySchedule) return [];
    return (this.weeklySchedule as any)[dayKey] || [];
  }

  isToday(dayIndex: number): boolean {
    const dayDate = this.getDateForDay(dayIndex);
    const today = new Date();
    return dayDate.toDateString() === today.toDateString();
  }

  refresh(): void {
    this.loadScheduleData();
    this.message.success('Đã cập nhật lịch học');
  }
}
