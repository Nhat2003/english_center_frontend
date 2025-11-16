
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-student-payment',
  templateUrl: './student-payment.component.html',
  styleUrls: ['./student-payment.component.css']
})
export class StudentPaymentComponent implements OnInit {
  loading = false;
  studentId: number | null = null;
  classRoomId: number | null = null;
  className: string = '';
  courseName: string = '';
  amount: number | null = null;
  currency: string = 'VND';
  fee: number | null = null;
  classes: any[] = [];
  paid = false;
  paymentHistory: any[] = [];
  paidAmount: number | null = null;

  constructor(
    private authService: AuthService,
    private paymentService: PaymentService,
    private route: ActivatedRoute,
    private router: Router,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.studentId = user?.student?.id || null;

    // Bước 3: Xử lý kết quả thanh toán từ VNPAY Return URL
    // VNPAY redirect về: vnp_ReturnUrlFrontend?status=...&paymentId=...&classRoomId=...&vnp_*
    // Backend đã xử lý DB ở /payments/return trước khi redirect về FE
    // FE chỉ việc đọc status và hiển thị, sau đó làm mới dữ liệu
    this.route.queryParams.subscribe(params => {
      const status = params['status'];
      const paymentId = params['paymentId'];
      const classRoomIdParam = params['classRoomId'];

      // Bước 4: Luôn gọi GET /payments/due-for-student để làm mới công nợ
      if (this.studentId) {
        this.paymentService.getDueForStudent(this.studentId).subscribe(res => {
          // Lọc chỉ lấy các lớp chưa thanh toán
          this.classes = (res || []).filter((cls: any) => !cls.isPaid);

          // Nếu không còn lớp nào cần thanh toán, load lịch sử
          if (this.classes.length === 0) {
            this.loadPaymentHistory();
          }

          // Hiển thị thông báo kết quả thanh toán sau khi load xong dữ liệu
          if (status === 'success') {
            this.message.success('Thanh toán thành công!');
            // Bước 5: (Khuyến nghị) Gọi GET /payments/{paymentId} để xác nhận
            // Đợi 500ms để đảm bảo backend đã xử lý xong IPN/Return
            setTimeout(() => {
              if (paymentId && this.studentId) {
                // Gọi API kiểm tra trạng thái payment cụ thể
                this.checkPaymentStatus(paymentId, classRoomIdParam);
              } else if (classRoomIdParam && this.studentId) {
                // Fallback: reload trạng thái theo class
                const foundClass = this.classes.find(c => c.classRoomId == +classRoomIdParam);
                if (foundClass) {
                  this.selectClass(foundClass);
                } else if (this.classes.length > 0) {
                  this.selectClass(this.classes[0]);
                }
              }
            }, 500);
          } else if (status === 'failed') {
            this.message.error('Thanh toán thất bại. Vui lòng thử lại!');
            if (this.classes.length > 0) {
              const foundClass = classRoomIdParam ?
                this.classes.find(c => c.classRoomId == +classRoomIdParam) : null;
              if (foundClass) {
                this.selectClass(foundClass);
              } else {
                this.selectClass(this.classes[0]);
              }
            }
          } else {
            // Không có status từ callback, load bình thường
            if (this.classes.length > 0) {
              const foundClass = classRoomIdParam ?
                this.classes.find(c => c.classRoomId == +classRoomIdParam) : null;
              if (foundClass) {
                this.selectClass(foundClass);
              } else {
                this.selectClass(this.classes[0]);
              }
            }
          }

          // Clear query params sau khi xử lý
          if (status || paymentId) {
            this.router.navigate([], {
              queryParams: {},
              replaceUrl: true
            });
          }
        });
      }
    });
  }

  checkPaymentStatus(paymentId: string, classRoomIdParam?: string) {
    if (!this.studentId) return;

    const paymentIdNum = parseInt(paymentId, 10);
    if (isNaN(paymentIdNum)) {
      // Nếu paymentId không hợp lệ, fallback về cách cũ
      this.reloadClassData(classRoomIdParam);
      return;
    }

    // Gọi API kiểm tra trạng thái payment theo ID
    this.paymentService.getPaymentById(paymentIdNum).subscribe({
      next: (payment) => {
        if (payment && payment.status === 'COMPLETED') {
          // Payment đã được xác nhận thành công
          this.message.success('Đã xác nhận thanh toán thành công!');
          this.reloadClassData(classRoomIdParam);
        } else if (payment && payment.status === 'PENDING') {
          // Payment vẫn đang pending
          this.message.warning('Đang chờ xác nhận thanh toán...');
          this.reloadClassData(classRoomIdParam);
        } else {
          // Payment failed
          this.message.error('Thanh toán thất bại!');
          this.reloadClassData(classRoomIdParam);
        }
      },
      error: () => {
        // Nếu API lỗi, fallback về cách cũ
        this.message.warning('Không thể kiểm tra trạng thái thanh toán');
        this.reloadClassData(classRoomIdParam);
      }
    });
  }

  private reloadClassData(classRoomIdParam?: string) {
    if (!this.studentId) return;

    // Reload lại danh sách lớp để cập nhật trạng thái
    this.paymentService.getDueForStudent(this.studentId).subscribe(res => {
      // Lọc chỉ lấy các lớp chưa thanh toán
      this.classes = (res || []).filter((cls: any) => !cls.isPaid);

      // Nếu không còn lớp nào cần thanh toán, load lịch sử
      if (this.classes.length === 0) {
        this.loadPaymentHistory();
        return;
      }

      // Chọn lớp vừa thanh toán hoặc lớp đầu tiên
      if (classRoomIdParam) {
        const foundClass = this.classes.find(c => c.classRoomId == +classRoomIdParam);
        if (foundClass) {
          this.selectClass(foundClass);
        } else if (this.classes.length > 0) {
          this.selectClass(this.classes[0]);
        }
      } else if (this.classes.length > 0) {
        this.selectClass(this.classes[0]);
      }
    });
  }

  loadPaymentHistory() {
    if (!this.studentId) return;

    // Gọi API lấy lịch sử thanh toán
    this.paymentService.getPaymentHistory(this.studentId).subscribe({
      next: (history) => {
        this.paymentHistory = history || [];
        // Reset các field khác
        this.classRoomId = null;
        this.className = '';
        this.courseName = '';
        this.fee = null;
        this.amount = null;
        this.paid = true; // Đã thanh toán hết
        this.paidAmount = null;
      },
      error: (err) => {
        console.error('Error loading payment history:', err);
        this.message.error('Không thể tải lịch sử thanh toán');
      }
    });
  }

  selectClass(cls: any) {
    this.classRoomId = cls.classRoomId;
    this.className = cls.className;
    this.courseName = cls.courseName || ''; // API không trả courseName, để trống
    this.fee = cls.amount;
    this.amount = cls.amount;
    this.currency = cls.currency || 'VND';

    // Sử dụng trực tiếp dữ liệu từ API response
    this.paid = cls.isPaid || false;
    this.paidAmount = cls.paidAmount || 0;

    // Load payment history nếu đã thanh toán
    if (this.paid && this.studentId && this.classRoomId) {
      this.paymentService.getPaymentStatusByStudentAndClass(this.studentId, this.classRoomId).subscribe(res => {
        this.paymentHistory = res.payments || [];
      });
    } else {
      this.paymentHistory = [];
    }
  }

  pay() {
    if (!this.studentId || !this.classRoomId) {
      this.message.error('Không tìm thấy lớp học của bạn!');
      return;
    }
    if (!this.amount || this.amount <= 0) {
      this.message.error('Vui lòng nhập số tiền cần nạp hợp lệ!');
      return;
    }
    this.loading = true;

    // Bước 1: Gọi API tạo link thanh toán
    // GET /payments/create-url-by-student?studentId=...&classRoomId=...
    this.paymentService.createUrlByStudent(this.studentId, this.classRoomId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.paid) {
          // Đã thanh toán đủ, hiển thị lịch sử
          this.paid = true;
          this.paidAmount = res.paidAmount;
          this.paymentHistory = res.payments || [];
          this.message.info('Lớp học này đã được thanh toán đủ!');
        } else if (res.url && res.paymentId) {
          // Bước 2: Điều hướng trình duyệt sang VNPAY
          // QUAN TRỌNG: Sử dụng window.location.href để browser redirect
          // KHÔNG sử dụng fetch/XHR/Postman để gọi link này
          localStorage.setItem('lastPaymentId', res.paymentId.toString());
          window.location.href = res.url;
          // Sau khi thanh toán, VNPAY sẽ redirect về vnp_ReturnUrlFrontend
          // với query params: status, paymentId, classRoomId, và các vnp_* từ VNPAY
          // FE KHÔNG được chỉnh sửa các query params này
        } else {
          this.message.error('Không thể tạo link thanh toán!');
        }
      },
      error: (err) => {
        this.loading = false;
        this.message.error('Có lỗi xảy ra khi tạo link thanh toán!');
        console.error('Payment error:', err);
      }
    });
  }
}
