import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AssignmentService, AssignmentDetail, Submission } from '../../../../../core/services/assignment.service';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-assignment-detail',
  templateUrl: './assignment-detail.component.html',
  styleUrls: ['./assignment-detail.component.css']
})
export class AssignmentDetailComponent implements OnInit {
  assignmentId: number | null = null;
  assignment: AssignmentDetail | null = null;
  loading = false;
  baseUrl = environment.apiUrl;

  // Grading modal
  gradingVisible = false;
  selectedSubmission: Submission | null = null;
  gradeForm = {
    grade: null as number | null,
    feedback: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private assignmentService: AssignmentService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.assignmentId = +params['assignmentId'];
      if (this.assignmentId) {
        this.loadAssignmentDetail();
      }
    });
  }

  loadAssignmentDetail(): void {
    this.loading = true;
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    this.assignmentService.getAssignmentDetail(this.assignmentId!).subscribe({
      next: (data) => {
        console.log('Assignment detail loaded:', data);
        this.assignment = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load assignment detail:', err);
        this.message.error('Không thể tải thông tin bài tập');
        this.loading = false;
      }
    });
  }

  getSubmittedCount(): number {
    return this.assignment?.submissions.length || 0;
  }

  getTotalStudents(): number {
    return this.assignment?.classRoom?.students?.length || 0;
  }

  getGradedCount(): number {
    return this.assignment?.submissions.filter(s => s.grade !== null).length || 0;
  }

  getAverageGrade(): number {
    const graded = this.assignment?.submissions.filter(s => s.grade !== null) || [];
    if (graded.length === 0) return 0;
    const sum = graded.reduce((acc, s) => acc + (s.grade || 0), 0);
    return Math.round((sum / graded.length) * 10) / 10;
  }

  getFileUrl(url: string): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${this.baseUrl}${url}`;
  }

  downloadFile(url: string): void {
    window.open(this.getFileUrl(url), '_blank');
  }

  openGradingModal(submission: Submission): void {
    this.selectedSubmission = submission;
    this.gradeForm = {
      grade: submission.grade,
      feedback: submission.feedback || ''
    };
    this.gradingVisible = true;
  }

  closeGradingModal(): void {
    this.gradingVisible = false;
    this.selectedSubmission = null;
    this.gradeForm = {
      grade: null,
      feedback: ''
    };
  }

  submitGrade(): void {
    if (this.gradeForm.grade === null || this.gradeForm.grade < 0 || this.gradeForm.grade > 10) {
      this.message.warning('Vui lòng nhập điểm hợp lệ (0-10)');
      return;
    }

    const gradeData = {
      grade: this.gradeForm.grade,
      feedback: this.gradeForm.feedback || null
    };

    console.log('Submitting grade:', gradeData);

    this.assignmentService.gradeSubmission(this.selectedSubmission!.id, gradeData).subscribe({
      next: (response) => {
        console.log('Grade response:', response);
        this.message.success('Chấm điểm thành công');
        this.closeGradingModal();
        this.loadAssignmentDetail();
      },
      error: (err) => {
        console.error('Failed to grade submission:', err);
        this.message.error('Không thể chấm điểm');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/teacher/classes', this.assignment?.classRoom.id, 'assignments']);
  }

  deleteSubmission(submission: Submission): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa bài nộp của ${submission.student.fullName}?`,
      nzOkText: 'Xóa',
      nzOkType: 'danger',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.message.info('Chức năng đang phát triển');
      }
    });
  }
}
