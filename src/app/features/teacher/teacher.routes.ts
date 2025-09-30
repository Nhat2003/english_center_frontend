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
      // 7 main sections
      { path: 'schedule', component: TeacherDashboardComponent }, // Lịch dạy
      { path: 'classes', component: TeacherDashboardComponent }, // Danh sách lớp & học sinh
      { path: 'assignments', component: TeacherDashboardComponent }, // Quản lý bài tập
      { path: 'online-classes', component: TeacherDashboardComponent }, // Phòng học online
      { path: 'materials', component: TeacherDashboardComponent }, // Tài liệu giảng dạy
      { path: 'notifications', component: TeacherDashboardComponent } // Thông báo cho học sinh
    ]
  }
];
