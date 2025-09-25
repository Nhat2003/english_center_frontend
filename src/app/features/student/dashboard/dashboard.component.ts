import { Component, OnInit } from '@angular/core';
import { AuthService, User } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  currentUser: User | null = null;

  studentStats = {
    enrolledCourses: 3,
    upcomingClasses: 5,
    pendingAssignments: 2,
    averageGrade: 8.5
  };

  todaySchedule = [
    {
      time: '08:00 - 09:30',
      subject: 'English Grammar',
      teacher: 'Mrs. Smith',
      room: 'Phòng 101',
      status: 'upcoming'
    },
    {
      time: '14:00 - 15:30',
      subject: 'IELTS Speaking',
      teacher: 'Mr. Johnson',
      room: 'Phòng 203',
      status: 'upcoming'
    }
  ];

  feeStatus = [
    {
      course: 'English Basic A1',
      amount: '2.000.000 VND',
      status: 'paid'
    },
    {
      course: 'IELTS Preparation',
      amount: '3.500.000 VND',
      status: 'pending'
    }
  ];

  recentGrades = [
    {
      subject: 'English Grammar',
      score: 8.5,
      date: '2 ngày trước'
    },
    {
      subject: 'Vocabulary Test',
      score: 9.0,
      date: '5 ngày trước'
    },
    {
      subject: 'Speaking Practice',
      score: 7.5,
      date: '1 tuần trước'
    }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  getGradeColor(score: number): string {
    if (score >= 9) return 'excellent';
    if (score >= 8) return 'good';
    if (score >= 6.5) return 'average';
    return 'poor';
  }
}
