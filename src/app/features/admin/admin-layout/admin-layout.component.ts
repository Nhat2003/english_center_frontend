import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthService, User } from '../../../core/services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { BreadcrumbComponent } from '../../../core/components/breadcrumb/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
})
export class AdminLayoutComponent implements OnInit {
  isCollapsed = false;
  currentUser: User | null = null;

  menuItems = [
    { label: 'Quản lý người dùng', icon: 'user', route: '/admin/users' },
    { label: 'Quản lý giáo viên', icon: 'solution', route: '/admin/teachers' },
    { label: 'Quản lý học sinh', icon: 'solution', route: '/admin/students' },
    { label: 'Quản lý khóa học', icon: 'book', route: '/admin/courses' },
    { label: 'Quản lý lớp học', icon: 'team', route: '/admin/classes' },
    { label: 'Quản lý lịch học', icon: 'calendar', route: '/admin/schedules' },
    { label: 'Quản lý thanh toán', icon: 'credit-card', route: '/admin/payments' },
    { label: 'Thống kê', icon: 'bar-chart', route: '/admin/stats' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout() {
    this.authService.logout();
    this.message.success('Đăng xuất thành công!');
    this.router.navigate(['/auth/login']);
  }
}
