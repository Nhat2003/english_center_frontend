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
    'ADMIN': 'Admin',
    'TEACHER': 'Teacher',
    'STUDENT': 'Student'
  };
  roles = Object.values({
    'ADMIN': 'Admin',
    'TEACHER': 'Teacher',
    'STUDENT': 'Student'
  });
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
      let role = this.userData?.role || null;
      if (typeof role === 'string') {
        // Map role chữ hoa từ backend về đúng format
        role = this.backendRoleMap[role.toUpperCase()] || this.roles[0];
      } else {
        role = this.roles[0];
      }
      let isActive = true;
      if (typeof this.userData?.isActive === 'boolean') {
        isActive = this.userData.isActive;
      } else if (typeof this.userData?.isActive === 'string') {
        isActive = this.backendStatusMap[this.userData.isActive.toUpperCase()] ?? true;
      }
      this.userForm.patchValue({
        username: this.userData?.username || '',
  // email: this.userData?.email || '',
        role: role,
        isActive: isActive,
        password: ''
      });
    }
  }

  initForm() {
    let isActive = true;
    if (typeof this.userData?.isActive === 'boolean') {
      isActive = this.userData.isActive;
    } else if (typeof this.userData?.isActive === 'string') {
      isActive = this.backendStatusMap[this.userData.isActive.toUpperCase()] ?? true;
    }
    let role = this.userData?.role || null;
    if (typeof role === 'string') {
      role = this.backendRoleMap[role.toUpperCase()] || this.roles[0];
    } else {
      role = this.roles[0];
    }
    this.userForm = this.fb.group({
      username: [this.userData?.username || '', [Validators.required]],
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
