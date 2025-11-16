import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AnnouncementService } from '../../../../core/services/announcement.service';
import { TeacherService } from '../../../../core/services/teacher.service';
import { AuthService } from '../../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

interface AnnouncementWithClass {
  id: number;
  classId: number;
  className: string;
  title: string;
  content: string;
  createdAt: string;
  createdByTeacherId: number;
}

@Component({
  selector: 'app-teacher-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class TeacherNotificationsComponent implements OnInit {
  announcements: AnnouncementWithClass[] = [];
  loading = false;
  teacherId: number = 0;
  myClasses: any[] = [];

  // Filter
  selectedClassId: number | null = null;
  searchText: string = '';

  constructor(
    public router: Router,
    private announcementService: AnnouncementService,
    private teacherService: TeacherService,
    private authService: AuthService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user?.teacher?.id) {
      this.teacherId = user.teacher.id;
      this.loadData();
    } else {
      this.message.error('Không tìm thấy thông tin giáo viên');
    }
  }

  loadData(): void {
    this.loading = true;

    // Load classes first
    this.teacherService.getClassesByTeacher(this.teacherId).subscribe({
      next: (classes) => {
        this.myClasses = classes;
        this.loadAllAnnouncements();
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.message.error('Không thể tải danh sách lớp học');
        this.loading = false;
      }
    });
  }

  loadAllAnnouncements(): void {
    if (this.myClasses.length === 0) {
      this.loading = false;
      return;
    }

    // Load announcements from all classes
    const announcementRequests = this.myClasses.map(cls =>
      this.announcementService.getAnnouncementsByClass(cls.id)
    );

    forkJoin(announcementRequests).subscribe({
      next: (results) => {
        // Combine all announcements with class info
        this.announcements = [];
        results.forEach((announcements, index) => {
          const className = this.myClasses[index].name;
          const classId = this.myClasses[index].id;

          announcements.forEach(ann => {
            this.announcements.push({
              ...ann,
              className,
              classId
            });
          });
        });

        // Sort by date (newest first)
        this.announcements.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading announcements:', error);
        this.message.error('Không thể tải thông báo');
        this.loading = false;
      }
    });
  }

  get filteredAnnouncements(): AnnouncementWithClass[] {
    let filtered = this.announcements;

    // Filter by class
    if (this.selectedClassId !== null) {
      filtered = filtered.filter(a => a.classId === this.selectedClassId);
    }

    // Filter by search text
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(search) ||
        a.content.toLowerCase().includes(search) ||
        a.className.toLowerCase().includes(search)
      );
    }

    return filtered;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  isNew(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    return hours < 24;
  }

  isMyAnnouncement(announcement: AnnouncementWithClass): boolean {
    return announcement.createdByTeacherId === this.teacherId;
  }

  goToClass(classId: number): void {
    this.router.navigate(['/teacher/classes', classId, 'announcements']);
  }

  goToClasses(): void {
    this.router.navigate(['/teacher/classes']);
  }

  clearFilter(): void {
    this.selectedClassId = null;
    this.searchText = '';
  }

  get unreadCount(): number {
    return this.announcements.filter(a => this.isNew(a.createdAt)).length;
  }

  get myAnnouncementsCount(): number {
    return this.announcements.filter(a => this.isMyAnnouncement(a)).length;
  }
}
