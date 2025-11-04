import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../../../core/services/auth.service';
import { StudentService } from '../../../../core/services/student.service';

@Component({
  selector: 'app-student-classes',
  templateUrl: './student-classes.component.html',
  styleUrls: ['./student-classes.component.css']
})
export class StudentClassesComponent implements OnInit {
  studentId: number | null = null;
  classes: any[] = [];
  loadingClasses = false;

  constructor(
    private authService: AuthService,
    private studentService: StudentService,
    private message: NzMessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.studentId = user?.student?.id || null;

    if (this.studentId) {
      this.loadClasses();
    } else {
      this.message.error('Không tìm thấy thông tin học sinh');
    }
  }

  loadClasses(): void {
    if (!this.studentId) return;

    this.loadingClasses = true;

    // Gọi API lấy danh sách lớp của học sinh
    this.studentService.getClassesByStudent(this.studentId).subscribe({
      next: (classes: any[]) => {
        console.log('Classes loaded for student:', classes);
        this.classes = classes;
        this.loadingClasses = false;
      },
      error: (err) => {
        console.error('Failed to load classes:', err);
        this.loadingClasses = false;

        if (err.status === 404) {
          this.message.warning('Bạn chưa được xếp vào lớp học nào');
        } else {
          this.message.error('Không thể tải danh sách lớp học');
        }
      }
    });
  }

  selectClass(classRoom: any): void {
    // Chuyển đến trang quản lý lớp - mặc định là overview
    this.router.navigate(['/student/classes', classRoom.id, 'overview']);
  }

  viewAnnouncements(classRoom: any): void {
    this.router.navigate(['/student/classes', classRoom.id, 'announcements']);
  }
}
