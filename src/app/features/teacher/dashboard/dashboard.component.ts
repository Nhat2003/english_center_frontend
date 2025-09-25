import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-teacher-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class TeacherDashboardComponent implements OnInit {
  currentUser: User | null = null;

  // Demo data
  stats = {
    totalClasses: 3,
    totalStudents: 45,
    todayClasses: 2,
    pendingAssessments: 8
  };

  todaySchedule = [
    {
      time: '08:00 - 09:30',
      class: 'Lớp A1 - Beginner',
      room: 'Phòng 101',
      students: 15
    },
    {
      time: '10:00 - 11:30',
      class: 'Lớp B2 - Intermediate',
      room: 'Phòng 203',
      students: 18
    },
    {
      time: '14:00 - 15:30',
      class: 'Lớp C1 - Advanced',
      room: 'Phòng 105',
      students: 12
    }
  ];

  recentActivities = [
    {
      action: 'Điểm danh lớp A1',
      time: '2 giờ trước',
      type: 'attendance'
    },
    {
      action: 'Cập nhật điểm kiểm tra lớp B2',
      time: '1 ngày trước',
      type: 'assessment'
    },
    {
      action: 'Thêm bài tập cho lớp C1',
      time: '2 ngày trước',
      type: 'assignment'
    }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }
}
