import { Routes } from '@angular/router';
import { TeacherLayoutComponent } from './teacher-layout/teacher-layout.component';
import { TeacherDashboardComponent } from './dashboard/dashboard.component';

export const TEACHER_ROUTES: Routes = [
  {
    path: '',
    component: TeacherLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: TeacherDashboardComponent },
      // Các route khác sẽ thêm sau
      { path: 'my-classes', component: TeacherDashboardComponent }, // Tạm thời dùng dashboard
      { path: 'schedule', component: TeacherDashboardComponent },
      { path: 'students', component: TeacherDashboardComponent },
      { path: 'attendance', component: TeacherDashboardComponent },
      { path: 'assessments', component: TeacherDashboardComponent }
    ]
  }
];
