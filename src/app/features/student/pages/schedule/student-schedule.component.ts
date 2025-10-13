import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService, User } from '../../../../core/services/auth.service';
import { StudentScheduleService } from '../../../../core/services/student-schedule.service';
import { ScheduleService } from '../../../../core/services/schedule.service';
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

  // Calendar data for ng-zorro calendar
  calendarMode: 'month' | 'year' = 'month';
  selectedDate = new Date();
  calendarEventsMap: { [key: string]: StudentSchedule[] } = {};

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
    private newScheduleService: ScheduleService,
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
      // Update calendar events after loading all data
      this.updateCalendarEventsMap();
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

  getRoomDisplayName(room: string): string {
    return room || 'Chưa xác định phòng';
  }

  refresh(): void {
    this.loadScheduleData();
    this.message.success('Đã cập nhật lịch học');
  }

  // ng-zorro calendar methods
  onSelectChange(date: Date): void {
    this.selectedDate = date;
    const dateStr = date.toISOString().split('T')[0];
    console.log('Selected date:', dateStr);

    if (this.calendarEventsMap[dateStr]) {
      this.message.info(`Có ${this.calendarEventsMap[dateStr].length} lịch học ngày này`);
    } else {
      this.message.info('Không có lịch học ngày này');
    }
  }

  onPanelChange(change: { date: Date; mode: string }): void {
    console.log('Panel changed:', change);
    this.selectedDate = change.date;
    if (change.mode === 'month') {
      this.loadMonthlyScheduleData(change.date);
    }
  }

  // Load monthly schedule data for calendar
  loadMonthlyScheduleData(date: Date): void {
    // Implementation to load monthly data
    console.log('Loading monthly data for:', date);
  }

  // Get events for a specific date
  getEventsForDate(date: Date): StudentSchedule[] {
    const dateStr = date.toISOString().split('T')[0];
    return this.calendarEventsMap[dateStr] || [];
  }

  // Update calendar events map
  updateCalendarEventsMap(): void {
    this.calendarEventsMap = {};

    this.todaySchedule.forEach(schedule => {
      const dateStr = new Date().toISOString().split('T')[0];
      if (!this.calendarEventsMap[dateStr]) {
        this.calendarEventsMap[dateStr] = [];
      }
      this.calendarEventsMap[dateStr].push(schedule);
    });

    console.log('Updated calendar events map:', this.calendarEventsMap);
  }

  // Debug and test methods
  simpleTest(): void {
    console.log('Simple test - reloading schedule data');
    this.loadScheduleData();
  }

  testMultipleDates(): void {
    console.log('Testing multiple dates - feature not implemented yet');
    this.message.info('Feature coming soon');
  }

  debugUserInfo(): void {
    console.log('=== DEBUG USER INFO ===');
    console.log('Current user:', this.currentUser);
    console.log('Loading state:', this.loading);
    console.log('View mode:', this.viewMode);
    this.message.info('Check console for debug info');
  }

  debugScheduleData(): void {
    console.log('=== DEBUG SCHEDULE DATA ===');
    console.log('Today schedule:', this.todaySchedule);
    console.log('Weekly schedule:', this.weeklySchedule);
    console.log('Upcoming schedule:', this.upcomingSchedule);
    console.log('Calendar events map:', this.calendarEventsMap);
    this.message.info('Check console for schedule data');
  }

  getCourseDisplayName(courseName: string): string {
    return courseName || 'Chưa xác định khóa học';
  }

  // Test new Schedule Service APIs
  testNewScheduleAPIs(): void {
    console.log('=== TESTING NEW SCHEDULE APIs ===');
    this.message.info('Testing new Schedule APIs - check console');
    
    // Test Fixed Schedules
    this.newScheduleService.getFixedSchedules().subscribe({
      next: (data) => {
        console.log('✅ Fixed Schedules API Success:', data);
      },
      error: (error) => {
        console.error('❌ Fixed Schedules API Error:', error);
      }
    });

    // Test Rooms
    this.newScheduleService.getRooms().subscribe({
      next: (data) => {
        console.log('✅ Rooms API Success:', data);
      },
      error: (error) => {
        console.error('❌ Rooms API Error:', error);
      }
    });

    // Test Student Schedule if user ID exists
    if (this.currentUser?.id) {
      this.newScheduleService.getStudentSchedule(this.currentUser.id).subscribe({
        next: (data) => {
          console.log('✅ Student Schedule API Success:', data);
        },
        error: (error) => {
          console.error('❌ Student Schedule API Error:', error);
        }
      });
    }

    // Test Generate Schedule (demo with sample data)
    this.newScheduleService.generateClassSchedule(
      1, // classId
      '2025-01-13', // startDate
      '2025-01-20', // endDate
      '1,3,5', // Monday, Wednesday, Friday
      '18:00:00', // startTime
      '20:00:00', // endTime
      1, // teacherId
      1  // roomId
    ).subscribe({
      next: (data) => {
        console.log('✅ Generate Schedule API Success:', data);
      },
      error: (error) => {
        console.error('❌ Generate Schedule API Error:', error);
      }
    });
  }
}
