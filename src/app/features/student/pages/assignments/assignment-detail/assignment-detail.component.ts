import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AssignmentService } from '../../../../../core/services/assignment.service';
import { StudentAssignment } from '../../../../../core/models/assignment.model';

@Component({
  selector: 'app-assignment-detail',
  templateUrl: './assignment-detail.component.html',
  styleUrls: ['./assignment-detail.component.css']
})
export class AssignmentDetailComponent implements OnInit {
  assignment: StudentAssignment | null = null;
  loading = false;
  submitting = false;
  studentId: number | null = null;

  // Submit form
  submissionContent = '';
  selectedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private message: NzMessageService,
    private assignmentService: AssignmentService
  ) {}

  ngOnInit(): void {
    // Get student ID from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.studentId = user.student?.id || user.id || null;
    }

    // Get assignment ID from route
    const assignmentId = this.route.snapshot.paramMap.get('id');
    if (assignmentId) {
      this.loadAssignmentDetail(+assignmentId);
    } else {
      this.message.error('Không tìm thấy bài tập');
      this.goBack();
    }
  }

  loadAssignmentDetail(id: number): void {
    this.loading = true;
    this.assignmentService.getAssignmentDetail(id).subscribe({
      next: (data) => {
        // Map AssignmentDetail to StudentAssignment
        const firstSubmission = data.submissions && data.submissions.length > 0 ? data.submissions[0] : null;

        this.assignment = {
          id: data.id,
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          createdAt: data.dueDate, // Fallback to dueDate
          fileUrl: data.fileUrl,
          originalFilename: data.originalFilename, // ⭐ Map originalFilename from assignment
          fileName: data.fileUrl ? this.getFileNameFromUrl(data.fileUrl) : undefined,
          classRoomId: data.classRoom.id,
          classRoom: data.classRoom,
          teacher: data.teacher,
          submissions: data.submissions || [],
          submitted: !!firstSubmission,
          submittedAt: firstSubmission?.submittedAt,
          submittedFileUrl: firstSubmission?.fileUrl,
          submittedFileName: firstSubmission?.originalFilename || (firstSubmission?.fileUrl ? this.getFileNameFromUrl(firstSubmission.fileUrl) : undefined),
          submittedContent: firstSubmission?.content, // ⭐ Map content from submission
          grade: firstSubmission?.grade !== null ? firstSubmission?.grade : undefined,
          feedback: firstSubmission?.feedback || undefined,
          hasFile: !!data.fileUrl,
          allowLateSubmission: true
        } as unknown as StudentAssignment;

        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load assignment:', err);
        this.message.error('Không thể tải chi tiết bài tập');
        this.loading = false;
        this.goBack();
      }
    });
  }

  private getFileNameFromUrl(url: string): string {
    return url.split('/').pop() || 'file';
  }

  handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.add('dragover');
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('dragover');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('dragover');

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  submitAssignment(): void {
    if (!this.assignment) return;

    if (!this.submissionContent && !this.selectedFile) {
      this.message.warning('Vui lòng nhập nội dung hoặc chọn file để nộp');
      return;
    }

    if (!this.studentId) {
      this.message.error('Không tìm thấy thông tin học sinh');
      return;
    }

    this.submitting = true;

    this.assignmentService.submitAssignment(
      this.assignment.id,
      this.studentId,
      this.selectedFile || undefined,
      this.submissionContent || undefined
    ).subscribe({
      next: (response) => {
        this.message.success('Nộp bài tập thành công!');
        this.submitting = false;
        // Reload assignment to show updated status
        this.loadAssignmentDetail(this.assignment!.id);
        // Clear form
        this.submissionContent = '';
        this.selectedFile = null;
      },
      error: (err) => {
        console.error('Submit failed:', err);
        this.submitting = false;
        if (err.status === 400) {
          this.message.error(err.error?.message || 'Không thể nộp bài. Vui lòng kiểm tra lại');
        } else {
          this.message.error('Nộp bài tập thất bại. Vui lòng thử lại');
        }
      }
    });
  }

  downloadAssignmentFile(): void {
    if (!this.assignment?.fileUrl) {
      this.message.warning('Không có file đính kèm');
      return;
    }

    // Use the download API instead of direct URL
    this.assignmentService.downloadAssignmentFile(this.assignment.id, this.assignment.originalFilename);
    this.message.info('Đang tải xuống file bài tập...');
  }

  downloadSubmittedFile(): void {
    if (!this.assignment?.submittedFileUrl) {
      this.message.warning('Không có file đã nộp');
      return;
    }

    // Get submission ID from assignment submissions
    const submission = this.assignment.submissions?.[0];
    if (submission?.id) {
      this.assignmentService.downloadSubmissionFile(submission.id, this.assignment.submittedFileName);
      this.message.info('Đang tải xuống file đã nộp...');
    } else {
      this.message.error('Không tìm thấy submission');
    }
  }

  getStatusColor(): string {
    if (!this.assignment) return 'default';
    if (this.assignment.submitted && this.assignment.grade !== undefined) {
      return 'success';
    }
    if (this.assignment.submitted) {
      return 'processing';
    }
    if (this.isOverdue()) {
      return 'error';
    }
    return 'warning';
  }

  getStatusText(): string {
    if (!this.assignment) return '';
    if (this.assignment.submitted && this.assignment.grade !== undefined) {
      return `Đã chấm: ${this.assignment.grade}/10`;
    }
    if (this.assignment.submitted) {
      return 'Đã nộp';
    }
    if (this.isOverdue()) {
      return 'Quá hạn';
    }
    return 'Chưa nộp';
  }

  isOverdue(): boolean {
    if (!this.assignment) return false;
    return new Date(this.assignment.dueDate) < new Date();
  }

  getDaysLeft(): number {
    if (!this.assignment) return 0;
    const now = new Date();
    const due = new Date(this.assignment.dueDate);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  canSubmit(): boolean {
    return !this.assignment?.submitted && !this.isOverdue();
  }

  goBack(): void {
    this.router.navigate(['/student/assignments']);
  }
}
