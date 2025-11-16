import { Component, Input, OnInit } from '@angular/core';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { UserService } from '../../../../../core/services/user.service';
import { User } from '../../../../../core/models/user.model';

@Component({
  selector: 'app-view-user',
  templateUrl: './view-user.component.html',
  styleUrls: ['./view-user.component.css']
})
export class ViewUserComponent implements OnInit {
  @Input() userId!: number;

  userData: User | null = null;
  isLoading = true;

  roleMap = {
    'ADMIN': 'Quản trị viên',
    'TEACHER': 'Giáo viên',
    'STUDENT': 'Học sinh'
  };

  statusMap = {
    'ACTIVE': 'Hoạt động',
    'INACTIVE': 'Không hoạt động'
  };

  constructor(
    private modalRef: NzModalRef,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadUserDetails();
  }

  loadUserDetails(): void {
    this.isLoading = true;
    this.userService.getUser(this.userId).subscribe({
      next: (user) => {
        this.userData = {
          ...user,
          fullName: user.fullName || user.student?.fullName || ''
        };
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading user details:', err);
        this.isLoading = false;
      }
    });
  }

  getRoleLabel(role: string): string {
    return this.roleMap[role] || role;
  }

  getStatusLabel(user: User): string {
    if (typeof user.isActive === 'boolean') {
      return user.isActive ? 'Hoạt động' : 'Không hoạt động';
    }
    if (user.status) {
      return user.status.toUpperCase() === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động';
    }
    return 'Không xác định';
  }

  getStatusColor(user: User): string {
    if (typeof user.isActive === 'boolean') {
      return user.isActive ? 'success' : 'default';
    }
    if (user.status) {
      return user.status.toUpperCase() === 'ACTIVE' ? 'success' : 'default';
    }
    return 'default';
  }

  getStatusCodeLabel(status: string): string {
    return this.statusMap[status] || status;
  }

  close(): void {
    this.modalRef.close();
  }
}
