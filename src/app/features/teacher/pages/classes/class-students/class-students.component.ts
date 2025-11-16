import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TeacherService } from '../../../../../core/services/teacher.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-class-students',
  templateUrl: './class-students.component.html',
  styleUrls: ['./class-students.component.css']
})
export class ClassStudentsComponent implements OnInit {
  classId: number | null = null;
  students: any[] = [];
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private teacherService: TeacherService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.classId = +params['id'];
      if (this.classId) {
        this.loadStudents();
      }
    });
  }

  loadStudents(): void {
    this.loading = true;
    this.teacherService.getStudentsByClass(this.classId).subscribe({
      next: (data) => {
        this.students = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.message.error('Không thể tải danh sách học sinh.');
      }
    });
  }
}
