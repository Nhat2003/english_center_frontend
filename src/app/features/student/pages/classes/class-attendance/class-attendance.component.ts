import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AttendanceService } from '../../../../../core/services/attendance.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { Attendance, AttendanceStatus } from '../../../../../core/models/attendance.model';

interface AttendanceStatistics {
  total: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
}

@Component({
  selector: 'app-class-attendance',
  templateUrl: './class-attendance.component.html',
  styleUrls: ['./class-attendance.component.css']
})
export class ClassAttendanceComponent implements OnInit {
  classId: number | null = null;
  studentId: number | null = null;
  attendanceRecords: Attendance[] = [];
  loading = false;
  statistics: AttendanceStatistics = {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendanceRate: 0
  };

  constructor(
    private route: ActivatedRoute,
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    // Get classId from route parameter
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.classId = +id;
      }
    });

    // Get current user's student ID
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.student?.id) {
      this.studentId = currentUser.student.id;
      this.loadAttendanceHistory();
    } else {
      this.message.error('Không tìm thấy thông tin học sinh');
    }
  }

  loadAttendanceHistory(): void {
    if (!this.studentId) {
      this.message.error('Không tìm thấy thông tin học sinh');
      return;
    }

    this.loading = true;
    this.attendanceService.getByStudent(this.studentId).subscribe({
      next: (records) => {
        // Lọc theo classId nếu có
        if (this.classId) {
          this.attendanceRecords = records.filter(r => r.classRoom?.id === this.classId);
        } else {
          this.attendanceRecords = records;
        }

        // Sắp xếp theo ngày mới nhất trước
        this.attendanceRecords.sort((a, b) => {
          return new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime();
        });

        this.calculateStatistics();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load attendance history:', err);
        this.loading = false;

        if (err.status === 403) {
          this.message.error('Bạn không có quyền xem lịch sử điểm danh này');
        } else if (err.status === 404) {
          this.message.warning('Không tìm thấy lịch sử điểm danh');
        } else {
          this.message.error('Không thể tải lịch sử điểm danh');
        }
      }
    });
  }

  calculateStatistics(): void {
    if (this.attendanceRecords.length === 0) {
      this.statistics = {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        attendanceRate: 0
      };
      return;
    }

    const present = this.attendanceRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const absent = this.attendanceRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const late = this.attendanceRecords.filter(r => r.status === AttendanceStatus.LATE).length;
    const total = this.attendanceRecords.length;

    this.statistics = {
      total,
      present,
      absent,
      late,
      attendanceRate: Math.round(((present + late) / total) * 100 * 10) / 10
    };
  }

  getStatusColor(status: AttendanceStatus): string {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'success';
      case AttendanceStatus.ABSENT:
        return 'error';
      case AttendanceStatus.LATE:
        return 'warning';
      default:
        return 'default';
    }
  }

  getStatusText(status: AttendanceStatus): string {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'Có mặt';
      case AttendanceStatus.ABSENT:
        return 'Vắng mặt';
      case AttendanceStatus.LATE:
        return 'Đi muộn';
      default:
        return status;
    }
  }

  getStatusIcon(status: AttendanceStatus): string {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'check-circle';
      case AttendanceStatus.ABSENT:
        return 'close-circle';
      case AttendanceStatus.LATE:
        return 'clock-circle';
      default:
        return 'question-circle';
    }
  }
}
