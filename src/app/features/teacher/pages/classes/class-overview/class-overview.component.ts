import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClassService } from '../../../../../core/services/class.service';
import { TeacherService } from '../../../../../core/services/teacher.service';
import { AssignmentService } from '../../../../../core/services/assignment.service';
import { MaterialService } from '../../../../../core/services/material.service';
import { AttendanceService } from '../../../../../core/services/attendance.service';
import { AnnouncementService } from '../../../../../core/services/announcement.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-class-overview',
  templateUrl: './class-overview.component.html',
  styleUrls: ['./class-overview.component.css']
})
export class ClassOverviewComponent implements OnInit {
  classId: number | null = null;
  classInfo: any = null;

  // Statistics
  studentCount: number = 0;
  assignmentCount: number = 0;
  materialCount: number = 0;
  attendanceRate: number = 0;

  // Assignment Statistics
  gradedAssignments: number = 0;
  pendingGrading: number = 0;

  // Recent Data
  recentAnnouncements: any[] = [];
  students: any[] = [];
  assignments: any[] = [];

  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private classService: ClassService,
    private teacherService: TeacherService,
    private assignmentService: AssignmentService,
    private materialService: MaterialService,
    private attendanceService: AttendanceService,
    private announcementService: AnnouncementService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      console.log('Route params:', params);
      const idParam = params['id'];
      console.log('Raw ID param:', idParam, typeof idParam);

      // Parse và validate classId
      this.classId = parseInt(idParam, 10);
      console.log('Parsed ClassId:', this.classId);

      if (this.classId && !isNaN(this.classId)) {
        this.loadClassDetails();
      } else {
        console.error('ClassId is invalid or missing. Raw:', idParam, 'Parsed:', this.classId);
        this.message.error('ID lớp học không hợp lệ');
      }
    });
  }

  loadClassDetails(): void {
    this.loading = true;
    console.log('Loading class details for classId:', this.classId);

    forkJoin({
      classInfo: this.classService.getClass(this.classId!).pipe(
        catchError(err => {
          console.error('Failed to load class info:', err);
          return of(null);
        })
      ),
      students: this.teacherService.getStudentsByClass(this.classId!).pipe(
        catchError(err => {
          console.error('Failed to load students:', err);
          return of([]);
        })
      ),
      assignments: this.assignmentService.getAssignmentsByClass(this.classId!).pipe(
        catchError(err => {
          console.error('Failed to load assignments:', err);
          return of([]);
        })
      ),
      materials: this.materialService.getMaterialsByClass(this.classId!).pipe(
        catchError(err => {
          console.error('Failed to load materials:', err);
          return of([]);
        })
      ),
      announcements: this.announcementService.getAnnouncementsByClass(this.classId!).pipe(
        catchError(err => {
          console.error('Failed to load announcements:', err);
          return of([]);
        })
      )
    }).subscribe({
      next: (result) => {
        console.log('API Results:', result);

        if (!result.classInfo) {
          this.message.error('Không thể tải thông tin lớp');
          this.loading = false;
          return;
        }

        this.classInfo = result.classInfo;
        this.students = result.students;
        this.assignments = result.assignments;
        this.studentCount = result.students.length;
        this.assignmentCount = result.assignments.length;
        this.materialCount = result.materials.length;

        // Process announcements - get 5 most recent
        this.recentAnnouncements = result.announcements
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        // Calculate assignment grading statistics
        this.calculateAssignmentStats(result.assignments);

        // Load attendance statistics
        this.loadAttendanceStats();

        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load class details:', err);
        console.error('Error details:', {
          status: err.status,
          message: err.message,
          error: err.error
        });
        this.loading = false;
        this.message.error('Không thể tải thông tin lớp: ' + (err.error?.message || err.message || 'Lỗi không xác định'));
      }
    });
  }

  calculateAssignmentStats(assignments: any[]): void {
    // Count assignments that have been graded vs pending
    this.gradedAssignments = 0;
    this.pendingGrading = 0;

    if (!assignments || assignments.length === 0) {
      return;
    }

    assignments.forEach(assignment => {
      // Assuming assignments have submissions array
      if (assignment.submissions && assignment.submissions.length > 0) {
        const hasGradedSubmissions = assignment.submissions.some((s: any) => s.grade !== null && s.grade !== undefined);
        if (hasGradedSubmissions) {
          this.gradedAssignments++;
        } else {
          this.pendingGrading++;
        }
      }
    });
  }

  loadAttendanceStats(): void {
    if (!this.classId || this.studentCount === 0 || !this.students || this.students.length === 0) {
      this.attendanceRate = 0;
      return;
    }

    // Get attendance records for all students in this class
    const attendanceRequests = this.students.map(student =>
      this.attendanceService.getByStudent(student.id)
    );

    if (attendanceRequests.length === 0) {
      this.attendanceRate = 0;
      return;
    }

    forkJoin(attendanceRequests).subscribe({
      next: (attendanceArrays) => {
        let totalSessions = 0;
        let totalPresent = 0;
        let totalLate = 0;

        attendanceArrays.forEach(attendances => {
          const classAttendances = attendances.filter((a: any) => a.classId === this.classId);
          totalSessions += classAttendances.length;
          totalPresent += classAttendances.filter((a: any) => a.status === 'PRESENT').length;
          totalLate += classAttendances.filter((a: any) => a.status === 'LATE').length;
        });

        if (totalSessions > 0) {
          this.attendanceRate = Math.round(((totalPresent + totalLate) / totalSessions) * 100);
        } else {
          this.attendanceRate = 0;
        }
      },
      error: (err) => {
        console.error('Failed to load attendance stats:', err);
        this.attendanceRate = 0;
      }
    });
  }

  // Quick Actions
  goToAttendance(): void {
    this.router.navigate(['/teacher/attendance'], { queryParams: { classId: this.classId } });
  }

  goToAssignments(): void {
    this.router.navigate(['/teacher/assignments'], { queryParams: { classId: this.classId } });
  }

  goToMaterials(): void {
    this.router.navigate(['/teacher/materials'], { queryParams: { classId: this.classId } });
  }

  createAnnouncement(): void {
    this.router.navigate(['/teacher/announcements/create'], { queryParams: { classId: this.classId } });
  }

  viewStudents(): void {
    this.router.navigate(['/teacher/students'], { queryParams: { classId: this.classId } });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN');
  }
}
