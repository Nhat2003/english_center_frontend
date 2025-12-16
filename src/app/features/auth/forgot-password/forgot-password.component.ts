import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  isSending = false;
  emailSent = false;
  temporaryPassword = '';  // Mật khẩu tạm từ backend (dev mode)

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required]]  // Chỉ yêu cầu required, không validate email format
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.valid) {
      this.isSending = true;
      const { email } = this.forgotPasswordForm.value;

      console.log('📤 Sending forgot password request:', { email });
      console.log('📍 API URL:', 'http://localhost:8080/auth/forgot-password');

      this.authService.forgotPassword(email).subscribe({
        next: (response) => {
          this.isSending = false;
          this.emailSent = true;

          // Lưu temporary password nếu có (dev mode)
          if (response && response.temporaryPassword) {
            this.temporaryPassword = response.temporaryPassword;
            console.log('🔑 Temporary Password (DEV):', this.temporaryPassword);
            console.log('📧 Message:', response.message);
          }

          this.message.success('Mật khẩu tạm đã được tạo! Vui lòng kiểm tra email hoặc sử dụng mật khẩu hiển thị bên dưới.');
        },
        error: (error) => {
          this.isSending = false;
          console.error('Forgot password error:', error);
          console.error('Error details:', error.error);

          if (error.status === 404) {
            this.message.error('Email/Username không tồn tại trong hệ thống!');
          } else if (error.status === 400) {
            const errorMsg = error.error?.message || 'Email does not exist';
            this.message.error(errorMsg === 'Email does not exist'
              ? 'Email/Username không tồn tại trong hệ thống!'
              : errorMsg);
          } else if (error.status === 0) {
            this.message.error('Không thể kết nối đến server! Vui lòng kiểm tra backend đang chạy tại http://localhost:8080');
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
      this.message.warning('Vui lòng nhập email hoặc username!');
    }
  }

  backToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
