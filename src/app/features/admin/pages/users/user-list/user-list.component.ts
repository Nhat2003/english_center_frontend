import { User } from '../../../../../core/models/user.model';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { AddUserComponent } from '../add-user/add-user.component';
import { EditUserComponent } from '../edit-user/edit-user.component';
import { ViewUserComponent } from '../view-user/view-user.component';
import { NzModalService } from 'ng-zorro-antd/modal';
import { UserService } from '../../../../../core/services/user.service';

@Component({
  selector: 'app-users',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  allUsers: User[] = []; // Store all users for search
  pageIndex = 1;
  pageSize = 5;
  searchText = '';

  // Map role từ backend sang tiếng Việt
  roleMap = {
    'ADMIN': 'Quản trị viên',
    'TEACHER': 'Giáo viên',
    'STUDENT': 'Học sinh'
  };

  constructor(
    private modal: NzModalService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }


  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.allUsers = data.map(user => ({
          ...user,
          // Đảm bảo fullName được map từ student nếu có
          fullName: user.fullName || user.student?.fullName || ''
        }));
        this.users = [...this.allUsers]; // Copy to display array
        // Debug log
      },
      error: (err) => console.error(' Lỗi load users:', err),
    });
  }

  onSearch() {
    if (!this.searchText.trim()) {
      // If search is empty, show all users
      this.users = [...this.allUsers];
    } else {
      // Filter users based on search text
      const searchLower = this.searchText.toLowerCase();
      this.users = this.allUsers.filter(user =>
        user.username?.toLowerCase().includes(searchLower) ||
        user.fullName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        this.getRoleLabel(user.role)?.toLowerCase().includes(searchLower)
      );
    }
    // Reset to first page when searching
    this.pageIndex = 1;
  }

  get totalUsers() {
    return this.users.length;
  }

  get paginatedUsers() {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.users.slice(start, start + this.pageSize);
  }

  // Kiểm tra trạng thái active của user
  isUserActive(user: User): boolean {
    // Kiểm tra theo boolean isActive trước
    if (typeof user.isActive === 'boolean') {
      return user.isActive;
    }
    // Nếu không có isActive, kiểm tra theo status string
    if (user.status) {
      return user.status.toUpperCase() === 'ACTIVE';
    }
    // Default false nếu không có thông tin
    return false;
  }

  // Chuyển role sang tiếng Việt
  getRoleLabel(role: string): string {
    return this.roleMap[role] || role;
  }

  onPageIndexChange(index: number) {
    this.pageIndex = index;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.pageIndex = 1;
  }


  openAddUser(): void {
    const modalRef = this.modal.create({
      nzTitle: 'Thêm User',
      nzContent: AddUserComponent,
      nzFooter: null,
      nzWidth: 600,
    });

    modalRef.afterOpen.subscribe(() => {
      const instance = modalRef.getContentComponent();
      if (instance) {
        instance.userAdded.subscribe(() => {
          this.loadUsers();
          modalRef.close();
        });
      }
    });
  }


  openEditUser(user: User): void {
    this.userService.getUser(user.id).subscribe({
      next: (freshUser) => {
        // Đảm bảo fullName được lấy từ student nếu có
        const userData = {
          ...freshUser,
          fullName: freshUser.fullName || freshUser.student?.fullName || ''
        };

        const modalRef = this.modal.create({
          nzTitle: 'Chỉnh sửa User',
          nzContent: EditUserComponent,
          nzFooter: null,
          nzWidth: 600,
          nzComponentParams: { userData },
        });

        modalRef.afterClose.subscribe((result) => {
          if (result) {
            // Gọi API cập nhật user
            this.userService.updateUser(result.id, result).subscribe({
              next: () => {
                this.modal.success({ nzTitle: 'Cập nhật user thành công!' });
                this.loadUsers();
              },
              error: (err) => {
                this.modal.error({ nzTitle: 'Cập nhật user thất bại!', nzContent: err?.error || 'Có lỗi xảy ra.' });
                this.loadUsers();
              }
            });
          }
        });
      },
      error: () => {
        this.modal.error({ nzTitle: 'Không lấy được thông tin user!' });
      }
    });
  }


  viewUser(user: User) {
    const modalRef = this.modal.create({
      nzTitle: 'Thông tin chi tiết người dùng',
      nzContent: ViewUserComponent,
      nzFooter: null,
      nzWidth: 800,
      nzComponentParams: { userId: user.id },
    });
  }

  deleteUser(user: User) {
    if (typeof user.id !== 'number') {
      this.modal.error({ nzTitle: 'ID user không hợp lệ!' });
      return;
    }
    const confirmRef = this.modal.confirm({
      nzTitle: `Bạn có chắc muốn xoá user <b>${user.username}</b>?`,
      nzContent: 'Thao tác này không thể hoàn tác.',
      nzOkText: 'Xoá',
      nzOkType: 'danger',
      nzCancelText: 'Huỷ',
      nzOnOk: () => {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.loadUsers();
            confirmRef.close();
            this.modal.success({ nzTitle: 'Xoá user thành công!' });
          },
          error: (err) => {
            this.loadUsers();
            confirmRef.close();
            // Nếu dữ liệu đã bị xoá khỏi danh sách sau khi reload, báo thành công
            setTimeout(() => {
              const stillExists = this.users.some(u => u.id === user.id);
              if (!stillExists) {
                this.modal.success({ nzTitle: 'Xoá user thành công!' });
              } else {
                this.modal.error({ nzTitle: 'Xoá user thất bại!', nzContent: err?.error || 'Có thể user không tồn tại hoặc đã bị xoá.' });
              }
            }, 300);
          },
          complete: () => {}
        });
      }
    });
  }
}
