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
  isLoading = false;
  passwordVisible = false;

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
  }

  submitForm() {
    if (this.form.valid && !this.isLoading) {
      this.setFormLoadingState(true);
      const { username, password } = this.form.value;

      const loginObservable = this.authService.login(username!, password!);
      loginObservable.subscribe({
        next: (response) => {
          this.setFormLoadingState(false);
          if (response.success) {
            this.message.success(response.message || 'Đăng nhập thành công!');
            this.redirectBasedOnRole(response.user?.role || '');
          } else {
            this.message.error(response.message || 'Đăng nhập thất bại!');
          }
        },
        error: (error) => {
          this.setFormLoadingState(false);
          console.error('Login error:', error);
          this.message.error('Có lỗi xảy ra trong quá trình đăng nhập!');
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

}
