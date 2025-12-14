import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { TeacherService } from '../../../../core/services/teacher.service';
import { Teacher } from '../../../../core/models/teacher.model';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css']
})
export class ProfileSettingsComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  loading = false;
  saving = false;
  changingPassword = false;
  currentProfile?: Teacher;
  isPasswordModalVisible = false;
  passwordVisible1 = false;
  passwordVisible2 = false;
  passwordVisible3 = false;

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private message: NzMessageService,
    private location: Location,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.initPasswordForm();
    this.loadProfile();
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.email]],
      dob: [null],
      address: [''],
      speciality: [''],
      gender: ['', [Validators.required]]
    });
  }

  initPasswordForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  loadProfile(): void {
    this.loading = true;
    this.teacherService.getMyProfile().subscribe({
      next: (profile) => {
        this.currentProfile = profile;
        this.profileForm.patchValue({
          fullName: profile.fullName,
          phone: profile.phone,
          email: profile.email,
          dob: profile.dob ? new Date(profile.dob) : null,
          address: profile.address,
          speciality: profile.speciality,
          gender: profile.gender
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading teacher profile:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        this.message.error('Không thể tải thông tin cá nhân');
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.saving = true;
      const formValue = this.profileForm.value;

      // Convert date to string if exists
      const profileData = {
        ...formValue,
        dob: formValue.dob
          ? new Date(formValue.dob).toISOString().split('T')[0]
          : null
      };

      this.teacherService.updateMyProfile(profileData).subscribe({
        next: (updatedProfile) => {
          this.currentProfile = updatedProfile;

          // Update user in localStorage
          const currentUser = this.authService.getCurrentUser();
          if (currentUser && currentUser.teacher && updatedProfile.id) {
            currentUser.teacher = {
              ...currentUser.teacher,
              ...updatedProfile,
              id: updatedProfile.id
            };
            localStorage.setItem('current_user', JSON.stringify(currentUser));
          }

          this.message.success('Cập nhật thông tin thành công!');
          this.saving = false;

          // Navigate back to previous page after 1 second
          setTimeout(() => {
            this.location.back();
          }, 1000);
        },
        error: (error) => {
          console.error('Error updating teacher profile:', error);
          console.error('Error status:', error.status);
          console.error('Error response:', error.error);
          this.message.error('Cập nhật thông tin thất bại: ' + (error.error?.message || 'Lỗi không xác định'));
          this.saving = false;
        }
      });
    } else {
      Object.values(this.profileForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Vui lòng kiểm tra lại thông tin!');
    }
  }

  resetForm(): void {
    if (this.currentProfile) {
      this.profileForm.patchValue({
        fullName: this.currentProfile.fullName,
        phone: this.currentProfile.phone,
        email: this.currentProfile.email,
        dob: this.currentProfile.dob ? new Date(this.currentProfile.dob) : null,
        address: this.currentProfile.address,
        speciality: this.currentProfile.speciality,
        gender: this.currentProfile.gender
      });
      this.message.info('Đã khôi phục thông tin ban đầu');
    }
  }

  showPasswordModal(): void {
    this.isPasswordModalVisible = true;
  }

  handlePasswordModalCancel(): void {
    this.isPasswordModalVisible = false;
    this.passwordForm.reset();
    this.passwordVisible1 = false;
    this.passwordVisible2 = false;
    this.passwordVisible3 = false;
  }

  onChangePassword(): void {
    if (this.passwordForm.valid) {
      this.changingPassword = true;
      const passwordData = this.passwordForm.value;

      this.teacherService.changePassword(passwordData).subscribe({
        next: () => {
          this.message.success('Đổi mật khẩu thành công!');
          this.passwordForm.reset();
          this.changingPassword = false;
          this.isPasswordModalVisible = false;
          this.passwordVisible1 = false;
          this.passwordVisible2 = false;
          this.passwordVisible3 = false;
        },
        error: (error) => {
          console.error('Error changing password:', error);
          let errorMsg = 'Đổi mật khẩu thất bại';

          if (error.status === 400) {
            errorMsg = error.error?.message || 'Mật khẩu hiện tại không đúng hoặc mật khẩu mới không hợp lệ';
          } else if (error.status === 401) {
            errorMsg = 'Mật khẩu hiện tại không đúng';
          }

          this.message.error(errorMsg);
          this.changingPassword = false;
        }
      });
    } else {
      Object.values(this.passwordForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Vui lòng kiểm tra lại thông tin mật khẩu!');
    }
  }

}
