import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { BreadcrumbComponent } from '../../../core/components/breadcrumb/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
})
export class AdminLayoutComponent {
  isCollapsed = false;

  menuItems = [

    { label: 'Quản lý người dùng', icon: 'user', route: '/admin/users' },
      { label: 'Quản lý giáo viên', icon: 'solution', route: '/admin/teachers' },
      { label: 'Quản lý học sinh', icon: 'solution', route: '/admin/students' },
    { label: 'Quản lý khóa học', icon: 'book', route: '/admin/courses' },
    { label: 'Quản lý lớp học', icon: 'team', route: '/admin/classes' },
    { label: 'Thống kê', icon: 'bar-chart', route: '/admin/stats' }
  ];


}
