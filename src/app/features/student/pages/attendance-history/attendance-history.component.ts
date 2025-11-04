import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { Attendance, AttendanceStatus } from '../../../../core/models/attendance.model';

interface AttendanceStatistics {
  total: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
}

@Component({
  selector: 'app-attendance-history',
  templateUrl: './attendance-history.component.html',
  styleUrls: ['./attendance-history.component.css']
})
export class AttendanceHistoryComponent implements OnInit {
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
    private attendanceService: AttendanceService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadAttendanceHistory();
  }

  loadAttendanceHistory(): void {
    this.loading = true;
    this.attendanceService.getMyAttendance().subscribe({
      next: (records) => {
        this.attendanceRecords = records.sort((a, b) => {
          // Sắp xếp theo ngày mới nhất trước
          return new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime();
        });
        this.calculateStatistics();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load attendance history:', err);
        this.message.error('Không thể tải lịch sử điểm danh');
        this.loading = false;
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
