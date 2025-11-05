import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

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

import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSelectModule } from 'ng-zorro-antd/select';

// Components
import { TeacherLayoutComponent } from './teacher-layout/teacher-layout.component';
import { TeacherDashboardComponent } from './dashboard/dashboard.component';
import { TeacherScheduleComponent } from './pages/schedule/teacher-schedule.component';
import { TeacherClassesComponent } from './pages/classes/teacher-classes.component';
import { ClassOverviewComponent } from './pages/classes/class-overview/class-overview.component';
import { ClassStudentsComponent } from './pages/classes/class-students/class-students.component';
import { ClassAssignmentsComponent } from './pages/classes/class-assignments/class-assignments.component';
import { ClassMaterialsComponent } from './pages/classes/class-materials/class-materials.component';
import { AssignmentDetailComponent } from './pages/classes/assignment-detail/assignment-detail.component';
import { ClassAttendanceComponent } from './pages/attendance/class-attendance.component';
import { StudentDetailComponent } from './pages/students/student-detail/student-detail.component';
import { ClassAnnouncementsComponent } from './pages/announcements/class-announcements.component';
import { TeacherNotificationsComponent } from './pages/notifications/notifications.component';

// Routes
import { TEACHER_ROUTES } from './teacher.routes';

@NgModule({
  declarations: [
    TeacherLayoutComponent,
    TeacherDashboardComponent,
    TeacherScheduleComponent,
    TeacherClassesComponent,
    ClassOverviewComponent,
    ClassStudentsComponent,
    ClassAssignmentsComponent,
    ClassMaterialsComponent,
    AssignmentDetailComponent,
    ClassAttendanceComponent,
    StudentDetailComponent,
    ClassAnnouncementsComponent,
    TeacherNotificationsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(TEACHER_ROUTES),
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
    NzBadgeModule,
    NzEmptyModule,
    NzMessageModule,
    NzSpinModule,
    NzModalModule,
    NzCheckboxModule,
    NzToolTipModule,
    NzInputNumberModule,
    NzInputModule,
    NzDatePickerModule,
    NzPageHeaderModule,
    NzDividerModule,
    NzDescriptionsModule,
    NzTabsModule,
    NzFormModule,
    NzAlertModule,
    NzSelectModule
  ]
})
export class TeacherModule { }
