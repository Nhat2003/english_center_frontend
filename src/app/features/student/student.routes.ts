import { Routes } from '@angular/router';
import { StudentLayoutComponent } from './student-layout/student-layout.component';
import { StudentDashboardComponent } from './dashboard/dashboard.component';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    component: StudentLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: StudentDashboardComponent },
      { path: 'schedule', component: StudentDashboardComponent }, // Temporarily use same component
      { path: 'assignments', component: StudentDashboardComponent }, // Will create separate components later
      { path: 'payments', component: StudentDashboardComponent },
      { path: 'online-classes', component: StudentDashboardComponent },
      { path: 'documents', component: StudentDashboardComponent },
      { path: 'notifications', component: StudentDashboardComponent }
    ]
  }
];
