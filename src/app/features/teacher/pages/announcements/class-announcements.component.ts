import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AnnouncementService } from '../../../../core/services/announcement.service';
import { ClassService } from '../../../../core/services/class.service';
import { Announcement } from '../../../../core/models/announcement.model';
import { Class } from '../../../../core/models/class.model';

@Component({
  selector: 'app-class-announcements',
  templateUrl: './class-announcements.component.html',
  styleUrls: ['./class-announcements.component.css']
})
export class ClassAnnouncementsComponent implements OnInit {
  classId!: number;
  classInfo?: Class;
  announcements: Announcement[] = [];
  loading = false;

  // Modal tạo thông báo
  isCreateModalVisible = false;
  newAnnouncementMessage = '';
  isCreating = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private announcementService: AnnouncementService,
    private classService: ClassService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.classId = +params['classId'];
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

  showCreateModal(): void {
    this.newAnnouncementMessage = '';
    this.isCreateModalVisible = true;
  }

  handleCreateCancel(): void {
    this.isCreateModalVisible = false;
    this.newAnnouncementMessage = '';
  }

  handleCreateOk(): void {
    if (!this.newAnnouncementMessage.trim()) {
      this.message.warning('Vui lòng nhập nội dung thông báo');
      return;
    }

    this.isCreating = true;
    this.announcementService.createAnnouncement(this.classId, {
      message: this.newAnnouncementMessage
    }).subscribe({
      next: (announcement) => {
        this.message.success('Tạo thông báo thành công');
        this.isCreateModalVisible = false;
        this.newAnnouncementMessage = '';
        this.loadAnnouncements(); // Reload danh sách
        this.isCreating = false;
      },
      error: (error) => {
        console.error('Error creating announcement:', error);
        this.message.error('Không thể tạo thông báo');
        this.isCreating = false;
      }
    });
  }

  deleteAnnouncement(announcement: Announcement): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa thông báo này?',
      nzOkText: 'Xóa',
      nzOkType: 'danger',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        return new Promise((resolve, reject) => {
          this.announcementService.deleteAnnouncement(this.classId, announcement.id).subscribe({
            next: () => {
              this.message.success('Xóa thông báo thành công');
              this.loadAnnouncements();
              resolve();
            },
            error: (error) => {
              console.error('Error deleting announcement:', error);
              this.message.error('Không thể xóa thông báo');
              reject();
            }
          });
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/teacher/classes', this.classId]);
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
}
