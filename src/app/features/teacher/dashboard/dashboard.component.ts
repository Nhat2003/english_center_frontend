import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './dashboard.component.html',

})
export class TeacherDashboardComponent {
  classes = [
    { name: 'Lớp A1', students: 15 },
    { name: 'Lớp B1', students: 10 }
  ];
}
