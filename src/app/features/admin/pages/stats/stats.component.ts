import { Component, OnInit } from '@angular/core';
import { StudentService } from '../../../../core/services/student.service';
import { TeacherService } from '../../../../core/services/teacher.service';
import { CourseService } from '../../../../core/services/course.service';
import { ClassService } from '../../../../core/services/class.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { forkJoin } from 'rxjs';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalClasses: number;
  activeClasses: number;
  totalRevenue: number;
  paidRevenue: number;
  unpaidRevenue: number;
  paymentRate: number;
}

interface CourseStats {
  id: number;
  name: string;
  studentCount: number;
  classCount: number;
  percentage: number;
}

interface TeacherStats {
  id: number;
  name: string;
  classCount: number;
  studentCount: number;
}

interface UpcomingClass {
  id: number;
  name: string;
  teacherName: string;
  schedule: string;
  studentCount: number;
  startDate: string;
}

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css', './chart-styles.css']
})
export class StatsComponent implements OnInit {
  loading = false;

  // Main statistics
  stats: DashboardStats = {
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalClasses: 0,
    activeClasses: 0,
    totalRevenue: 0,
    paidRevenue: 0,
    unpaidRevenue: 0,
    paymentRate: 0
  };

  // Course statistics
  topCourses: CourseStats[] = [];

  // Teacher statistics
  topTeachers: TeacherStats[] = [];

  // Upcoming classes
  upcomingClasses: UpcomingClass[] = [];

  // Chart data for enrollment trend
  enrollmentMonths: string[] = [];
  enrollmentValues: number[] = [];

  constructor(
    private studentService: StudentService,
    private teacherService: TeacherService,
    private courseService: CourseService,
    private classService: ClassService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    forkJoin({
      students: this.studentService.getStudents(0, 1000),
      teachers: this.teacherService.getTeachers(),
      courses: this.courseService.getCourses(0, 1000),
      classes: this.classService.getClasses(0, 1000)
    }).subscribe({
      next: (results) => {
        console.log('Dashboard data loaded:', results);
        
        // Process students - now returns paginated response
        const studentsData = (results.students as any);
        const students = studentsData?.content || studentsData || [];
        console.log('Students:', students.length);
        this.stats.totalStudents = studentsData?.totalElements || students.length;

        // Process teachers
        const teachers = Array.isArray(results.teachers)
          ? results.teachers
          : (results.teachers as any)?.content || [];
        console.log('Teachers:', teachers.length);
        this.stats.totalTeachers = teachers.length;

        // Process courses
        const courses = (results.courses as any)?.content || results.courses || [];
        console.log('Courses:', courses.length);
        this.stats.totalCourses = courses.length;

        // Process classes
        const classes = (results.classes as any)?.content || results.classes || [];
        console.log('Classes:', classes.length);
        this.stats.totalClasses = classes.length;
        this.stats.activeClasses = classes.filter((c: any) =>
          c.status === 'ACTIVE' || c.status === 'active' || c.status === 'ONGOING'
        ).length;

        // Calculate course statistics
        this.calculateCourseStats(classes, courses);

        // Calculate teacher statistics
        this.calculateTeacherStats(classes, teachers);

        // Get upcoming classes
        this.getUpcomingClasses(classes);

        // Calculate enrollment trend (mock data based on student IDs)
        this.calculateEnrollmentTrend(students);

        // Load payment statistics
        this.loadPaymentStats(classes);

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
      }
    });
  }

  loadPaymentStats(classes: any[]): void {
    if (classes.length === 0) {
      console.log('No classes found for payment stats');
      this.stats.totalRevenue = 0;
      this.stats.paidRevenue = 0;
      this.stats.unpaidRevenue = 0;
      this.stats.paymentRate = 0;
      return;
    }

    console.log('Loading payment stats for', classes.length, 'classes');
    
    // Get payment summary for all classes (limit to first 20 to avoid too many requests)
    const paymentRequests = classes.slice(0, 20).map(cls =>
      this.paymentService.getClassPaymentSummary(cls.id)
    );

    forkJoin(paymentRequests).subscribe({
      next: (summaries) => {
        console.log('Payment summaries received:', summaries);
        let totalRequired = 0;
        let totalPaid = 0;

        summaries.forEach((summary: any) => {
          if (summary && summary.students) {
            summary.students.forEach((student: any) => {
              totalRequired += student.requiredAmount || 0;
              totalPaid += student.paidAmount || 0;
            });
          }
        });

        console.log('Payment stats calculated:', { totalRequired, totalPaid });
        this.stats.totalRevenue = totalRequired;
        this.stats.paidRevenue = totalPaid;
        this.stats.unpaidRevenue = totalRequired - totalPaid;
        this.stats.paymentRate = totalRequired > 0
          ? Math.round((totalPaid / totalRequired) * 100)
          : 0;
      },
      error: (error) => {
        console.error('Error loading payment stats:', error);
      }
    });
  }

  calculateCourseStats(classes: any[], courses: any[]): void {
    const courseMap = new Map<number, { name: string; classCount: number; studentCount: number }>();

    classes.forEach((cls: any) => {
      const courseId = cls.courseId || cls.course?.id;
      const courseName = cls.courseName || cls.course?.name || 'Unknown';
      const studentCount = cls.students?.length || cls.studentCount || 0;

      if (courseId) {
        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, {
            name: courseName,
            classCount: 0,
            studentCount: 0
          });
        }
        const stats = courseMap.get(courseId)!;
        stats.classCount++;
        stats.studentCount += studentCount;
      }
    });

    const totalStudents = Array.from(courseMap.values())
      .reduce((sum, c) => sum + c.studentCount, 0);

    this.topCourses = Array.from(courseMap.entries())
      .map(([id, stats]) => ({
        id,
        name: stats.name,
        studentCount: stats.studentCount,
        classCount: stats.classCount,
        percentage: totalStudents > 0 ? (stats.studentCount / totalStudents) * 100 : 0
      }))
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 5);
  }

  calculateTeacherStats(classes: any[], teachers: any[]): void {
    const teacherMap = new Map<number, { name: string; classCount: number; studentCount: number }>();

    classes.forEach((cls: any) => {
      const teacherId = cls.teacherId || cls.teacher?.id;
      const teacherName = cls.teacherName || cls.teacher?.fullName || 'Unknown';
      const studentCount = cls.students?.length || cls.studentCount || 0;

      if (teacherId) {
        if (!teacherMap.has(teacherId)) {
          teacherMap.set(teacherId, {
            name: teacherName,
            classCount: 0,
            studentCount: 0
          });
        }
        const stats = teacherMap.get(teacherId)!;
        stats.classCount++;
        stats.studentCount += studentCount;
      }
    });

    this.topTeachers = Array.from(teacherMap.entries())
      .map(([id, stats]) => ({
        id,
        name: stats.name,
        classCount: stats.classCount,
        studentCount: stats.studentCount
      }))
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 5);
  }

  getUpcomingClasses(classes: any[]): void {
    const now = new Date();

    this.upcomingClasses = classes
      .filter((cls: any) => {
        const startDate = new Date(cls.startDate);
        return startDate >= now;
      })
      .sort((a: any, b: any) => {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      })
      .slice(0, 5)
      .map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        teacherName: cls.teacherName || cls.teacher?.fullName || 'Chưa có',
        schedule: this.formatSchedule(cls),
        studentCount: cls.students?.length || cls.studentCount || 0,
        startDate: cls.startDate
      }));
  }

  formatSchedule(cls: any): string {
    if (cls.fixedSchedule) {
      const days = cls.fixedSchedule.daysOfWeek || '';
      const time = cls.fixedSchedule.startTime
        ? `${cls.fixedSchedule.startTime.substring(0, 5)}`
        : '';
      return `${this.formatDays(days)} - ${time}`;
    }
    return 'Chưa xác định';
  }

  formatDays(daysOfWeek: string): string {
    if (!daysOfWeek) return '';
    const dayMap: { [key: string]: string } = {
      '2': 'T2', '3': 'T3', '4': 'T4', '5': 'T5',
      '6': 'T6', '7': 'T7', '8': 'CN'
    };
    return daysOfWeek.split(',').map(d => dayMap[d.trim()] || d).join(', ');
  }

  calculateEnrollmentTrend(students: any[]): void {
    const monthCounts = new Map<string, number>();
    const now = new Date();

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `Tháng ${date.getMonth() + 1}`;
      this.enrollmentMonths.push(label);
      monthCounts.set(key, 0);
    }

    // Count students by joined month
    students.forEach((student: any) => {
      if (student.joinedAt) {
        const joinDate = new Date(student.joinedAt);
        const key = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthCounts.has(key)) {
          monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
        }
      }
    });

    this.enrollmentValues = Array.from(monthCounts.values());
  }

  getMaxEnrollment(): number {
    return Math.max(...this.enrollmentValues, 1);
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  }
}
