import { StudentNotificationsComponent } from './pages/notifications/notifications.component';
import { Routes } from '@angular/router';
import { StudentLayoutComponent } from './student-layout/student-layout.component';
import { StudentDashboardComponent } from './pages/dashboard/dashboard.component';
import { StudentScheduleComponent } from './pages/schedule/student-schedule.component';
import { StudentDocumentsComponent } from './pages/documents/student-documents.component';
import { StudentAssignmentsComponent } from './pages/assignments/student-assignments.component';
import { AssignmentDetailComponent } from './pages/assignments/assignment-detail/assignment-detail.component';
import { StudentClassesComponent } from './pages/classes/student-classes.component';
import { StudentClassOverviewComponent } from './pages/classes/student-class-overview/student-class-overview.component';
import { GradesComponent } from './pages/grades/grades.component';
import { AttendanceHistoryComponent } from './pages/attendance-history/attendance-history.component';
import { ClassAttendanceComponent } from './pages/classes/class-attendance/class-attendance.component';
import { StudentClassAnnouncementsComponent } from './pages/classes/class-announcements/class-announcements.component';


import { StudentPaymentComponent } from './pages/payment/student-payment.component';
import { PaymentSuccessComponent } from './pages/payment-success/payment-success.component';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    component: StudentLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: StudentDashboardComponent },
      { path: 'schedule', component: StudentScheduleComponent },
      { path: 'classes', component: StudentClassesComponent },
      { path: 'classes/:id/overview', component: StudentClassOverviewComponent },
      { path: 'classes/:id/assignments', component: StudentAssignmentsComponent },
      { path: 'classes/:id/grades', component: GradesComponent },
      { path: 'classes/:id/materials', component: StudentDocumentsComponent },
      { path: 'classes/:id/attendance', component: ClassAttendanceComponent },
      { path: 'classes/:id/announcements', component: StudentClassAnnouncementsComponent },
      { path: 'assignments', component: StudentAssignmentsComponent },
      { path: 'assignments/:id', component: AssignmentDetailComponent },
      { path: 'attendance-history', component: AttendanceHistoryComponent },
      { path: 'payments', component: StudentPaymentComponent },
      { path: 'payment-success', component: PaymentSuccessComponent },
      { path: 'online-classes', component: StudentDashboardComponent },
      { path: 'documents', component: StudentDocumentsComponent },
      { path: 'notifications', component: StudentNotificationsComponent }
    ]
  }
];
