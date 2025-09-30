import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-student-layout',
  templateUrl: './student-layout.component.html',
  styleUrls: ['./student-layout.component.css']
})
export class StudentLayoutComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  currentUser: User | null = null;
  newNotifications = 3;
  private userSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    // Subscribe để nhận updates từ AuthService
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('Current user from subscription:', user);

      // Nếu không có user từ subscription, try load từ localStorage
      if (!user) {
        const storedUser = this.authService.getCurrentUser();
        console.log('User from localStorage:', storedUser);
        if (storedUser) {
          this.currentUser = storedUser;
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  logout() {
    this.authService.logout();
    this.message.success('Đăng xuất thành công!');
    this.router.navigate(['/auth/login']);
  }
}
