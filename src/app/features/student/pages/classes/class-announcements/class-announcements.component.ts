import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AnnouncementService } from '../../../../../core/services/announcement.service';
import { ClassService } from '../../../../../core/services/class.service';
import { Announcement } from '../../../../../core/models/announcement.model';

@Component({
  selector: 'app-student-class-announcements',
  templateUrl: './class-announcements.component.html',
  styleUrls: ['./class-announcements.component.css']
})
export class StudentClassAnnouncementsComponent implements OnInit {
  classId!: number;
  classInfo?: any;
  announcements: Announcement[] = [];
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private announcementService: AnnouncementService,
    private classService: ClassService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.classId = +params.get('id')!;
      this.loadClassInfo();
      this.loadAnnouncements();
    });
  }

  loadClassInfo(): void {
    this.classService.getClass(this.classId).subscribe({
      next: (data) => {
        this.classInfo = data;
      },
      error: (error) => {
        console.error('Error loading class info:', error);
        this.message.error('Không thể tải thông tin lớp học');
      }
    });
  }

  loadAnnouncements(): void {
    this.loading = true;
    this.announcementService.getAnnouncementsByClass(this.classId).subscribe({
      next: (data) => {
        this.announcements = data.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading announcements:', error);
        this.message.error('Không thể tải danh sách thông báo');
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/student/classes', this.classId, 'overview']);
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
    return hours < 24; // New if less than 24 hours old
  }
}
