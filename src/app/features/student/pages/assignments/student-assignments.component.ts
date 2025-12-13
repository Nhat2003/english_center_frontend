import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AssignmentService } from '../../../../core/services/assignment.service';
import { StudentAssignment } from '../../../../core/models/assignment.model';

@Component({
  selector: 'app-student-assignments',
  templateUrl: './student-assignments.component.html',
  styleUrls: ['./student-assignments.component.css']
})
export class StudentAssignmentsComponent implements OnInit {
  assignments: StudentAssignment[] = [];
  filteredAssignments: StudentAssignment[] = [];
  loading = false;
  studentClassId: number | null = null;
  studentId: number | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private message: NzMessageService,
    private assignmentService: AssignmentService
  ) {}

  ngOnInit(): void {
    // Check if we're in class context (route: /classes/:id/assignments)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.studentClassId = +params['id'];
      }
    });

    const userStr = localStorage.getItem('user');

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.studentId = user.student?.id || user.id || null;
        
        // Nếu chưa có classId từ route, lấy từ user data
        if (!this.studentClassId) {
          this.studentClassId = user.student?.classRoomId || user.classRoomId || user.classId || null;
        }

        if (!this.studentId) {
          this.message.error('Không tìm thấy thông tin học sinh');
          return;
        }

        this.loadAssignments();
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.message.error('Không thể lấy thông tin lớp học');
      }
    } else {
      this.message.warning('Vui lòng đăng nhập lại');
    }
  }

  loadAssignments(): void {
    this.loading = true;

    if (!this.studentClassId) {
      this.assignmentService.getMyAssignments().subscribe({
        next: (data) => {
          this.assignments = data;
          this.filteredAssignments = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load assignments:', err);
          this.assignments = [];
          this.filteredAssignments = [];
          this.loading = false;
          this.message.error('Không thể tải danh sách bài tập');
        }
      });
      return;
    }

    this.assignmentService.getStudentAssignments(this.studentClassId).subscribe({
      next: (data) => {
        this.assignments = data;
        this.filteredAssignments = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load assignments:', err);
        this.assignments = [];
        this.filteredAssignments = [];
        this.loading = false;
        this.message.error('Không thể tải danh sách bài tập');
      }
    });
  }

  viewDetail(assignment: StudentAssignment): void {
    // Navigate to detail page - check if we're in class context
    if (this.studentClassId) {
      this.router.navigate(['/student/classes', this.studentClassId, 'assignments', assignment.id]);
    } else {
      this.router.navigate(['/student/assignments', assignment.id]);
    }
  }

  getStatusColor(assignment: StudentAssignment): string {
    if (assignment.submitted && assignment.grade !== undefined) {
      return 'success';
    }
    if (assignment.submitted) {
      return 'processing';
    }
    if (this.isOverdue(assignment.dueDate)) {
      return 'error';
    }
    return 'warning';
  }

  getStatusText(assignment: StudentAssignment): string {
    if (assignment.submitted && assignment.grade !== undefined) {
      return `Đã chấm: ${assignment.grade}/10`;
    }
    if (assignment.submitted) {
      return 'Đã nộp';
    }
    if (this.isOverdue(assignment.dueDate)) {
      return 'Quá hạn';
    }
    return 'Chưa nộp';
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  getDaysLeft(dueDate: string): number {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Computed Properties for Statistics
  get totalAssignments(): number {
    return this.assignments.length;
  }

  get pendingAssignments(): number {
    return this.assignments.filter(a => !a.submitted && !this.isOverdue(a.dueDate)).length;
  }

  get submittedAssignments(): number {
    // Đếm TẤT CẢ bài đã nộp (bao gồm cả đã chấm và chưa chấm)
    return this.assignments.filter(a => a.submitted).length;
  }

  get gradedAssignments(): number {
    // Đếm bài đã được chấm điểm
    return this.assignments.filter(a => a.submitted && a.grade !== undefined && a.grade !== null).length;
  }
}
