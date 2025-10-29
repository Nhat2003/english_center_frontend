import { Component, OnInit } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
import { TeacherService } from '../../../../core/services/teacher.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-teacher-classes',
  templateUrl: './teacher-classes.component.html',
  styleUrls: ['./teacher-classes.component.css']
})
export class TeacherClassesComponent implements OnInit {
  teacherId: number | null = null;
  classes: any[] = [];
  loadingClasses = false;
  selectedClass: any = null;
  students: any[] = [];
  loadingStudents = false;
  isStudentModalVisible = false;

  constructor(
  private teacherService: TeacherService,
    private authService: AuthService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.teacherId = user?.teacher?.id || null;
    if (this.teacherId) {
      this.loadClasses();
    } else {
      this.message.error('Không tìm thấy thông tin giáo viên.');
    }
  }

  loadClasses(): void {
    this.loadingClasses = true;
  this.teacherService.getClassesByTeacher(this.teacherId).subscribe({
      next: (data) => {
        this.classes = data;
        this.loadingClasses = false;
      },
      error: () => {
        this.loadingClasses = false;
        this.message.error('Không thể tải danh sách lớp.');
      }
    });
  }

  selectClass(classRoom: any): void {
    this.selectedClass = classRoom;
    this.isStudentModalVisible = true;
    this.loadingStudents = true;
    this.teacherService.getStudentsByClass(classRoom.id).subscribe({
      next: (data) => {
        this.students = data;
        console.log('Danh sách sinh viên:', this.students);
        this.loadingStudents = false;
      },
      error: () => {
        this.loadingStudents = false;
        this.message.error('Không thể tải danh sách học sinh.');
      }
    });
  }

  closeStudentModal(): void {
    this.isStudentModalVisible = false;
    this.selectedClass = null;
    this.students = [];
    this.loadingStudents = false;
  }
}

