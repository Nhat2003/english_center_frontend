import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { ClassService } from '../../../core/services/class.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

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

  // Class management mode
  isClassManagementMode = false;
  currentClassId: number | null = null;
  currentClassInfo: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private classService: ClassService,
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

    // Theo dõi navigation để detect class management mode
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkClassManagementMode();
    });

    // Check initial route
    this.checkClassManagementMode();
  }

  checkClassManagementMode() {
    const url = this.router.url;
    const classManagementMatch = url.match(/\/student\/classes\/(\d+)/);

    if (classManagementMatch) {
      this.isClassManagementMode = true;
      const classId = parseInt(classManagementMatch[1]);

      if (this.currentClassId !== classId) {
        this.currentClassId = classId;
        this.loadClassInfo(classId);
      }
    } else {
      this.isClassManagementMode = false;
      this.currentClassId = null;
      this.currentClassInfo = null;
    }
  }

  loadClassInfo(classId: number) {
    this.classService.getClass(classId).subscribe({
      next: (data) => {
        this.currentClassInfo = data;
      },
      error: (err) => {
        console.error('Failed to load class info:', err);
      }
    });
  }

  backToClasses() {
    this.router.navigate(['/student/classes']);
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
