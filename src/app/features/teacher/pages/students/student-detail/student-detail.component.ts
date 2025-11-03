import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { StudentService } from '../../../../../core/services/student.service';
import { StudentDetail } from '../../../../../core/models/student-detail.model';

@Component({
  selector: 'app-student-detail',
  templateUrl: './student-detail.component.html',
  styleUrls: ['./student-detail.component.css']
})
export class StudentDetailComponent implements OnInit {
  studentId!: number;
  studentDetail?: StudentDetail;
  loading = false;

  // Chart data for attendance summary
  attendanceChartData: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.studentId = +params['studentId'];
      if (this.studentId) {
        this.loadStudentDetail();
      }
    });
  }

  loadStudentDetail(): void {
    this.loading = true;
    this.studentService.getStudentDetail(this.studentId).subscribe({
      next: (data) => {
        this.studentDetail = data;
        this.loading = false;
        this.prepareChartData();
      },
      error: (err) => {
        console.error('Failed to load student detail:', err);
        this.loading = false;

        if (err.status === 403) {
          this.message.error('Bạn không có quyền xem thông tin học sinh này');
        } else if (err.status === 404) {
          this.message.error('Không tìm thấy học sinh');
        } else {
          this.message.error('Không thể tải thông tin học sinh');
        }
      }
    });
  }

  prepareChartData(): void {
    if (!this.studentDetail) return;

    const summary = this.studentDetail.attendanceSummary;
    this.attendanceChartData = [
      { name: 'Có mặt', value: summary.present, color: '#52c41a' },
      { name: 'Đi muộn', value: summary.late, color: '#faad14' },
      { name: 'Vắng mặt', value: summary.absent, color: '#ff4d4f' }
    ];
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PRESENT':
        return 'green';
      case 'LATE':
        return 'orange';
      case 'ABSENT':
        return 'red';
      default:
        return 'default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PRESENT':
        return 'Có mặt';
      case 'LATE':
        return 'Đi muộn';
      case 'ABSENT':
        return 'Vắng mặt';
      default:
        return status;
    }
  }

  getGradeColor(grade: number): string {
    if (grade >= 8) return '#52c41a';
    if (grade >= 6.5) return '#faad14';
    return '#ff4d4f';
  }

  calculateAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  getTotalAttendance(): number {
    if (!this.studentDetail) return 0;
    const s = this.studentDetail.attendanceSummary;
    return s.present + s.late + s.absent;
  }

  getAttendanceRate(): number {
    const total = this.getTotalAttendance();
    if (total === 0) return 0;

    const attended = this.studentDetail!.attendanceSummary.present +
                     this.studentDetail!.attendanceSummary.late;
    return Math.round((attended / total) * 100);
  }

  downloadSubmission(fileUrl: string): void {
    if (!fileUrl) {
      this.message.warning('Không có file để tải');
      return;
    }

    // Create download link
    const link = document.createElement('a');
    link.href = `http://localhost:8080${fileUrl}`;
    link.download = fileUrl.split('/').pop() || 'file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  goBack(): void {
    this.router.navigate(['../../students'], { relativeTo: this.route });
  }
}
