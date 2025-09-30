import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  currentUser: User | null = null;

  // Buổi học tiếp theo
  nextClass = {
    subject: 'English Conversation',
    time: '09:00 - 10:30',
    date: 'Thứ 2, 30/09/2025',
    teacher: 'Mrs. Smith',
    onlineLink: 'https://zoom.us/j/123456789'
  };

  // Bài tập cần nộp
  pendingAssignments = 3;
  nearestDeadline = '02/10/2025';

  // Tình trạng học phí
  tuitionStatus = {
    isPaid: false,
    status: 'Chưa đóng học phí tháng 10',
    amount: 2500000
  };

  // Thông báo mới nhất
  latestNotifications = [
    {
      title: 'Thay đổi lịch học tuần tới',
      message: 'Lớp English Conversation thứ 3 sẽ chuyển từ 9h sang 14h.',
      date: '28/09/2025',
      sender: 'Phòng Đào tạo',
      type: 'urgent'
    },
    {
      title: 'Kỳ thi giữa khóa sắp tới',
      message: 'Kỳ thi giữa khóa sẽ diễn ra từ ngày 15-20/10/2025.',
      date: '25/09/2025',
      sender: 'Mrs. Johnson',
      type: 'normal'
    },
    {
      title: 'Nhắc nhở nộp học phí',
      message: 'Học phí tháng 10 sắp đến hạn, vui lòng thanh toán trước ngày 05/10.',
      date: '23/09/2025',
      sender: 'Phòng Tài chính',
      type: 'urgent'
    }
  ];

  // Các khóa học đang theo học
  studyCourses = [
    {
      name: 'English Basic A1',
      className: 'ENG-A1-01',
      teacher: 'Mrs. Smith',
      progress: 75,
      completedLessons: 18,
      totalLessons: 24
    },
    {
      name: 'IELTS Preparation',
      className: 'IELTS-P-02',
      teacher: 'Mr. Johnson',
      progress: 45,
      completedLessons: 9,
      totalLessons: 20
    }
  ];

  // Lịch học tuần này
  weeklySchedule = [
    {
      day: 'T2',
      date: '30/09',
      subject: 'English Conversation',
      time: '09:00 - 10:30',
      teacher: 'Mrs. Smith',
      room: 'Phòng 201',
      hasOnlineLink: true
    },
    {
      day: 'T4',
      date: '02/10',
      subject: 'IELTS Writing',
      time: '14:00 - 15:30',
      teacher: 'Mr. Johnson',
      room: 'Phòng 102',
      hasOnlineLink: true
    },
    {
      day: 'T6',
      date: '04/10',
      subject: 'Grammar Review',
      time: '16:00 - 17:30',
      teacher: 'Ms. Brown',
      room: 'Phòng 105',
      hasOnlineLink: false
    }
  ];

  // Quick actions với emoji
  quickActions = [
    {
      title: 'Lịch học',
      description: 'Xem lịch học đầy đủ',
      emoji: '📅',
      link: '/student/schedule'
    },
    {
      title: 'Bài tập',
      description: 'Làm và nộp bài tập',
      emoji: '📝',
      link: '/student/assignments'
    },
    {
      title: 'Học phí',
      description: 'Thanh toán học phí',
      emoji: '💳',
      link: '/student/payments'
    },
    {
      title: 'Phòng học',
      description: 'Vào lớp học online',
      emoji: '🎥',
      link: '/student/online-classes'
    },
    {
      title: 'Tài liệu',
      description: 'Tải tài liệu học tập',
      emoji: '📚',
      link: '/student/documents'
    },
    {
      title: 'Thông báo',
      description: 'Xem thông báo mới',
      emoji: '📢',
      link: '/student/notifications'
    }
  ];

  currentCourses = [
    {
      name: 'English Basic A1',
      level: 'Cơ bản',
      teacher: 'Mrs. Smith',
      progress: 75,
      completedLessons: 18,
      totalLessons: 24,
      averageScore: 8.2,
      className: 'ENG-A1-01'
    },
    {
      name: 'IELTS Preparation',
      level: 'Trung cấp',
      teacher: 'Mr. Johnson',
      progress: 45,
      completedLessons: 9,
      totalLessons: 20,
      averageScore: 8.8,
      className: 'IELTS-P-02'
    }
  ];

  recentActivities = [
    {
      type: 'assignment',
      icon: 'book',
      title: 'Hoàn thành bài tập Grammar',
      description: 'Bài tập về Present Perfect Tense',
      time: new Date('2025-09-25T14:30:00')
    },
    {
      type: 'grade',
      icon: 'trophy',
      title: 'Nhận điểm Speaking',
      description: 'Điểm số: 8.5/10 - Xuất sắc!',
      time: new Date('2025-09-24T16:00:00')
    },
    {
      type: 'lesson',
      icon: 'play-circle',
      title: 'Tham gia lớp học',
      description: 'IELTS Speaking Practice',
      time: new Date('2025-09-24T09:00:00')
    }
  ];

  upcomingEvents = [
    {
      title: 'Kiểm tra giữa kỳ',
      description: 'Grammar & Vocabulary Test',
      date: new Date('2025-09-28T09:00:00'),
      time: '09:00 - 10:30',
      location: 'Phòng 101'
    },
    {
      title: 'Lớp học Speaking',
      description: 'IELTS Speaking Practice',
      date: new Date('2025-09-29T14:00:00'),
      time: '14:00 - 15:30',
      location: 'Phòng 203'
    }
  ];

  earnedBadges = [
    { name: 'Học sinh xuất sắc', icon: 'star', color: '#ffd700' },
    { name: 'Siêu học tập', icon: 'fire', color: '#ff4d4f' },
    { name: 'Hoàn thành khóa học', icon: 'trophy', color: '#52c41a' },
    { name: 'Tham gia tích cực', icon: 'heart', color: '#1890ff' }
  ];

  nextAssignment = {
    title: 'Essay Writing Practice',
    subject: 'IELTS Writing',
    dueDate: new Date('2025-09-30T23:59:00')
  };

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  getGradeColor(score: number): string {
    if (score >= 9) return 'excellent';
    if (score >= 8) return 'good';
    if (score >= 6.5) return 'average';
    return 'poor';
  }
}
