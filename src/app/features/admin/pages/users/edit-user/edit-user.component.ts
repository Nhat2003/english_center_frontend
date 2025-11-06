import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
// import { SharedImportsModule } from '../../../../../shared/shared-imports';

@Component({
  selector: 'app-user-edit',
  styleUrls: ['./edit-user.component.css'],
  templateUrl: './edit-user.component.html',
})
export class EditUserComponent implements OnInit {
    @Input() userData: any = null;
  userForm!: FormGroup;
  backendRoleMap = {
    'ADMIN': 'Quản trị viên',
    'TEACHER': 'Giáo viên',
    'STUDENT': 'Học sinh'
  };
  roles = Object.values(this.backendRoleMap);
  statusOptions = [
    { label: 'Hoạt động', value: true },
    { label: 'Ngừng hoạt động', value: false }
  ];
  backendStatusMap = {
    'ACTIVE': true,
    'INACTIVE': false
  };
  isSubmitting = false;

  constructor(private fb: FormBuilder, private modalRef: NzModalRef) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(): void {
    if (this.userForm) {
      console.log('Edit user data:', this.userData);
      let role = this.userData?.role || null;
      if (typeof role === 'string') {
        // Map role chữ hoa từ backend về đúng format
        role = this.backendRoleMap[role.toUpperCase()] || this.roles[0];
      } else {
        role = this.roles[0];
      }

      // Logic xử lý trạng thái giống như user-list
      let isActive = this.isUserActive(this.userData);

      // Lấy fullName từ user hoặc student nếu có
      const fullName = this.userData?.fullName || this.userData?.student?.fullName || '';

      this.userForm.patchValue({
        username: this.userData?.username || '',
        fullName: fullName,
  // email: this.userData?.email || '',
        role: role,
        isActive: isActive,
        password: ''
      });
    }
  }

  // Hàm kiểm tra trạng thái user giống như user-list
  isUserActive(user: any): boolean {
    if (typeof user?.isActive === 'boolean') {
      return user.isActive;
    }
    if (user?.status && typeof user.status === 'string') {
      return user.status.toUpperCase() === 'ACTIVE';
    }
    return false; // Default false if no valid status found
  }

  initForm() {
    // Logic xử lý trạng thái thống nhất
    let isActive = this.isUserActive(this.userData);

    let role = this.userData?.role || null;
    if (typeof role === 'string') {
      role = this.backendRoleMap[role.toUpperCase()] || this.roles[0];
    } else {
      role = this.roles[0];
    }

    // Lấy fullName từ user hoặc student nếu có
    const fullName = this.userData?.fullName || this.userData?.student?.fullName || '';

    this.userForm = this.fb.group({
      username: [this.userData?.username || '', [Validators.required]],
      fullName: [fullName, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
  // email: [this.userData?.email || '', [Validators.required, Validators.email]],
      role: [role, [Validators.required]],
      isActive: [isActive, [Validators.required]],
      password: ['']
    });
  }

  submitForm(): void {
    if (this.userForm.valid) {
      this.isSubmitting = true;
      // Chuyển role về đúng format cho backend
      const formValue = { ...this.userForm.value };
      const roleEntry = Object.entries(this.backendRoleMap).find(([key, val]) => val === formValue.role);
      formValue.role = roleEntry ? roleEntry[0] : formValue.role;

      setTimeout(() => {
        this.isSubmitting = false;
        this.modalRef.close({ ...this.userData, ...formValue });
      }, 1000);
    } else {
      Object.values(this.userForm.controls).forEach(control => {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      });
    }
  }

  cancel(): void {
    this.modalRef.close(null);
  }
}
