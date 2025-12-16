import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  isResetting = false;
  token: string = '';
  passwordVisible1 = false;
  passwordVisible2 = false;
  validatingToken = true;
  tokenValid = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    // Get token from URL query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.validatingToken = false;
        this.errorMessage = 'Liên kết không hợp lệ. Vui lòng kiểm tra lại email của bạn.';
        return;
      }
      // Validate token before showing form
      this.validateToken();
    });

    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  validateToken(): void {
    this.validatingToken = true;
    this.authService.validateResetToken(this.token).subscribe({
      next: () => {
        this.validatingToken = false;
        this.tokenValid = true;
      },
      error: (error) => {
        this.validatingToken = false;
        this.tokenValid = false;

        // Handle different error types
        if (error.status === 400) {
          this.errorMessage = 'Liên kết đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.';
        } else if (error.status === 404) {
          this.errorMessage = 'Liên kết không hợp lệ hoặc đã được sử dụng.';
        } else {
          this.errorMessage = 'Không thể xác thực liên kết. Vui lòng thử lại sau.';
        }
      }
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit() {
    if (this.resetForm.valid && this.token) {
      this.isResetting = true;
      const { newPassword } = this.resetForm.value;

      this.authService.resetPassword(this.token, newPassword).subscribe({
        next: () => {
          this.isResetting = false;
          this.message.success('Mật khẩu đã được thay đổi thành công! Đang chuyển đến trang đăng nhập...');
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        },
        error: (error) => {
          this.isResetting = false;
          console.error('Reset password error:', error);

          // Handle detailed errors
          if (error.status === 400) {
            const errorMsg = error.error?.message || '';
            if (errorMsg.includes('expired') || errorMsg.includes('hết hạn')) {
              this.message.error('Liên kết đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.');
              this.errorMessage = 'Liên kết đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.';
              this.tokenValid = false;
            } else {
              this.message.error('Liên kết không hợp lệ hoặc đã được sử dụng.');
              this.errorMessage = 'Liên kết không hợp lệ hoặc đã được sử dụng.';
              this.tokenValid = false;
            }
          } else if (error.status === 404) {
            this.message.error('Không tìm thấy người dùng. Liên kết có thể đã hết hạn.');
            this.errorMessage = 'Không tìm thấy người dùng.';
            this.tokenValid = false;
          } else {
            this.message.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
          }
        }
      });
    } else {
      Object.values(this.resetForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Vui lòng kiểm tra lại thông tin!');
    }
  }

  togglePasswordVisibility1() {
    this.passwordVisible1 = !this.passwordVisible1;
  }

  togglePasswordVisibility2() {
    this.passwordVisible2 = !this.passwordVisible2;
  }

  backToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
