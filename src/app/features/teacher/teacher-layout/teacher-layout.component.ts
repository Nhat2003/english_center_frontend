import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { ClassService } from '../../../core/services/class.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { AnnouncementService } from '../../../core/services/announcement.service';
import { filter } from 'rxjs/operators';
import { forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-teacher-layout',
  templateUrl: './teacher-layout.component.html',
  styleUrls: ['./teacher-layout.component.css']
})
export class TeacherLayoutComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  currentUser: User | null = null;
  newNotifications = 0; // Số thông báo mới (< 24h)
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
    private teacherService: TeacherService,
    private announcementService: AnnouncementService
  ) {}

  ngOnInit() {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;

      // Load notifications khi có user
      if (this.currentUser?.teacher?.id) {
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
      if (this.currentUser?.teacher?.id) {
        this.loadUnreadNotifications();
      }
    }, 5 * 60 * 1000); // 5 phút
  }

  checkClassManagementMode() {
    const url = this.router.url;
    const classManagementMatch = url.match(/\/teacher\/classes\/(\d+)/);

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
    this.router.navigate(['/teacher/classes']);
  }

  loadUnreadNotifications() {
    if (!this.currentUser?.teacher?.id) return;

    const teacherId = this.currentUser.teacher.id;

    // Load tất cả lớp học của teacher
    this.teacherService.getClassesByTeacher(teacherId).subscribe({
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

            // Đếm số thông báo mới (< 24 giờ) do GIÁO VIÊN KHÁC tạo
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            this.newNotifications = allAnnouncements.filter(announcement => {
              const createdAt = new Date(announcement.createdAt);
              const isRecent = createdAt > oneDayAgo;
              const isFromOtherTeacher = announcement.createdByTeacherId !== teacherId;
              return isRecent && isFromOtherTeacher; // Chỉ đếm thông báo của giáo viên khác
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
    this.router.navigate(['/auth/login']);
  }
}
