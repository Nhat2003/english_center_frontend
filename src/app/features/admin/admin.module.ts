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
import { StudentsComponent } from './pages/students/students.component';
import { StudentsFormComponent } from './pages/students/students-form/students-form.component';
import { TeachersFormComponent } from './pages/teachers/teachers-form/teachers-form.component';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CoursesFormComponent } from './pages/courses/courses-form/courses-form.component';
import { ClassesFormComponent } from './pages/classes/classes-form/classes-form.component';
import { NzMessageModule } from 'ng-zorro-antd/message';
@NgModule({
  declarations: [
    UserListComponent,
    CoursesComponent,
    ClassesComponent,
    StatsComponent,
    TeachersComponent,
    EditUserComponent,
    AddUserComponent,
    StudentsComponent,
    StudentsFormComponent,
    TeachersFormComponent,
    CoursesFormComponent,
    ClassesFormComponent

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
    AdminLayoutModule,
    NzMessageModule,
    RouterModule.forChild(ADMIN_ROUTES)
  ]
})
export class AdminModule {}
