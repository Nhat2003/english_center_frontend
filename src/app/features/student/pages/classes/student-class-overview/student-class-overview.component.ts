import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ClassService } from '../../../../../core/services/class.service';
import { Class } from '../../../../../core/models/class.model';

@Component({
  selector: 'app-student-class-overview',
  templateUrl: './student-class-overview.component.html',
  styleUrls: ['./student-class-overview.component.css']
})
export class StudentClassOverviewComponent implements OnInit {
  classId!: number;
  classInfo?: Class;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private classService: ClassService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.classId = +params['id'];
      this.loadClassInfo();
    });
  }

  loadClassInfo(): void {
    this.loading = true;
    this.classService.getClass(this.classId).subscribe({
      next: (data) => {
        this.classInfo = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading class info:', err);
        this.message.error('Không thể tải thông tin lớp học');
        this.loading = false;
      }
    });
  }
}
