import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AssignmentService } from '../../../../core/services/assignment.service';

export interface StudentAssignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  createdAt: string;
  classId: number;
  fileUrl?: string;
  fileName?: string;
  submitted: boolean;
  submittedAt?: string;
  submittedFileUrl?: string;
  submittedFileName?: string;
  grade?: number;
  feedback?: string;
}

@Component({
  selector: 'app-student-assignments',
  templateUrl: './student-assignments.component.html',
  styleUrls: ['./student-assignments.component.css']
})
export class StudentAssignmentsComponent implements OnInit {
  assignments: StudentAssignment[] = [];
  loading = false;
  studentClassId: number | null = null;
  
  // Submit modal
  submitModalVisible = false;
  selectedAssignment: StudentAssignment | null = null;
  selectedFile: File | null = null;
  submitting = false;
  
  // View detail modal
  detailModalVisible = false;
  viewingAssignment: StudentAssignment | null = null;

  constructor(
    private message: NzMessageService,
    private modal: NzModalService,
    private assignmentService: AssignmentService
  ) {}

  ngOnInit(): void {
    // Get student's class ID
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.studentClassId = user.classRoomId || user.classId || null;
        
        if (this.studentClassId) {
          this.loadAssignments();
        } else {
          this.message.warning('Bạn chưa được phân lớp');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.message.error('Không thể lấy thông tin lớp học');
      }
    } else {
      this.message.warning('Vui lòng đăng nhập lại');
    }
  }

  loadAssignments(): void {
    if (!this.studentClassId) return;

    this.loading = true;
    this.assignmentService.getStudentAssignments(this.studentClassId).subscribe({
      next: (data) => {
        this.assignments = data.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          dueDate: item.dueDate,
          createdAt: item.createdAt || item.assignedDate,
          classId: this.studentClassId!,
          fileUrl: item.fileUrl,
          fileName: item.fileName,
          submitted: item.submitted || false,
          submittedAt: item.submittedAt,
          submittedFileUrl: item.submittedFileUrl,
          submittedFileName: item.submittedFileName,
          grade: item.grade,
          feedback: item.feedback
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load assignments:', err);
        this.assignments = [];
        this.loading = false;
        
        if (err.status === 403) {
          this.message.error('Bạn không có quyền truy cập');
        } else if (err.status === 404) {
          this.message.warning('Không tìm thấy bài tập');
        } else {
          this.message.error('Không thể tải danh sách bài tập');
        }
      }
    });
  }

  openSubmitModal(assignment: StudentAssignment): void {
    if (assignment.submitted) {
      this.message.info('Bạn đã nộp bài tập này rồi');
      return;
    }
    this.selectedAssignment = assignment;
    this.submitModalVisible = true;
    this.selectedFile = null;
  }

  closeSubmitModal(): void {
    this.submitModalVisible = false;
    this.selectedAssignment = null;
    this.selectedFile = null;
  }

  handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  submitAssignment(): void {
    if (!this.selectedFile || !this.selectedAssignment) {
      this.message.warning('Vui lòng chọn file để nộp');
      return;
    }

    this.submitting = true;
    
    this.assignmentService.submitAssignment(this.selectedAssignment.id, this.selectedFile).subscribe({
      next: () => {
        this.message.success('Nộp bài tập thành công');
        this.submitting = false;
        this.closeSubmitModal();
        this.loadAssignments();
      },
      error: (err) => {
        console.error('Submit failed:', err);
        this.submitting = false;
        
        if (err.status === 403) {
          this.message.error('Bạn không có quyền nộp bài');
        } else if (err.status === 404) {
          this.message.error('Không tìm thấy bài tập');
        } else if (err.status === 400) {
          this.message.error('File không hợp lệ hoặc quá hạn nộp bài');
        } else {
          this.message.error('Nộp bài tập thất bại');
        }
      }
    });
  }

  viewDetail(assignment: StudentAssignment): void {
    this.viewingAssignment = assignment;
    this.detailModalVisible = true;
  }

  closeDetailModal(): void {
    this.detailModalVisible = false;
    this.viewingAssignment = null;
  }

  downloadAssignment(assignment: StudentAssignment): void {
    if (!assignment.fileUrl) {
      this.message.warning('Không có file đính kèm');
      return;
    }
    this.message.info('Tải xuống: ' + assignment.fileName);
    // TODO: Implement download
  }

  downloadSubmittedFile(assignment: StudentAssignment): void {
    if (!assignment.submittedFileUrl) {
      this.message.warning('Không có file đã nộp');
      return;
    }
    this.message.info('Tải xuống: ' + assignment.submittedFileName);
    // TODO: Implement download
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
}
