import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ClassService } from '../../../../../core/services/class.service';

interface ScheduleSession {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  sessionIndex?: number;
  totalSessions?: number;
  className?: string;
  courseName?: string;
  roomName?: string;
  time?: string;
  topic?: string;
}

@Component({
  selector: 'app-edit-schedule',
  templateUrl: './edit-schedule.component.html',
  styleUrls: ['./edit-schedule.component.css']
})
export class EditScheduleComponent implements OnInit {
  rescheduleForm: FormGroup;

  step = 1;
  classId: number | null = null;
  selectedSession: ScheduleSession | null = null;
  sessions: ScheduleSession[] = [];
  isLoading = false;
  isSubmitting = false;
  success = false;

  constructor(
    private fb: FormBuilder,
    private classService: ClassService,
    private message: NzMessageService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.rescheduleForm = this.fb.group({
      newDate: [null, Validators.required],
      newStartTime: [null, Validators.required],
      newEndTime: [null, Validators.required],
      reason: [null, Validators.required],
      notifyStudents: [true]
    });
  }

  ngOnInit(): void {
    // Get classId from route params
    this.route.params.subscribe(params => {
      this.classId = params['classId'];
      if (this.classId) {
        this.loadSessions();
      }
    });
  }

  loadSessions(): void {
    if (!this.classId) return;

    this.isLoading = true;
    this.classService.getUpcomingSchedules(this.classId).subscribe({
      next: (data) => {
        this.isLoading = false;
        // Map API response to ScheduleSession format
        this.sessions = data.map((session: any) => {
          const startTime = session.start ? new Date(session.start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
          const endTime = session.end ? new Date(session.end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

          return {
            id: session.id,
            title: session.title,
            date: session.date,
            start: session.start,
            end: session.end,
            sessionIndex: session.sessionIndex,
            totalSessions: session.totalSessions,
            className: session.className,
            courseName: session.courseName,
            roomName: session.roomName,
            time: `${startTime} - ${endTime}`,
            topic: session.title
          };
        });

        if (this.sessions.length === 0) {
          console.warn('No sessions found for class:', this.classId);
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading sessions:', error);
        this.message.error('Không thể tải danh sách buổi học');

        // Fallback to mock data for testing
        this.sessions = [
          {
            id: 'class-1-2025-12-10',
            title: 'Buổi 8 - TOEIC A26',
            date: '2025-12-10',
            start: '2025-12-10T18:00:00+07:00',
            end: '2025-12-10T20:00:00+07:00',
            time: '18:00 - 20:00',
            topic: 'Buổi 8 - TOEIC A26',
            sessionIndex: 8,
            totalSessions: 10,
            className: 'TOEIC A26',
            courseName: 'TOEIC 2KN',
            roomName: 'A101'
          },
          {
            id: 'class-1-2025-12-12',
            title: 'Buổi 9 - TOEIC A26',
            date: '2025-12-12',
            start: '2025-12-12T18:00:00+07:00',
            end: '2025-12-12T20:00:00+07:00',
            time: '18:00 - 20:00',
            topic: 'Buổi 9 - TOEIC A26',
            sessionIndex: 9,
            totalSessions: 10,
            className: 'TOEIC A26',
            courseName: 'TOEIC 2KN',
            roomName: 'A101'
          },
          {
            id: 'class-1-2025-12-15',
            title: 'Buổi 10 - TOEIC A26',
            date: '2025-12-15',
            start: '2025-12-15T18:00:00+07:00',
            end: '2025-12-15T20:00:00+07:00',
            time: '18:00 - 20:00',
            topic: 'Buổi 10 - TOEIC A26',
            sessionIndex: 10,
            totalSessions: 10,
            className: 'TOEIC A26',
            courseName: 'TOEIC 2KN',
            roomName: 'A101'
          }
        ];
      }
    });
  }

  selectSession(session: ScheduleSession): void {
    this.selectedSession = session;
    this.step = 2;
    // Reset form
    this.rescheduleForm.reset({
      reason: '',
      notifyStudents: true
    });
  }

  goBack(): void {
    if (this.step === 2) {
      this.step = 1;
      this.selectedSession = null;
      this.rescheduleForm.reset();
    } else {
      window.history.back();
    }
  }

  confirmChange(): void {
    if (!this.rescheduleForm.valid || !this.selectedSession || !this.classId) {
      this.message.warning('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    const formValue = this.rescheduleForm.value;
    const newDate = new Date(formValue.newDate);
    const newStartTime = formValue.newStartTime.split(':');
    const newEndTime = formValue.newEndTime.split(':');

    // Create ISO_LOCAL_DATE_TIME format strings
    const newStartDateTime = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}T${newStartTime[0]}:${newStartTime[1]}:00`;
    const newEndDateTime = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}T${newEndTime[0]}:${newEndTime[1]}:00`;

    this.isSubmitting = true;
    this.classService.rescheduleSession(
      this.classId,
      this.selectedSession.date,
      newStartDateTime,
      newEndDateTime,
      formValue.reason,
      formValue.notifyStudents
    ).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.success = true;
        this.message.success('Đổi lịch thành công!');
        // Update session in list
        if (this.selectedSession) {
          this.selectedSession.date = formValue.newDate;
          this.selectedSession.time = `${formValue.newStartTime} - ${formValue.newEndTime}`;
        }
        // Redirect after 2 seconds
        setTimeout(() => {
          this.resetForm();
          window.history.back();
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error rescheduling session:', error);
        this.message.error('Đổi lịch thất bại: ' + (error.error?.message || error.message));
      }
    });
  }

  resetForm(): void {
    this.step = 1;
    this.selectedSession = null;
    this.rescheduleForm.reset({ notifyStudents: true });
    this.success = false;
  }
}
