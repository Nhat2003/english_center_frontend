import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClassService } from '../../../../../core/services/class.service';
import { TeacherService } from '../../../../../core/services/teacher.service';
import { AssignmentService } from '../../../../../core/services/assignment.service';
import { MaterialService } from '../../../../../core/services/material.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-class-overview',
  templateUrl: './class-overview.component.html',
  styleUrls: ['./class-overview.component.css']
})
export class ClassOverviewComponent implements OnInit {
  classId: number | null = null;
  classInfo: any = null;
  studentCount: number = 0;
  assignmentCount: number = 0;
  materialCount: number = 0;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private classService: ClassService,
    private teacherService: TeacherService,
    private assignmentService: AssignmentService,
    private materialService: MaterialService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.classId = +params['id'];
      if (this.classId) {
        this.loadClassDetails();
      }
    });
  }

  loadClassDetails(): void {
    this.loading = true;
    forkJoin({
      classInfo: this.classService.getClass(this.classId!),
      students: this.teacherService.getStudentsByClass(this.classId!),
      assignments: this.assignmentService.getAssignmentsByClass(this.classId!),
      materials: this.materialService.getMaterialsByClass(this.classId!)
    }).subscribe({
      next: (result) => {
        this.classInfo = result.classInfo;
        this.studentCount = result.students.length;
        this.assignmentCount = result.assignments.length;
        this.materialCount = result.materials.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load class details:', err);
        this.loading = false;
        this.message.error('Không thể tải thông tin lớp');
      }
    });
  }
}
