import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AttendanceService } from '../../../../core/services/attendance.service';
import { ClassService } from '../../../../core/services/class.service';
import { TeacherService } from '../../../../core/services/teacher.service';
import { ScheduleService } from '../../../../core/services/schedule.service';
import {
  AttendanceStatus,
  StudentAttendanceRow,
  AttendanceSessionDto,
  Attendance
} from '../../../../core/models/attendance.model';
import { Class } from '../../../../core/models/class.model';

@Component({
  selector: 'app-class-attendance',
  templateUrl: './class-attendance.component.html',
  styleUrls: ['./class-attendance.component.css']
})
export class ClassAttendanceComponent implements OnInit {
  classId!: number;
  classInfo?: Class;
  selectedDate: Date = new Date();
  loading = false;
  saving = false;

  students: StudentAttendanceRow[] = [];
  existingAttendance: Attendance[] = [];
  isEditMode = false;
  hasScheduleToday = false; // Kiểm tra có lịch học không
  scheduleCheckLoading = false;

  AttendanceStatus = AttendanceStatus;

  // Summary
  summary = {
    present: 0,
    absent: 0,
    late: 0,
    total: 0
  };

  constructor(
    private route: ActivatedRoute,
    private attendanceService: AttendanceService,
    private classService: ClassService,
    private teacherService: TeacherService,
    private scheduleService: ScheduleService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.classId = +params['id'];
      this.loadClassInfo();
      this.loadAttendanceForDate();
    });
  }

  loadClassInfo(): void {
    this.classService.getClass(this.classId).subscribe({
      next: (data) => {
        this.classInfo = data;
      },
      error: (err) => {
        console.error('Failed to load class info:', err);
        this.message.error('Không thể tải thông tin lớp học');
      }
    });
  }

  loadAttendanceForDate(): void {
    if (!this.selectedDate) return;

    this.loading = true;
    const dateString = this.formatDate(this.selectedDate);
    const isToday = this.isToday(this.selectedDate);

    // Kiểm tra lịch học trước khi load điểm danh
    if (isToday) {
      this.checkScheduleForToday();
    } else {
      this.checkScheduleForDate(dateString);
    }
  }

  // Kiểm tra lịch học hôm nay
  checkScheduleForToday(): void {
    this.scheduleCheckLoading = true;
    
    this.scheduleService.getClassScheduleToday(this.classId).subscribe({
      next: (schedule) => {
        console.log('Lịch học hôm nay:', schedule);
        
        if (!schedule || schedule.length === 0) {
          this.hasScheduleToday = false;
          this.students = [];
          this.loading = false;
          this.scheduleCheckLoading = false;
          this.message.warning('Hôm nay lớp này không có lịch học');
          return;
        }

        this.hasScheduleToday = true;
        this.scheduleCheckLoading = false;
        this.loadExistingAttendance();
      },
      error: (err) => {
        console.error('Failed to check schedule:', err);
        this.hasScheduleToday = false;
        this.scheduleCheckLoading = false;
        this.loading = false;
        
        if (err.status === 404) {
          this.message.warning('Hôm nay lớp này không có lịch học');
        } else {
          this.message.error('Không thể kiểm tra lịch học');
        }
      }
    });
  }

  // Kiểm tra lịch học cho ngày cụ thể
  checkScheduleForDate(dateString: string): void {
    this.scheduleCheckLoading = true;
    
    this.scheduleService.getClassScheduleByDate(this.classId, dateString).subscribe({
      next: (schedule) => {
        console.log('Lịch học ngày', dateString, ':', schedule);
        
        if (!schedule || schedule.length === 0) {
          this.hasScheduleToday = false;
          this.students = [];
          this.loading = false;
          this.scheduleCheckLoading = false;
          this.message.warning(`Ngày ${dateString} lớp này không có lịch học`);
          return;
        }

        this.hasScheduleToday = true;
        this.scheduleCheckLoading = false;
        this.loadExistingAttendance();
      },
      error: (err) => {
        console.error('Failed to check schedule:', err);
        this.hasScheduleToday = false;
        this.scheduleCheckLoading = false;
        this.loading = false;
        
        if (err.status === 404) {
          this.message.warning(`Ngày ${dateString} lớp này không có lịch học`);
        } else {
          this.message.error('Không thể kiểm tra lịch học');
        }
      }
    });
  }

  // Load điểm danh đã có (nếu có)
  loadExistingAttendance(): void {
    const dateString = this.formatDate(this.selectedDate);

    // Load existing attendance
    this.attendanceService.getByClassAndDate(this.classId, dateString).subscribe({
      next: (attendance) => {
        this.existingAttendance = attendance;
        this.isEditMode = attendance.length > 0;

        // Load class students
        this.loadClassStudents();
      },
      error: (err) => {
        console.error('Failed to load attendance:', err);

        // Even if no attendance exists, still load students
        this.existingAttendance = [];
        this.isEditMode = false;
        this.loadClassStudents();
      }
    });
  }

  loadClassStudents(): void {
    // Use TeacherService to get students by class (có quyền cho giáo viên)
    console.log('Loading students for class:', this.classId);

    this.teacherService.getStudentsByClass(this.classId).subscribe({
      next: (studentDetails: any[]) => {
        console.log('Student details loaded:', studentDetails);

        if (!studentDetails || studentDetails.length === 0) {
          this.students = [];
          this.loading = false;
          this.message.warning('Lớp học chưa có học sinh');
          return;
        }

        this.students = studentDetails.map(student => {
          // Find existing attendance for this student
          const existing = this.existingAttendance.find(a => a.student.id === student.id);

          return {
            studentId: student.id,
            studentName: student.fullName || student.name || student.ten || 'N/A',
            studentEmail: student.email || '',
            status: existing?.status || AttendanceStatus.PRESENT,
            note: existing?.note || ''
          };
        });

        console.log('Students ready for attendance:', this.students);
        this.summary.total = this.students.length;
        this.calculateSummary();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load students:', err);
        this.loading = false;

        if (err.status === 403) {
          this.message.error('Bạn không có quyền xem danh sách học sinh của lớp này');
        } else if (err.status === 404) {
          this.message.warning('Không tìm thấy học sinh trong lớp này');
        } else {
          this.message.error('Không thể tải danh sách học sinh: ' + (err.message || err.statusText || 'Lỗi không xác định'));
        }
      }
    });
  }

  onDateChange(date: Date): void {
    this.selectedDate = date;
    this.loadAttendanceForDate();
  }

  setStatus(student: StudentAttendanceRow, status: AttendanceStatus): void {
    student.status = status;
    this.calculateSummary();
  }

  calculateSummary(): void {
    this.summary.present = this.students.filter(s => s.status === AttendanceStatus.PRESENT).length;
    this.summary.absent = this.students.filter(s => s.status === AttendanceStatus.ABSENT).length;
    this.summary.late = this.students.filter(s => s.status === AttendanceStatus.LATE).length;
  }

  saveAttendance(): void {
    if (!this.selectedDate || this.students.length === 0) {
      this.message.warning('Không có dữ liệu để lưu');
      return;
    }

    if (!this.hasScheduleToday) {
      this.message.warning('Không thể điểm danh vì không có lịch học');
      return;
    }

    this.saving = true;
    const dateString = this.formatDate(this.selectedDate);
    const isToday = this.isToday(this.selectedDate);

    const attendanceData = {
      classId: this.classId,
      items: this.students.map(s => ({
        studentId: s.studentId,
        status: s.status,
        note: s.note
      }))
    };

    // Nếu là hôm nay, dùng API /today
    if (isToday) {
      this.attendanceService.createSessionToday(attendanceData).subscribe({
        next: (response) => {
          this.handleSaveSuccess(response);
        },
        error: (err) => {
          // Nếu lỗi 409 (conflict), nghĩa là đã có điểm danh, dùng PUT để thay thế
          if (err.status === 409) {
            this.replaceAttendanceSession(dateString, attendanceData.items);
          } else {
            this.handleSaveError(err);
          }
        }
      });
    } else {
      // Ngày khác, dùng API session với date
      const sessionDto: AttendanceSessionDto = {
        classId: this.classId,
        sessionDate: dateString,
        items: attendanceData.items
      };

      const saveObservable = this.isEditMode
        ? this.attendanceService.replaceSession(sessionDto)
        : this.attendanceService.createSession(sessionDto);

      saveObservable.subscribe({
        next: (response) => {
          this.handleSaveSuccess(response);
        },
        error: (err) => {
          this.handleSaveError(err);
        }
      });
    }
  }

  // Thay thế điểm danh khi đã tồn tại
  replaceAttendanceSession(dateString: string, items: any[]): void {
    const sessionDto = {
      classId: this.classId,
      sessionDate: dateString,
      items: items
    };

    this.attendanceService.replaceSession(sessionDto).subscribe({
      next: (response) => {
        this.handleSaveSuccess(response);
      },
      error: (err) => {
        this.handleSaveError(err);
      }
    });
  }

  handleSaveSuccess(response: any): void {
    this.saving = false;
    this.message.success(this.isEditMode ? 'Cập nhật điểm danh thành công' : 'Lưu điểm danh thành công');
    this.isEditMode = true;
    this.existingAttendance = response.attendance || [];

    // Update summary from server response
    if (response.summary) {
      this.summary.present = response.summary.present || 0;
      this.summary.absent = response.summary.absent || 0;
      this.summary.late = response.summary.late || 0;
    }
  }

  handleSaveError(err: any): void {
    console.error('Failed to save attendance:', err);
    this.saving = false;

    if (err.status === 403) {
      this.message.error('Bạn không có quyền điểm danh lớp này');
    } else if (err.status === 400) {
      this.message.error('Dữ liệu không hợp lệ: ' + (err.error?.message || ''));
    } else if (err.status === 404) {
      this.message.error('Không tìm thấy lịch học cho ngày này');
    } else {
      this.message.error('Không thể lưu điểm danh: ' + (err.error?.message || err.message || ''));
    }
  }

  markAllPresent(): void {
    this.students.forEach(s => s.status = AttendanceStatus.PRESENT);
    this.calculateSummary();
  }

  markAllAbsent(): void {
    this.students.forEach(s => s.status = AttendanceStatus.ABSENT);
    this.calculateSummary();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
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
        return 'Vắng';
      case AttendanceStatus.LATE:
        return 'Muộn';
      default:
        return 'N/A';
    }
  }
}
