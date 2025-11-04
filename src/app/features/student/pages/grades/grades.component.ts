import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AssignmentService, MySubmissionResponse } from '../../../../core/services/assignment.service';

interface GradeStatistics {
  totalGraded: number;
  averageGrade: number;
  highestGrade: number;
  lowestGrade: number;
}

@Component({
  selector: 'app-grades',
  templateUrl: './grades.component.html',
  styleUrls: ['./grades.component.css']
})
export class GradesComponent implements OnInit {
  submissions: MySubmissionResponse[] = [];
  loading = false;
  studentId: number | null = null;
  classId: number | null = null;
  statistics: GradeStatistics = {
    totalGraded: 0,
    averageGrade: 0,
    highestGrade: 0,
    lowestGrade: 0
  };

  constructor(
    private route: ActivatedRoute,
    private assignmentService: AssignmentService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    // Get classId from route (if available)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.classId = +params['id'];
      }
    });

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.studentId = user.student?.id || user.id || null;

        if (this.studentId) {
          this.loadGradeHistory();
        } else {
          this.message.error('Không tìm thấy thông tin học sinh');
        }
      } catch (error) {
        console.error('Error parsing user:', error);
        this.message.error('Lỗi tải thông tin người dùng');
      }
    }
  }

  loadGradeHistory(): void {
    this.loading = true;
    // Sử dụng API: GET /submissions/me (đã có assignmentTitle)
    this.assignmentService.getMySubmissions().subscribe({
      next: (allSubmissions) => {
        // Lọc ra các submission đã được chấm điểm
        this.submissions = allSubmissions.filter(s =>
          s.grade !== null && s.grade !== undefined
        );

        this.calculateStatistics();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load grade history:', err);
        this.message.error('Không thể tải lịch sử điểm');
        this.loading = false;
      }
    });
  }

  calculateStatistics(): void {
    const gradedSubmissions = this.submissions.filter(s => s.grade !== null && s.grade !== undefined);

    if (gradedSubmissions.length === 0) {
      this.statistics = {
        totalGraded: 0,
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 0
      };
      return;
    }

    const grades = gradedSubmissions.map(s => s.grade!);
    const sum = grades.reduce((acc, grade) => acc + grade, 0);

    this.statistics = {
      totalGraded: gradedSubmissions.length,
      averageGrade: Math.round((sum / gradedSubmissions.length) * 10) / 10,
      highestGrade: Math.max(...grades),
      lowestGrade: Math.min(...grades)
    };
  }

  getGradeColor(grade: number): string {
    if (grade >= 8) return 'success';
    if (grade >= 6.5) return 'processing';
    if (grade >= 5) return 'warning';
    return 'error';
  }

  getGradeLabel(grade: number): string {
    if (grade >= 8) return 'Giỏi';
    if (grade >= 6.5) return 'Khá';
    if (grade >= 5) return 'Trung bình';
    return 'Yếu';
  }
}
