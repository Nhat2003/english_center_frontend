import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { TeacherService } from '../../../core/services/teacher.service';
import { ScheduleService } from '../../../core/services/schedule.service';
import { AssignmentService } from '../../../core/services/assignment.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { forkJoin } from 'rxjs';

interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  todayClasses: number;
  pendingAssignments: number;
}

interface TodayScheduleItem {
  id: string;
  date: string;
  start: string;
  end: string;
  classId: number;
  className: string;
  roomName: string;
  studentCount: number;
}

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class TeacherDashboardComponent implements OnInit {
  currentUser: User | null = null;
  currentTime = new Date();
  loading = false;
  teacherId: number | null = null;

  // Teacher Statistics
  teacherStats: DashboardStats = {
    totalClasses: 0,
    totalStudents: 0,
    todayClasses: 0,
    pendingAssignments: 0
  };

  // Today's Schedule
  todaySchedule: TodayScheduleItem[] = [];

  // Quick Actions
  quickActions = [
    {
      emoji: '📋',
      title: 'Lớp học',
      description: 'Quản lý lớp học của tôi',
      color: '#1890ff',
      route: '/teacher/classes'
    },
    {
      emoji: '✅',
      title: 'Điểm danh',
      description: 'Điểm danh học sinh',
      color: '#52c41a',
      route: '/teacher/classes'
    },
    {
      emoji: '📅',
      title: 'Lịch dạy',
      description: 'Xem lịch giảng dạy',
      color: '#faad14',
      route: '/teacher/schedule'
    },
    {
      emoji: '📝',
      title: 'Bài tập',
      description: 'Quản lý bài tập',
      color: '#722ed1',
      route: '/teacher/assignments'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private teacherService: TeacherService,
    private scheduleService: ScheduleService,
    private assignmentService: AssignmentService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user?.teacher?.id) {
      this.teacherId = user.teacher.id;
      this.currentUser = user;
      this.loadDashboardData();
    } else {
      this.message.error('Không tìm thấy thông tin giáo viên');
    }

    // Update current time every minute
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  loadDashboardData(): void {
    if (!this.teacherId) {
      console.error('No teacherId found');
      this.message.error('Không tìm thấy ID giáo viên');
      return;
    }

    console.log('Loading dashboard data for teacher:', this.teacherId);
    this.loading = true;

    // Load classes
    this.teacherService.getClassesByTeacher(this.teacherId).subscribe({
      next: (classes) => {
        console.log('Classes loaded:', classes);
        this.teacherStats.totalClasses = classes.length;

        // Count total students
        const studentRequests = classes.map(cls =>
          this.teacherService.getStudentsByClass(cls.id)
        );

        if (studentRequests.length > 0) {
          forkJoin(studentRequests).subscribe({
            next: (studentsArrays) => {
              console.log('Students loaded:', studentsArrays);
              this.teacherStats.totalStudents = studentsArrays.reduce(
                (total, students) => total + students.length,
                0
              );
            },
            error: (err) => {
              console.error('Failed to count students:', err);
              this.message.error('Không thể tải danh sách học sinh');
            }
          });
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load classes:', err);
        this.message.error('Không thể tải danh sách lớp học. Vui lòng kiểm tra kết nối backend.');
        this.loading = false;
      }
    });

    // Load today's schedule using teacher ID
    const today = new Date();
    const todayStr = this.formatDate(today);
    console.log('Loading schedule for teacher:', this.teacherId, 'date:', todayStr);

    // Use getTeacherScheduleToday instead of getMyScheduleByDate
    this.scheduleService.getTeacherScheduleToday(this.teacherId).subscribe({
      next: (schedule) => {
        console.log('Schedule loaded:', schedule);
        this.todaySchedule = schedule.map(item => ({
          id: item.id,
          date: item.date,
          start: item.start,
          end: item.end,
          classId: item.classId,
          className: item.className,
          roomName: item.roomName,
          studentCount: item.students ? item.students.length : 0
        }));
        this.teacherStats.todayClasses = schedule.length;
      },
      error: (err) => {
        console.error('Failed to load today schedule:', err);
        this.message.error('Không thể tải lịch dạy hôm nay. Vui lòng kiểm tra kết nối backend.');
      }
    });
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatTime(dateTimeString: string): string {
    try {
      const date = new Date(dateTimeString);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  }

  getTimeRange(schedule: TodayScheduleItem): string {
    return `${this.formatTime(schedule.start)} - ${this.formatTime(schedule.end)}`;
  }

  navigateToAttendance(classId: number): void {
    this.router.navigate(['/teacher/classes', classId, 'attendance']);
  }

  navigateToClass(classId: number): void {
    this.router.navigate(['/teacher/classes', classId, 'overview']);
  }

  executeQuickAction(route: string): void {
    this.router.navigate([route]);
  }
}
