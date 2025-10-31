import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// ng-zorro modules
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCalendarModule } from 'ng-zorro-antd/calendar';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzModalModule } from 'ng-zorro-antd/modal';

// Components
import { StudentLayoutComponent } from './student-layout/student-layout.component';
import { StudentDashboardComponent } from './pages/dashboard/dashboard.component';
import { StudentScheduleComponent } from './pages/schedule/student-schedule.component';
import { StudentDocumentsComponent } from './pages/documents/student-documents.component';
import { StudentAssignmentsComponent } from './pages/assignments/student-assignments.component';

// Services
import { StudentScheduleService } from '../../core/services/student-schedule.service';

// Routes
import { STUDENT_ROUTES } from './student.routes';

@NgModule({
  declarations: [
    StudentLayoutComponent,
    StudentDashboardComponent,
    StudentScheduleComponent,
    StudentDocumentsComponent,
    StudentAssignmentsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forChild(STUDENT_ROUTES),
    // ng-zorro modules
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzBreadCrumbModule,
    NzCardModule,
    NzStatisticModule,
    NzGridModule,
    NzButtonModule,
    NzTableModule,
    NzTagModule,
    NzDropDownModule,
    NzAvatarModule,
    NzProgressModule,
    NzMessageModule,
    NzBadgeModule,
    NzInputModule,
    NzTimelineModule,
    NzDividerModule,
    NzEmptyModule,
    NzSpinModule,
    NzCalendarModule,
    NzToolTipModule,
    NzAlertModule,
    NzDescriptionsModule,
    NzModalModule
  ],
  providers: [
    StudentScheduleService
  ]
})
export class StudentModule { }
