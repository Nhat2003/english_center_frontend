import { Component, OnInit } from '@angular/core';
import { PaymentService } from '../../../../../core/services/payment.service';
import { ClassService } from '../../../../../core/services/class.service';
import { NzMessageService } from 'ng-zorro-antd/message';

interface ClassPaymentSummary {
  classRoomId: number;
  count: number;
  countSuccess: number;
  countFailed: number;
  countPending: number;
  total: number;
  totalSuccess: number;
  totalFailed: number;
  totalPending: number;
  currency: string;
  students: StudentPaymentStatus[];
}

interface StudentPaymentStatus {
  studentId: number;
  studentName: string;
  paidAmount: number;
  requiredAmount: number;
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  latestPaymentStatus: 'SUCCESS' | 'PENDING' | 'FAILED' | null;
  paidAt?: string;
}

interface ClassInfo {
  id: number;
  name: string;
  courseName?: string;
  studentCount?: number;
}

@Component({
  selector: 'app-class-payments',
  templateUrl: './class-payments.component.html',
  styleUrls: ['./class-payments.component.css']
})
export class ClassPaymentsComponent implements OnInit {
  loading = false;
  loadingSummary = false;
  loadingHistory = false;

  // Danh sách lớp
  classes: ClassInfo[] = [];
  selectedClassId: number | null = null;
  selectedClassName: string = '';

  // Thống kê thanh toán
  paymentSummary: ClassPaymentSummary | null = null;

  // Filter và search
  searchText = '';
  statusFilter: string = 'ALL';

  // Modal chi tiết thanh toán
  isDetailModalVisible = false;
  selectedStudent: StudentPaymentStatus | null = null;
  paymentHistory: any[] = [];
  detailModalTitle = '';

  constructor(
    private paymentService: PaymentService,
    private classService: ClassService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    this.loading = true;
    this.classService.getClasses(0, 1000).subscribe({
      next: (response) => {
        // Backend có thể trả về response.content hoặc response.data hoặc trực tiếp là array
        const classesData = response.content || response.data || response || [];
        this.classes = classesData.map((cls: any) => ({
          id: cls.id,
          name: cls.name,
          courseName: cls.course?.name,
          studentCount: cls.students?.length || 0
        }));

        this.loading = false;

        // Tự động chọn lớp đầu tiên nếu có
        if (this.classes.length > 0) {
          this.selectClass(this.classes[0]);
        } else {
          }
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.message.error('Không thể tải danh sách lớp');
        this.loading = false;
      }
    });
  }

  selectClass(cls: ClassInfo): void {
    this.selectedClassId = cls.id;
    this.selectedClassName = cls.name;
    this.loadPaymentSummary();
  }

  loadPaymentSummary(): void {
    if (!this.selectedClassId) return;

    this.loadingSummary = true;
    this.paymentService.getClassPaymentSummary(this.selectedClassId).subscribe({
      next: (summary) => {
        // Fix: Tính lại count và total theo số học sinh thực tế trong lớp
        if (summary && summary.students) {
          summary.count = summary.students.length;
          summary.total = summary.students.reduce((sum, s) => sum + s.requiredAmount, 0);
          summary.totalSuccess = summary.students.reduce((sum, s) => sum + s.paidAmount, 0);
          summary.totalPending = summary.total - summary.totalSuccess;
          summary.countSuccess = summary.students.filter(s => s.paymentStatus === 'PAID').length;
          summary.countPending = summary.students.filter(s => s.paymentStatus === 'PARTIAL').length;
          summary.countFailed = summary.students.filter(s => s.paymentStatus === 'UNPAID').length;
        }

        this.paymentSummary = summary;
        this.loadingSummary = false;
      },
      error: (error) => {
        console.error('Error loading payment summary:', error);
        this.message.error('Không thể tải thông tin thanh toán của lớp');
        this.loadingSummary = false;
        this.paymentSummary = null;
      }
    });
  }

  get filteredStudents(): StudentPaymentStatus[] {
    if (!this.paymentSummary) return [];

    let students = this.paymentSummary.students;

    // Filter by status
    if (this.statusFilter !== 'ALL') {
      students = students.filter(s => s.paymentStatus === this.statusFilter);
    }

    // Filter by search text
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      students = students.filter(s =>
        s.studentName.toLowerCase().includes(search) ||
        s.studentId.toString().includes(search)
      );
    }

    return students;
  }

  getPaymentProgress(student: StudentPaymentStatus): number {
    if (student.requiredAmount === 0) return 100;
    return Math.round((student.paidAmount / student.requiredAmount) * 100);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PAID': return 'success';
      case 'UNPAID': return 'error';
      case 'PARTIAL': return 'warning';
      case 'SUCCESS': return 'success';
      case 'PENDING': return 'processing';
      case 'FAILED': return 'error';``
      default: return 'default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PAID': return 'Đã đóng đủ';
      case 'UNPAID': return 'Chưa đóng';
      case 'SUCCESS': return 'Thành công';
      case 'PENDING': return 'Đang xử lý';
      case 'FAILED': return 'Thất bại';
      default: return status;
    }
  }

  exportToExcel(): void {
    this.message.info('Chức năng xuất Excel đang được phát triển');
  }

  refresh(): void {
    this.loadPaymentSummary();
  }

  viewStudentPaymentDetail(student: StudentPaymentStatus): void {
    this.selectedStudent = student;
    this.detailModalTitle = `Chi tiết thanh toán - ${student.studentName}`;
    this.isDetailModalVisible = true;
    this.loadPaymentHistory(student.studentId);
  }

  loadPaymentHistory(studentId: number): void {
    this.loadingHistory = true;
    this.paymentService.getPaymentHistory(studentId).subscribe({
      next: (history) => {
        this.paymentHistory = history;
        this.loadingHistory = false;
      },
      error: (error) => {
        console.error('Error loading payment history:', error);
        this.message.error('Không thể tải lịch sử thanh toán');
        this.loadingHistory = false;
        this.paymentHistory = [];
      }
    });
  }

  closeDetailModal(): void {
    this.isDetailModalVisible = false;
    this.selectedStudent = null;
    this.paymentHistory = [];
  }
}
