import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { UserListComponent } from './pages/users/user-list/user-list.component';
import { CoursesComponent } from './pages/courses/courses.component';
import { ClassesComponent } from './pages/classes/classes.component';
import { StatsComponent } from './pages/stats/stats.component';
import { TeachersComponent } from './pages/teachers/teachers.component';
import { EditUserComponent } from './pages/users/edit-user/edit-user.component';
import { AddUserComponent } from './pages/users/add-user/add-user.component';
import {StudentsComponent} from './pages/students/students.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    data: { breadcrumb: 'Admin' },
    children: [

      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', component: UserListComponent, data: { breadcrumb: 'Quản lí người dùng' } },
      { path: 'users/add', component: AddUserComponent, data: { breadcrumb: 'Thêm người dùng' } },
      { path: 'users/edit/:id', component: EditUserComponent, data: { breadcrumb: 'Chỉnh sửa người dùng' } },
      { path: 'teachers', component: TeachersComponent, data: { breadcrumb: 'Quản lí giáo viên' } },
      { path: 'students', component: StudentsComponent, data: { breadcrumb: 'Quản lí học sinh' } },
      { path: 'courses', component: CoursesComponent, data: { breadcrumb: 'Quản lí khóa học' } },
      { path: 'classes', component: ClassesComponent, data: { breadcrumb: 'Quản lí lớp học' } },
      { path: 'stats', component: StatsComponent, data: { breadcrumb: 'Thống kê' } }
    ]
  }
];
