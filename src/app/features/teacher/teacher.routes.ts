import { Routes } from '@angular/router';
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

export const TEACHER_ROUTES: Routes = [
  {
    path: '',
    component: TeacherLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: TeacherDashboardComponent },
      { path: 'schedule', component: TeacherScheduleComponent },
      { path: 'classes', component: TeacherClassesComponent },
      { path: 'classes/:id/students', component: ClassStudentsComponent },
      { path: 'classes/:id/assignments', component: ClassAssignmentsComponent },
      { path: 'classes/:id/assignments/:assignmentId', component: AssignmentDetailComponent },
      { path: 'classes/:id/materials', component: ClassMaterialsComponent },
      { path: 'classes/:id/attendance', component: ClassAttendanceComponent },
      { path: 'classes/:classId/announcements', component: ClassAnnouncementsComponent },
      { path: 'students/:studentId/detail', component: StudentDetailComponent },
      { path: 'assignments', component: TeacherDashboardComponent },
      { path: 'online-classes', component: TeacherDashboardComponent },
      { path: 'materials', component: TeacherDashboardComponent },
      { path: 'notifications', component: TeacherNotificationsComponent }
    ]
  }
];
