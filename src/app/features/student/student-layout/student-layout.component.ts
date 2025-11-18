import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { ClassService } from '../../../core/services/class.service';
import { StudentService } from '../../../core/services/student.service';
import { AnnouncementService } from '../../../core/services/announcement.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Subscription, forkJoin } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-student-layout',
  templateUrl: './student-layout.component.html',
  styleUrls: ['./student-layout.component.css']
})
export class StudentLayoutComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  currentUser: User | null = null;
  newNotifications = 0; // Số thông báo mới (< 24h chưa đọc)
  private userSubscription?: Subscription;
  private notificationCheckInterval: any;

  // Class management mode
  isClassManagementMode = false;
  currentClassId: number | null = null;
  currentClassInfo: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private classService: ClassService,
    private studentService: StudentService,
    private announcementService: AnnouncementService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    // Subscribe để nhận updates từ AuthService
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      // Nếu không có user từ subscription, try load từ localStorage
      if (!user) {
        const storedUser = this.authService.getCurrentUser();
        if (storedUser) {
          this.currentUser = storedUser;
        }
      }

      // Load notifications khi có user
      if (this.currentUser?.student?.id) {
        this.loadUnreadNotifications();
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

    // Refresh notifications every 5 minutes
    this.notificationCheckInterval = setInterval(() => {
      if (this.currentUser?.student?.id) {
        this.loadUnreadNotifications();
      }
    }, 5 * 60 * 1000); // 5 phút
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

  loadUnreadNotifications() {
    if (!this.currentUser?.student?.id) return;

    const studentId = this.currentUser.student.id;

    // Load tất cả lớp học của student
    this.studentService.getClassesByStudent(studentId).subscribe({
      next: (classes) => {
        if (classes.length === 0) {
          this.newNotifications = 0;
          return;
        }

        // Load announcements từ tất cả các lớp
        const announcementRequests = classes.map(cls =>
          this.announcementService.getAnnouncementsByClass(cls.id)
        );

        forkJoin(announcementRequests).subscribe({
          next: (results) => {
            // Gộp tất cả announcements
            const allAnnouncements: any[] = [];
            results.forEach(arr => allAnnouncements.push(...arr));

            // Đếm số thông báo mới (< 24 giờ)
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            this.newNotifications = allAnnouncements.filter(announcement => {
              const createdAt = new Date(announcement.createdAt);
              return createdAt > oneDayAgo;
            }).length;
          },
          error: (err) => {
            console.error('Error loading announcements:', err);
            this.newNotifications = 0;
          }
        });
      },
      error: (err) => {
        console.error('Error loading classes:', err);
        this.newNotifications = 0;
      }
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.notificationCheckInterval) {
      clearInterval(this.notificationCheckInterval);
    }
  }

  logout() {
    this.authService.logout();
    this.message.success('Đăng xuất thành công!');
    this.router.navigate(['/auth/login']);
  }
}
