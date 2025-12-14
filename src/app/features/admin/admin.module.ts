import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { ReactiveFormsModule } from '@angular/forms';
import { ADMIN_ROUTES } from './admin.routes';
import { AdminLayoutModule } from './admin-layout/admin-layout.module';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { UserListComponent } from './pages/users/user-list/user-list.component';
import { CoursesComponent } from './pages/courses/courses.component';
import { ClassesComponent } from './pages/classes/classes.component';
import { StatsComponent } from './pages/stats/stats.component';
import { TeachersComponent } from './pages/teachers/teachers.component';
import { EditUserComponent } from './pages/users/edit-user/edit-user.component';
import { AddUserComponent } from './pages/users/add-user/add-user.component';
import { ViewUserComponent } from './pages/users/view-user/view-user.component';
import { StudentsComponent } from './pages/students/students.component';
import { StudentsFormComponent } from './pages/students/students-form/students-form.component';
import { TeachersFormComponent } from './pages/teachers/teachers-form/teachers-form.component';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { CoursesFormComponent } from './pages/courses/courses-form/courses-form.component';
import { ClassesFormComponent } from './pages/classes/classes-form/classes-form.component';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { SchedulesComponent } from './pages/schedules/schedules.component';
import { SchedulesFormComponent } from './pages/schedules/schedules-form/schedules-form.component';
import { ImportStudentsComponent } from './pages/students/import-students/import-students.component';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { PaymentListComponent } from './pages/payments/payment-list/payment-list.component';
import { AddPaymentComponent } from './pages/payments/add-payment/add-payment.component';
import { PaymentDetailComponent } from './pages/payments/payment-detail/payment-detail.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { ClassPaymentsComponent } from './pages/payments/class-payments/class-payments.component';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzRadioModule } from 'ng-zorro-antd/radio';

@NgModule({
  declarations: [
    UserListComponent,
    CoursesComponent,
    ClassesComponent,
    StatsComponent,
    TeachersComponent,
    EditUserComponent,
    AddUserComponent,
    ViewUserComponent,
    StudentsComponent,
    StudentsFormComponent,
    TeachersFormComponent,
    CoursesFormComponent,
    ClassesFormComponent,
    SchedulesComponent,
    SchedulesFormComponent,
    ImportStudentsComponent,
    PaymentListComponent,
    AddPaymentComponent,
    PaymentDetailComponent,
    PaymentsComponent,
    ClassPaymentsComponent

  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzPaginationModule,
    NzTagModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzGridModule,
    NzCheckboxModule,
    NzSpinModule,
    NzToolTipModule,
    NzDropDownModule,
    NzAvatarModule,
    NzLayoutModule,
    NzMenuModule,
    AdminLayoutModule,
    NzMessageModule,
    NzUploadModule,
    NzProgressModule,
    NzStepsModule,
    NzAlertModule,
    NzCollapseModule,
    NzCardModule,
    NzStatisticModule,
    NzInputNumberModule,
    NzDescriptionsModule,
    NzTimelineModule,
    NzDividerModule,
    NzDatePickerModule,
    NzEmptyModule,
    NzTabsModule,
    NzRadioModule,
    RouterModule.forChild(ADMIN_ROUTES)
  ]
})
export class AdminModule {}
