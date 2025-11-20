import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Teacher } from '../../../../../core/models/teacher.model';
import { TeacherService } from '../../../../../core/services/teacher.service';
import { UserService } from '../../../../../core/services/user.service';
import { User } from '../../../../../core/models/user.model';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-teachers-form',
  templateUrl: './teachers-form.component.html',
  styleUrls: ['./teachers-form.component.css']
})
export class TeachersFormComponent implements OnInit {
  @Input() teacher: Partial<Teacher> | null = null;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';
  @Output() save = new EventEmitter<Teacher>();
  @Output() cancel = new EventEmitter<void>();
  form: FormGroup;
  loading = false;
  availableUsers: User[] = [];
  filteredUsers: User[] = [];
  userSearchText = '';
  isUserSelectionModalVisible = false;
  isViewMode = false;
  teacherData: Teacher | null = null;

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private userService: UserService,
    private modal: NzModalRef,
    private message: NzMessageService
  ) {
    this.form = this.fb.group({
      userId: [null, Validators.required],
      fullName: [null],
      email: [null],
      dob: [null],
      gender: [null],
      phone: [null],
      address: [null],
      speciality: [null],
      hiredAt: [null]
    });
  }

  ngOnInit() {
    this.isViewMode = this.mode === 'view';

    // Disable form trong view mode
    if (this.isViewMode) {
      this.form.disable();
    }

    // Load available users for selection (chỉ khi không phải view mode)
    if (!this.isViewMode) {
      this.loadAvailableUsers();
    }

    // Nếu có teacher data (edit hoặc view mode)
    if (this.teacher && this.teacher.id) {
      this.loadTeacherDetails(this.teacher.id);
    } else if (this.teacher) {
      // Trường hợp có data nhưng không có id (từ list component)
      this.form.patchValue(this.teacher);
    }
  }

  loadTeacherDetails(teacherId: number) {
    this.loading = true;
    this.teacherService.getTeacher(teacherId).subscribe({
      next: (teacher) => {
        this.teacherData = teacher;
        this.form.patchValue({
          userId: teacher.userId,
          fullName: teacher.fullName,
          email: teacher.email,
          dob: teacher.dob,
          gender: teacher.gender,
          phone: teacher.phone,
          address: teacher.address,
          speciality: teacher.speciality,
          hiredAt: teacher.hiredAt
        });
        this.loading = false;

        // Load available users sau khi có dữ liệu teacher (cho edit mode)
        if (this.mode === 'edit') {
          this.loadAvailableUsers();
        }
      },
      error: (error) => {
        console.error('Error loading teacher details:', error);
        this.message.error('Lỗi khi tải thông tin giáo viên!');
        this.loading = false;
      }
    });
  }

  loadAvailableUsers() {
    // Thử gọi API với role và isActive
    this.userService.getActiveUsersByRole('TEACHER').subscribe({
      next: (users) => {
        // Filter thêm isActive = true để đảm bảo
        this.availableUsers = users.filter(user => user.isActive === true);
        this.filteredUsers = [...this.availableUsers];
        console.log('Available active users for teacher profile (API):', this.availableUsers);
      },
      error: (error) => {
        // Fallback: Lấy tất cả users theo role rồi filter
        this.userService.getUsersByRole('TEACHER').subscribe({
          next: (users) => {
            // Chỉ lấy users có isActive = true
            this.availableUsers = users.filter(user => user.isActive === true);
            this.filteredUsers = [...this.availableUsers];
            console.log('Available active users for teacher profile (filtered):', this.availableUsers);
          },
          error: (err) => {
            console.error('Error loading users with role TEACHER:', err);
          }
        });
      }
    });
  }

  onSubmit() {
    if (this.isViewMode) {
      this.modal.close(false);
      return;
    }

    if (this.form.valid) {
      this.loading = true;
      const data = this.form.value;

      if (this.mode === 'edit' && this.teacherData?.id) {
        // Update existing teacher
        this.teacherService.updateTeacher(this.teacherData.id, data).subscribe({
          next: (teacher) => {
            this.loading = false;
            this.modal.close(true);
          },
          error: (error) => {
            this.handleError(error, 'cập nhật');
          }
        });
      } else {
        // Create new teacher
        this.teacherService.createTeacher(data).subscribe({
          next: (teacher) => {
            this.loading = false;
            this.modal.close(true);
          },
          error: (error) => {
            this.handleError(error, 'tạo');
          }
        });
      }
    } else {
      }
  }

  private handleError(error: any, action: string) {
    this.loading = false;
    console.error(`Error ${action} teacher:`, error);

    let errorMessage = 'Lỗi không xác định';

    if (error.status === 400 || error.status === 409) {
      const backendMessage = error.error?.message || '';
      if (backendMessage.includes('already exists') ||
          backendMessage.includes('đã tồn tại') ||
          backendMessage.includes('duplicate') ||
          backendMessage.includes('userId')) {
        errorMessage = 'Người dùng này đã có hồ sơ giáo viên hoặc học sinh!';
      } else {
        errorMessage = backendMessage || 'Dữ liệu không hợp lệ!';
      }
    } else if (error.status === 500) {
      errorMessage = 'Lỗi hệ thống, vui lòng thử lại sau!';
    } else {
      errorMessage = error.error?.message || error.message || 'Lỗi không xác định';
    }

    this.message.error(errorMessage);
  }



  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  getGenderLabel(gender: string): string {
    switch(gender?.toUpperCase()) {
      case 'MALE': return 'Nam';
      case 'FEMALE': return 'Nữ';
      default: return gender || '';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  onCancel() {
    this.modal.close(false); // Đóng modal và trả về false
  }

  // User selection modal methods
  openUserSelectionModal() {
    console.log('Current userId:', this.form.get('userId')?.value);
    this.isUserSelectionModalVisible = true;
    this.filterUsers();
  }

  handleUserSelectionOk() {
    this.isUserSelectionModalVisible = false;
  }

  handleUserSelectionCancel() {
    this.isUserSelectionModalVisible = false;
  }

  filterUsers() {
    const searchText = this.userSearchText.toLowerCase().trim();

    if (!searchText) {
      this.filteredUsers = [...this.availableUsers];
    } else {
      this.filteredUsers = this.availableUsers.filter(user =>
        (user.fullName?.toLowerCase().includes(searchText)) ||
        (user.username?.toLowerCase().includes(searchText)) ||
        (user.email?.toLowerCase().includes(searchText))
      );
    }
  }

  selectUser(user: User) {
    this.form.patchValue({
      userId: user.id,
      fullName: user.fullName || user.username,
      email: user.email
    });
    this.isUserSelectionModalVisible = false;
    this.message.success(`Đã chọn: ${user.fullName || user.username}`);
  }

  getSelectedUserName(): string {
    const userId = this.form.get('userId')?.value;
    if (!userId) return '';

    const user = this.availableUsers.find(u => u.id === userId);
    return user ? (user.fullName || user.username || '') : '';
  }
}
