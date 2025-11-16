import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService, User } from '../../../../core/services/auth.service';
import { ScheduleService } from '../../../../core/services/schedule.service';
import { HttpClient } from '@angular/common/http';
import {
  ScheduleItemForTeacherDTO,
  formatSessionInfo,
  formatScheduleTime,
  formatScheduleDate,
  getScheduleStatus,
  DAY_NAMES_VI
} from '../../../../core/models/fixed-schedule.model';

@Component({
  selector: 'app-teacher-schedule',
  templateUrl: './teacher-schedule.component.html',
  styleUrls: ['./teacher-schedule.component.css']
})
export class TeacherScheduleComponent implements OnInit {
  currentUser: User | null = null;
  loading = false;
  teacherSchedules: ScheduleItemForTeacherDTO[] = [];
  currentWeekStart = new Date();

  // Modal for student list
  isStudentModalVisible = false;
  selectedSchedule: ScheduleItemForTeacherDTO | null = null;
  modalStudents: Array<{ id: number; fullName: string }> = [];
  modalLoading = false;

  constructor(
    private authService: AuthService,
    private scheduleService: ScheduleService,
    private message: NzMessageService,
    private http: HttpClient
  ) {
    this.setWeekStart();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser?.role === 'TEACHER') {
      this.loadTeacherSchedule();
    } else {
      this.message.error('Vui lòng đăng nhập với tài khoản giáo viên');
    }
  }

  loadTeacherSchedule(): void {
    if (this.currentUser?.role !== 'TEACHER') return;

    this.loading = true;
    const fromDate = this.formatDateForAPI(this.currentWeekStart);
    const weekEnd = new Date(this.currentWeekStart);
    weekEnd.setDate(this.currentWeekStart.getDate() + 6);
    const toDate = this.formatDateForAPI(weekEnd);

    // Sử dụng teacher.id nếu có, nếu không thì dùng fallback = 2
    const teacherId = this.currentUser.teacher?.id || 2;
    this.scheduleService.getTeacherSchedule(teacherId, fromDate, toDate).subscribe({
      next: (data: ScheduleItemForTeacherDTO[]) => {
        this.teacherSchedules = data;
        this.loading = false;
        this.message.success(`Đã tải ${data.length} lịch dạy tuần này`);
      },
      error: () => {
        this.teacherSchedules = [];
        this.loading = false;
        this.message.error('Không thể tải lịch dạy');
      }
    });
  }

  // Week navigation methods
  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.setWeekStart();
    this.loadTeacherSchedule();
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.setWeekStart();
    this.loadTeacherSchedule();
  }

  goToCurrentWeek(): void {
    this.currentWeekStart = new Date();
    this.setWeekStart();
    this.loadTeacherSchedule();
  }

  refresh(): void {
    this.loadTeacherSchedule();
  }


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
  getSchedulesForDay(dayIndex: number): ScheduleItemForTeacherDTO[] {
    const targetDate = new Date(this.currentWeekStart);
    targetDate.setDate(this.currentWeekStart.getDate() + dayIndex);
    const dateStr = this.formatDateForAPI(targetDate);

    return this.teacherSchedules.filter(schedule => schedule.date === dateStr);
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

  // Helper method to get student count text
  getStudentCountText(students: any[]): string {
    const count = students?.length || 0;
    return count === 1 ? `${count} học sinh` : `${count} học sinh`;
  }

  // Modal methods
  showStudentList(schedule: ScheduleItemForTeacherDTO): void {
    this.selectedSchedule = schedule;
    this.isStudentModalVisible = true;
    this.modalLoading = true;
    // Call API to get students by classId
    const classId = schedule.classId;
    this.http.get<any[]>(`http://localhost:8080/class-students/${classId}`).subscribe({
      next: (students: any[]) => {
        this.modalStudents = students.map(s => ({
          id: s.id,
          fullName: s.fullName || s.name || s.ten || '?'
        }));
        this.modalLoading = false;
      },
      error: () => {
        this.modalStudents = [];
        this.modalLoading = false;
        this.message.error('Không thể tải danh sách học sinh');
      }
    });
  }

  closeStudentModal(): void {
    this.isStudentModalVisible = false;
    this.selectedSchedule = null;
    this.modalStudents = [];
    this.modalLoading = false;
  }

  // ...existing code...
}
