import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService, LoginResponse } from '../../../core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  forgotPasswordForm!: FormGroup;
  isLoading = false;
  passwordVisible = false;
  isForgotPasswordModalVisible = false;
  sendingResetEmail = false;
  temporaryPassword = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      username: [{ value: '', disabled: false }, Validators.required],
      password: [{ value: '', disabled: false }, Validators.required]
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required]]
    });
  }

  submitForm() {
    if (this.form.valid && !this.isLoading) {
      this.setFormLoadingState(true);
      const { username, password } = this.form.value;

      const loginObservable = this.authService.login(username!, password!);
      loginObservable.subscribe({
        next: (response) => {
          this.setFormLoadingState(false);
          if (response.success && response.user) {
            this.message.success('Đăng nhập thành công!');
            this.redirectBasedOnRole(response.user.role);
          } else {
            // Backend trả về success: false với message
            this.message.error(response.message || 'Đăng nhập thất bại!');
          }
        },
        error: (error) => {
          this.setFormLoadingState(false);
          console.error('Login error:', error);

          // Xử lý các lỗi HTTP từ backend
          if (error.status === 401) {
            // Backend trả về 401: Sai username hoặc password
            const errorMessage = error.error?.message || 'Sai tên đăng nhập hoặc mật khẩu!';
            this.message.error(errorMessage);
          } else if (error.status === 403) {
            // Backend trả về 403: Tài khoản bị khóa
            const errorMessage = error.error?.message || 'Tài khoản đã bị khóa!';
            this.message.error(errorMessage);
          } else if (error.status === 0) {
            this.message.error('Không thể kết nối tới server!');
          } else {
            const errorMessage = error.error?.message || 'Có lỗi xảy ra trong quá trình đăng nhập!';
            this.message.error(errorMessage);
          }
        }
      });
    }
  }

  private setFormLoadingState(loading: boolean) {
    this.isLoading = loading;
    if (loading) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }

  private redirectBasedOnRole(role: string) {
    switch (role) {
      case 'ADMIN':
        this.router.navigate(['/admin']);
        break;
      case 'TEACHER':
        this.router.navigate(['/teacher']);
        break;
      case 'STUDENT':
        this.router.navigate(['/student']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  getUsernameErrorTip(): string {
    const control = this.form.get('username');
    if (control?.hasError('required') && control?.touched) {
      return 'Vui lòng nhập tên đăng nhập';
    }
    return '';
  }

  getPasswordErrorTip(): string {
    const control = this.form.get('password');
    if (control?.hasError('required') && control?.touched) {
      return 'Vui lòng nhập mật khẩu';
    }
    return '';
  }

  showForgotPasswordModal(): void {
    this.isForgotPasswordModalVisible = true;
    this.temporaryPassword = '';
  }

  handleForgotPasswordCancel(): void {
    this.isForgotPasswordModalVisible = false;
    this.forgotPasswordForm.reset();
    this.temporaryPassword = '';
  }

  onForgotPassword(): void {
    if (this.forgotPasswordForm.valid) {
      this.sendingResetEmail = true;
      const email = this.forgotPasswordForm.value.email;

      this.authService.forgotPassword(email).subscribe({
        next: (response) => {
          this.sendingResetEmail = false;

          // Lưu temporary password nếu có (dev mode)
          if (response && response.temporaryPassword) {
            this.temporaryPassword = response.temporaryPassword;
            console.log('🔑 Temporary Password (DEV):', this.temporaryPassword);
          }

          this.message.success('Mật khẩu tạm đã được tạo! Kiểm tra email hoặc sử dụng mật khẩu hiển thị trong modal.');
        },
        error: (error) => {
          this.sendingResetEmail = false;
          console.error('Forgot password error:', error);

          if (error.status === 404) {
            this.message.error('Email/Username không tồn tại trong hệ thống!');
          } else if (error.status === 400) {
            const errorMsg = error.error?.message || 'Email does not exist';
            this.message.error(errorMsg === 'Email does not exist'
              ? 'Email/Username không tồn tại trong hệ thống!'
              : errorMsg);
          } else if (error.status === 0) {
            this.message.error('Không thể kết nối đến server!');
          } else {
            this.message.error('Có lỗi xảy ra. Vui lòng thử lại sau!');
          }
        }
      });
    } else {
      Object.values(this.forgotPasswordForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

}
