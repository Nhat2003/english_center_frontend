import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './dashboard.component.html',
})
export class StudentDashboardComponent {
  timetable = [
    { day: 'Thứ 2', time: '8:00 - 10:00', subject: 'Tiếng Anh A1' },
    { day: 'Thứ 4', time: '8:00 - 10:00', subject: 'Tiếng Anh A1' }
  ];
}
