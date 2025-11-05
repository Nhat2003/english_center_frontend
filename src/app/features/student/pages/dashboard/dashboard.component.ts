import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../../core/services/auth.service';
import { StudentService } from '../../../../core/services/student.service';
import { ScheduleService } from '../../../../core/services/schedule.service';
import { AssignmentService, SubmissionHistoryResponse } from '../../../../core/services/assignment.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { AnnouncementService } from '../../../../core/services/announcement.service';
import { forkJoin } from 'rxjs';
import { NzMessageService } from 'ng-zorro-antd/message';

interface ClassInfo {
  id: number;
  name: string;
  courseName?: string;
  teacher?: any;
  schedule?: any;
  startDate?: string;
  endDate?: string;
  progress?: number;
  completedLessons?: number;
  totalLessons?: number;
}

interface NextClassInfo {
  className: string;
  subject: string;
  time: string;
  date: string;
  dayOfWeek: string;
  teacher: string;
  room: string;
  hasOnlineLink: boolean;
}

interface AttendanceSummary {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
}

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  currentUser: User | null = null;
  studentId: number = 0;
  loading = true;

  // Classes và schedule data
  myClasses: ClassInfo[] = [];
  nextClass: NextClassInfo | null = null;
  weekSchedule: any[] = [];

  // Assignment data
  pendingAssignments: number = 0;
  nearestDeadline: string = '';
  recentGrades: SubmissionHistoryResponse[] = [];

  // Payment data
  unpaidAmount: number = 0;
  hasUnpaidFees: boolean = false;
  latestPayment: any = null;

  // Attendance data
  attendanceSummary: AttendanceSummary = {
    totalSessions: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    attendanceRate: 0
  };

  // Announcements
  latestAnnouncements: any[] = [];

  // Statistics
  averageGrade: number = 0;
  totalAssignments: number = 0;
  totalCompletedAssignments: number = 0;

  // Math for template
  Math = Math;

  constructor(
    private authService: AuthService,
    private router: Router,
    private studentService: StudentService,
    private scheduleService: ScheduleService,
    private assignmentService: AssignmentService,
    private paymentService: PaymentService,
    private attendanceService: AttendanceService,
    private announcementService: AnnouncementService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.student?.id) {
        this.studentId = user.student.id;
        this.loadDashboardData();
      } else {
        this.loading = false;
        this.message.error('Không tìm thấy thông tin học sinh');
      }
    });
  }

  loadDashboardData() {
    this.loading = true;

    forkJoin({
      classes: this.studentService.getClassesByStudent(this.studentId),
      schedule: this.scheduleService.getStudentSchedule(this.studentId),
      assignments: this.assignmentService.getMyAssignments(),
      submissions: this.assignmentService.getMySubmissionHistory(),
      attendance: this.attendanceService.getByStudent(this.studentId),
      payments: this.paymentService.getPayments(1, 100)
    }).subscribe({
      next: (data) => {
        this.processClassesData(data.classes);
        this.processScheduleData(data.schedule);
        this.processAssignmentsData(data.assignments, data.submissions);
        this.processAttendanceData(data.attendance);
        this.processPaymentData(data.payments.data);
        this.loadAnnouncements();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.message.error('Không thể tải dữ liệu trang chủ');
        this.loading = false;
      }
    });
  }

  processClassesData(classes: any[]) {
    this.myClasses = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      courseName: cls.course?.name,
      teacher: cls.teacher,
      schedule: cls.schedule,
      startDate: cls.startDate,
      endDate: cls.endDate,
      progress: 0, // Will be calculated later
      completedLessons: 0,
      totalLessons: 0
    }));
  }

  processScheduleData(schedule: any[]) {
    if (!schedule || schedule.length === 0) return;

    // Sort by date
    const sortedSchedule = schedule.sort((a, b) =>
      new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
    );

    // Find next class
    const now = new Date();
    const futureClasses = sortedSchedule.filter(s => new Date(s.sessionDate) > now);

    if (futureClasses.length > 0) {
      const next = futureClasses[0];
      this.nextClass = {
        className: next.classRoom?.name || '',
        subject: next.classRoom?.course?.name || '',
        time: `${next.startTime} - ${next.endTime}`,
        date: this.formatDate(next.sessionDate),
        dayOfWeek: this.getDayOfWeek(next.sessionDate),
        teacher: next.teacher?.fullName || '',
        room: next.room?.name || next.room?.location || 'Online',
        hasOnlineLink: true
      };
    }

    // Get week schedule (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    this.weekSchedule = sortedSchedule
      .filter(s => {
        const date = new Date(s.sessionDate);
        return date >= now && date <= nextWeek;
      })
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        day: this.getDayOfWeekShort(s.sessionDate),
        date: this.formatShortDate(s.sessionDate),
        subject: s.classRoom?.course?.name || s.classRoom?.name,
        time: `${s.startTime} - ${s.endTime}`,
        teacher: s.teacher?.fullName || '',
        room: s.room?.name || s.room?.location || 'Online',
        hasOnlineLink: true,
        className: s.classRoom?.name
      }));
  }

  processAssignmentsData(assignments: any[], submissions: SubmissionHistoryResponse[]) {
    // Count pending assignments (not submitted)
    this.pendingAssignments = assignments.filter(a => !a.submitted).length;
    this.totalAssignments = assignments.length;
    this.totalCompletedAssignments = assignments.filter(a => a.submitted).length;

    // Find nearest deadline
    const now = new Date();
    const pendingWithDeadline = assignments
      .filter(a => !a.submitted && new Date(a.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    if (pendingWithDeadline.length > 0) {
      this.nearestDeadline = this.formatDate(pendingWithDeadline[0].dueDate);
    }

    // Get recent grades (last 5)
    this.recentGrades = submissions
      .filter(s => s.grade !== null)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5);

    // Calculate average grade
    const gradedSubmissions = submissions.filter(s => s.grade !== null);
    if (gradedSubmissions.length > 0) {
      const total = gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
      this.averageGrade = Math.round((total / gradedSubmissions.length) * 10) / 10;
    }
  }

  processAttendanceData(attendance: any[]) {
    this.attendanceSummary.totalSessions = attendance.length;
    this.attendanceSummary.presentCount = attendance.filter(a => a.status === 'PRESENT').length;
    this.attendanceSummary.absentCount = attendance.filter(a => a.status === 'ABSENT').length;
    this.attendanceSummary.lateCount = attendance.filter(a => a.status === 'LATE').length;

    if (attendance.length > 0) {
      // Tính tỷ lệ tham gia: (Có mặt + Muộn) / Tổng số buổi
      const attendedCount = this.attendanceSummary.presentCount + this.attendanceSummary.lateCount;
      this.attendanceSummary.attendanceRate = Math.round(
        (attendedCount / attendance.length) * 100
      );
    }
  }

  processPaymentData(payments: any[]) {
    // Filter payments for current student
    const myPayments = payments.filter(p => p.student?.id === this.studentId);

    // Check for unpaid/pending payments
    const unpaid = myPayments.filter(p => p.status === 'PENDING' || p.status === 'UNPAID');
    this.hasUnpaidFees = unpaid.length > 0;
    this.unpaidAmount = unpaid.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Get latest payment
    if (myPayments.length > 0) {
      this.latestPayment = myPayments.sort((a, b) =>
        new Date(b.paymentDate || b.createdAt).getTime() -
        new Date(a.paymentDate || a.createdAt).getTime()
      )[0];
    }
  }

  loadAnnouncements() {
    // Load announcements from all classes
    if (this.myClasses.length === 0) return;

    const announcementRequests = this.myClasses.map(cls =>
      this.announcementService.getAnnouncementsByClass(cls.id)
    );

    forkJoin(announcementRequests).subscribe({
      next: (results) => {
        // Combine all announcements using concat
        const allAnnouncements: any[] = [];
        results.forEach(arr => allAnnouncements.push(...arr));

        // Sort by date and get latest 3
        this.latestAnnouncements = allAnnouncements
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3)
          .map(a => ({
            ...a,
            className: this.myClasses.find(c => c.id === a.classId)?.name
          }));
      },
      error: (error) => {
        console.error('Error loading announcements:', error);
      }
    });
  }

  // Navigation methods
  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  navigateToClass(classId: number) {
    this.router.navigate(['/student/classes', classId, 'overview']);
  }

  joinOnlineClass() {
    if (this.nextClass) {
      this.message.success('Đang vào lớp học online...');
      // Implement online class logic
    }
  }

  // Utility methods
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const day = days[date.getDay()];
    const dateNum = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}, ${dateNum}/${month}/${year}`;
  }

  formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  getDayOfWeek(dateStr: string): string {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[new Date(dateStr).getDay()];
  }

  getDayOfWeekShort(dateStr: string): string {
    return this.getDayOfWeek(dateStr);
  }

  getGradeColor(score: number | null): string {
    if (!score) return 'default';
    if (score >= 9) return 'success';
    if (score >= 8) return 'processing';
    if (score >= 6.5) return 'warning';
    return 'error';
  }

  getGradeLabel(score: number | null): string {
    if (!score) return 'Chưa chấm';
    if (score >= 9) return 'Xuất sắc';
    if (score >= 8) return 'Giỏi';
    if (score >= 6.5) return 'Khá';
    return 'Cần cố gắng';
  }

  getAttendanceStatusColor(status: string): string {
    switch (status) {
      case 'PRESENT': return 'success';
      case 'LATE': return 'warning';
      case 'ABSENT': return 'error';
      default: return 'default';
    }
  }

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'PENDING': return 'warning';
      case 'UNPAID': return 'error';
      default: return 'default';
    }
  }

  getGradeClass(grade: number | null): string {
    if (!grade) return '';
    if (grade >= 9) return 'excellent';
    if (grade >= 8) return 'good';
    if (grade >= 6.5) return 'average';
    return 'poor';
  }

  isNewAnnouncement(createdAt: string): boolean {
    const created = new Date(createdAt);
    const now = new Date();
    const hours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return hours < 24;
  }

  formatAnnouncementTime(createdAt: string): string {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return created.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
