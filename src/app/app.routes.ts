import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 'teacher',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/teacher/teacher.module').then(m => m.TeacherModule)
  },
  {
    path: 'student',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/student/student.module').then(m => m.StudentModule)
  },
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
