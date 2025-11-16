import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService, User, Student } from '../../../../core/services/auth.service';
import { ScheduleService } from '../../../../core/services/schedule.service';
import {
  ScheduleItemForStudentDTO,
  formatSessionInfo,
  formatScheduleTime,
  formatScheduleDate,
  getScheduleStatus,
  DAY_NAMES_VI
} from '../../../../core/models/fixed-schedule.model';

@Component({
  selector: 'app-student-schedule',
  templateUrl: './student-schedule.component.html',
  styleUrls: ['./student-schedule.component.css']
})
export class StudentScheduleComponent implements OnInit {
  currentUser: User | null = null;
  loading = false;
  studentSchedules: ScheduleItemForStudentDTO[] = [];
  currentWeekStart = new Date();

  constructor(
    private authService: AuthService,
    private scheduleService: ScheduleService,
    private message: NzMessageService
  ) {
    this.setWeekStart();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    if (this.currentUser?.role === 'STUDENT' && this.currentUser?.student?.id) {
      this.loadStudentSchedule();
    } else {
      this.message.error('Vui lòng đăng nhập với tài khoản học sinh');
    }
  }

  loadStudentSchedule(): void {
    if (!this.currentUser?.student?.id) return;

    this.loading = true;
    const fromDate = this.formatDateForAPI(this.currentWeekStart);
    const weekEnd = new Date(this.currentWeekStart);
    weekEnd.setDate(this.currentWeekStart.getDate() + 6);
    const toDate = this.formatDateForAPI(weekEnd);

    this.scheduleService.getStudentSchedule(this.currentUser.student.id, fromDate, toDate).subscribe({
      next: (data: ScheduleItemForStudentDTO[]) => {
        this.studentSchedules = data;
        this.loading = false;
        this.message.success(`Đã tải ${data.length} lịch học tuần này`);
      },
      error: (error) => {
        this.studentSchedules = [];
        this.loading = false;
        this.message.error('Không thể tải lịch học');
      }
    });
  }

  // Week navigation methods
  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.setWeekStart();
    this.loadStudentSchedule();
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.setWeekStart();
    this.loadStudentSchedule();
  }

  goToCurrentWeek(): void {
    this.currentWeekStart = new Date();
    this.setWeekStart();
    this.loadStudentSchedule();
  }

  refresh(): void {
    this.loadStudentSchedule();
  }

  // Helper methods
  private setWeekStart(): void {
    const today = new Date(this.currentWeekStart);
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;

    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() + mondayOffset);
    mondayDate.setHours(0, 0, 0, 0);

    this.currentWeekStart = mondayDate;
  }

  getWeekDateRange(): string {
    const weekEnd = new Date(this.currentWeekStart);
    weekEnd.setDate(this.currentWeekStart.getDate() + 6);
    return `${this.formatDate(this.currentWeekStart)} - ${this.formatDate(weekEnd)}`;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Schedule display methods
  getSchedulesForDay(dayIndex: number): ScheduleItemForStudentDTO[] {
    const targetDate = new Date(this.currentWeekStart);
    targetDate.setDate(this.currentWeekStart.getDate() + dayIndex);
    const dateStr = this.formatDateForAPI(targetDate);

    return this.studentSchedules.filter(schedule => schedule.date === dateStr);
  }

  isToday(dayIndex: number): boolean {
    const dayDate = new Date(this.currentWeekStart);
    dayDate.setDate(this.currentWeekStart.getDate() + dayIndex);
    const today = new Date();
    return dayDate.toDateString() === today.toDateString();
  }

  getDayLabel(dayIndex: number): string {
    const dayNumber = (dayIndex + 2).toString();
    return DAY_NAMES_VI[dayNumber] || `Day ${dayIndex}`;
  }

  getFullDayLabel(dayIndex: number): string {
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    return dayNames[dayIndex] || `Day ${dayIndex}`;
  }

  getDayDate(dayIndex: number): string {
    const date = new Date(this.currentWeekStart);
    date.setDate(this.currentWeekStart.getDate() + dayIndex);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }

  // Template helper methods
  formatSessionInfo(sessionIndex: number, totalSessions: number): string {
    return formatSessionInfo(sessionIndex, totalSessions);
  }

  formatScheduleTime(start: string, end: string): string {
    return formatScheduleTime(start, end);
  }

  formatScheduleDate(dateString: string): string {
    return formatScheduleDate(dateString);
  }

  getScheduleStatus(sessionIndex: number, totalSessions: number) {
    return getScheduleStatus(sessionIndex, totalSessions);
  }
}
