import { Component, OnInit } from '@angular/core';
import { StudentService } from '../../../../core/services/student.service';
import { TeacherService } from '../../../../core/services/teacher.service';
import { CourseService } from '../../../../core/services/course.service';
import { ClassService } from '../../../../core/services/class.service';

interface Activity {
  id: string;
  type: 'student' | 'teacher' | 'course' | 'class';
  description: string;
  timestamp: Date;
}

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css', './chart-styles.css']
})
export class StatsComponent implements OnInit {

  // Date filter
  dateRange: Date[] = [];

  // Overview stats
  totalStudents = 0;
  totalTeachers = 0;
  totalCourses = 0;
  totalClasses = 0;

  // Growth percentages
  studentGrowth = 0;
  teacherGrowth = 0;
  courseGrowth = 0;
  classGrowth = 0;

  // Chart data
  enrollmentPeriod = '6months';
  enrollmentData = [
    { label: 'Tháng 4', value: 12, percentage: 60 },
    { label: 'Tháng 5', value: 19, percentage: 95 },
    { label: 'Tháng 6', value: 8, percentage: 40 },
    { label: 'Tháng 7', value: 15, percentage: 75 },
    { label: 'Tháng 8', value: 23, percentage: 100 },
    { label: 'Tháng 9', value: 18, percentage: 90 }
  ];

  popularCourses = [
    { name: 'Tiếng Anh Giao tiếp', percentage: 35, color: '#1890ff' },
    { name: 'IELTS/TOEFL', percentage: 25, color: '#52c41a' },
    { name: 'Tiếng Anh Trẻ em', percentage: 20, color: '#faad14' },
    { name: 'Tiếng Anh Doanh nghiệp', percentage: 20, color: '#f5222d' }
  ];

  // Recent activities
  recentActivities: Activity[] = [];

  // Quick stats
  activeStudents = 0;
  ongoingClasses = 0;
  monthlyRevenue = 0;
  completionRate = 0;

  constructor(
    private studentService: StudentService,
    private teacherService: TeacherService,
    private courseService: CourseService,
    private classService: ClassService
  ) {
    // Set default date range (last 30 days)
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);
    this.dateRange = [lastMonth, today];
  }

  ngOnInit(): void {
    this.loadAllData();
    this.generateMockActivities();
  }

  loadAllData(): void {
    // Load students
    this.studentService.getStudents().subscribe({
      next: (students) => {
        this.totalStudents = students.length;
        this.activeStudents = students.length; // All students are considered active
        this.studentGrowth = this.calculateGrowth(students.length, students.length - 5); // Mock growth
      },
      error: (err) => console.error('Error loading students:', err)
    });

    // Load teachers
    this.teacherService.getTeachers().subscribe({
      next: (teachers) => {
        this.totalTeachers = teachers.length;
        this.teacherGrowth = this.calculateGrowth(teachers.length, teachers.length - 2);
      },
      error: (err) => console.error('Error loading teachers:', err)
    });

    // Load courses
    this.courseService.getCourses().subscribe({
      next: (courses) => {
        this.totalCourses = courses.length;
        this.courseGrowth = this.calculateGrowth(courses.length, courses.length - 3);
      },
      error: (err) => console.error('Error loading courses:', err)
    });

    // Load classes
    this.classService.getClasses().subscribe({
      next: (classes) => {
        this.totalClasses = classes.length;
        this.ongoingClasses = classes.filter(c => c.status === 'ongoing').length;
        this.classGrowth = this.calculateGrowth(classes.length, classes.length - 1);
      },
      error: (err) => console.error('Error loading classes:', err)
    });

    // Mock additional data
    this.monthlyRevenue = 125000000; // 125 million VND
    this.completionRate = 89;
  }

  calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }



  generateMockActivities(): void {
    this.recentActivities = [
      {
        id: '1',
        type: 'student',
        description: 'Nguyễn Văn A đã đăng ký khóa học IELTS',
        timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        id: '2',
        type: 'class',
        description: 'Lớp Tiếng Anh Giao tiếp A1 đã bắt đầu',
        timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        id: '3',
        type: 'teacher',
        description: 'Cô Minh đã cập nhật lịch dạy',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: '4',
        type: 'course',
        description: 'Khóa học mới "Tiếng Anh cho Du lịch" đã được thêm',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      }
    ];
  }

  onDateRangeChange(dates: Date[]): void {
    this.dateRange = dates;
    // Reload data based on date range
    this.refreshData();
  }

  refreshData(): void {
    this.loadAllData();
    this.generateMockActivities();
  }

  updateEnrollmentChart(): void {
    // Update enrollment data based on selected period
    console.log('Updating enrollment chart for period:', this.enrollmentPeriod);
  }

  viewAllActivities(): void {
    // Navigate to activities page or open modal
    console.log('View all activities');
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'student': return 'user';
      case 'teacher': return 'team';
      case 'course': return 'book';
      case 'class': return 'schedule';
      default: return 'info';
    }
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 60) {
      return `${minutes} phút trước`;
    } else if (hours < 24) {
      return `${hours} giờ trước`;
    } else {
      return timestamp.toLocaleDateString('vi-VN');
    }
  }
}
