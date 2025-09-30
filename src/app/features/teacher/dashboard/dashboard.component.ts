import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class TeacherDashboardComponent implements OnInit {
  currentUser: User | null = null;
  currentTime = new Date();

  // Teacher Statistics
  teacherStats = {
    totalClasses: 5,
    totalStudents: 78,
    todayClasses: 3,
    pendingTasks: 12
  };

  // Today's Schedule
  todaySchedule = [
    {
      time: '08:00 - 09:30',
      duration: '90 phút',
      className: 'Lớp A1 - Basic English',
      room: 'Phòng 101 (Online)',
      studentCount: 15,
      hasOnlineLink: true
    },
    {
      time: '10:00 - 11:30',
      duration: '90 phút',
      className: 'Lớp B2 - Intermediate',
      room: 'Phòng 203',
      studentCount: 18,
      hasOnlineLink: false
    },
    {
      time: '14:00 - 15:30',
      duration: '90 phút',
      className: 'Lớp C1 - Advanced Conversation',
      room: 'Phòng 105 (Online)',
      studentCount: 12,
      hasOnlineLink: true
    }
  ];

  // Admin Notifications
  adminNotifications = [
    {
      title: '📋 Cập nhật quy định mới về đánh giá học sinh',
      content: 'Ban quản lý yêu cầu tất cả giáo viên áp dụng thang điểm mới từ tuần sau.',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      title: '🎉 Thông báo nghỉ lễ Quốc khánh',
      content: 'Trung tâm sẽ nghỉ lễ Quốc khánh từ ngày 2/9 đến 4/9.',
      time: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
      title: '📚 Tập huấn sử dụng nền tảng giảng dạy mới',
      content: 'Cuộc họp tập huấn sẽ diễn ra vào thứ 6 tuần này.',
      time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    }
  ];

  // Pending Tasks
  pendingTasks = [
    { title: 'Bài tập chưa chấm', count: 8, priority: 'Cao' },
    { title: 'Điểm danh cần cập nhật', count: 3, priority: 'Trung bình' },
    { title: 'Báo cáo tiến độ học tập', count: 2, priority: 'Thấp' },
    { title: 'Phản hồi từ phụ huynh', count: 1, priority: 'Cao' }
  ];

  // Quick Actions
  quickActions = [
    {
      emoji: '📝',
      title: 'Tạo bài tập mới',
      description: 'Giao bài tập cho lớp học',
      color: '#1890ff',
      action: 'create-assignment'
    },
    {
      emoji: '✅',
      title: 'Điểm danh nhanh',
      description: 'Điểm danh cho buổi học hiện tại',
      color: '#52c41a',
      action: 'quick-attendance'
    },
    {
      emoji: '📊',
      title: 'Nhập điểm số',
      description: 'Cập nhật điểm kiểm tra',
      color: '#faad14',
      action: 'enter-scores'
    },
    {
      emoji: '📢',
      title: 'Gửi thông báo',
      description: 'Thông báo cho học sinh/phụ huynh',
      color: '#722ed1',
      action: 'send-notification'
    },
    {
      emoji: '📚',
      title: 'Quản lý tài liệu',
      description: 'Upload tài liệu giảng dạy',
      color: '#13c2c2',
      action: 'manage-materials'
    },
    {
      emoji: '🎥',
      title: 'Tạo phòng học online',
      description: 'Tạo link học trực tuyến',
      color: '#eb2f96',
      action: 'create-online-room'
    },
    {
      emoji: '📈',
      title: 'Xem báo cáo',
      description: 'Theo dõi tiến độ học tập',
      color: '#fa8c16',
      action: 'view-reports'
    },
    {
      emoji: '💬',
      title: 'Trao đổi với admin',
      description: 'Liên hệ ban quản lý',
      color: '#2f54eb',
      action: 'contact-admin'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Update current time every minute
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  getTaskColor(priority: string): string {
    switch (priority) {
      case 'Cao': return 'red';
      case 'Trung bình': return 'orange';
      case 'Thấp': return 'green';
      default: return 'default';
    }
  }

  executeQuickAction(action: string) {
    switch (action) {
      case 'create-assignment':
        this.router.navigate(['/teacher/assignments']);
        break;
      case 'quick-attendance':
        // Quick attendance logic
        console.log('Quick attendance');
        break;
      case 'enter-scores':
        // Enter scores logic
        console.log('Enter scores');
        break;
      case 'send-notification':
        this.router.navigate(['/teacher/notifications']);
        break;
      case 'manage-materials':
        this.router.navigate(['/teacher/materials']);
        break;
      case 'create-online-room':
        this.router.navigate(['/teacher/online-classes']);
        break;
      case 'view-reports':
        // View reports logic
        console.log('View reports');
        break;
      case 'contact-admin':
        // Contact admin logic
        console.log('Contact admin');
        break;
      default:
        console.log('Unknown action:', action);
    }
  }
}
