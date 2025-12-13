
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { StudentService } from '../../../../core/services/student.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-student-payment',
  templateUrl: './student-payment.component.html',
  styleUrls: ['./student-payment.component.css']
})
export class StudentPaymentComponent implements OnInit {
  loading = false;
  dataLoaded = false;
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
  allPaymentHistory: any[] = [];
  paidAmount: number | null = null;
  dueDate: string | null = null;

  get isOverdue(): boolean {
    if (!this.dueDate || this.paid) return false;
    const due = new Date(this.dueDate);
    const now = new Date();
    // So sánh đến hết ngày dueDate
    due.setHours(23,59,59,999);
    return now > due;
  }

  constructor(
    private authService: AuthService,
    private paymentService: PaymentService,
    private studentService: StudentService,
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
      const vnpResponseCode = params['vnp_ResponseCode'] || params['rspCode']; // Backend có thể trả về rspCode hoặc vnp_ResponseCode
      const vnpTransactionStatus = params['vnp_TransactionStatus'];

      // Bước 4: Lấy tất cả các lớp của học sinh (cả chưa bắt đầu)
      // Kết hợp 2 API: getClassesByStudent (tất cả lớp) + getDueForStudent (thông tin học phí)
      if (this.studentId) {
        forkJoin({
          allClasses: this.studentService.getClassesByStudent(this.studentId),
          paymentInfo: this.paymentService.getDueForStudent(this.studentId)
        }).subscribe(({ allClasses, paymentInfo }) => {
          console.log('📚 All classes:', allClasses);
          console.log('💰 Payment info:', paymentInfo);

          // Merge dữ liệu: lấy thông tin lớp từ allClasses, thông tin học phí từ paymentInfo
          this.classes = allClasses.map((cls: any) => {
            const paymentData = paymentInfo.find((p: any) => p.classRoomId === cls.id);
            const merged = {
              classRoomId: cls.id,
              className: cls.name,
              courseName: cls.course?.name || '',
              amount: paymentData?.amount || 0,
              currency: paymentData?.currency || 'VND',
              paidAmount: paymentData?.paidAmount || 0,
              isPaid: paymentData?.isPaid || false,
              paymentStatus: paymentData?.paymentStatus || 'UNPAID',
              dueDate: paymentData?.dueDate || cls.endDate
            };
            console.log(`🔀 Merged class ${cls.name}:`, merged);
            return merged;
          });

          console.log('✅ Final classes array:', this.classes);

          // Đánh dấu data đã load xong
          this.dataLoaded = true;

          // Load lịch sử thanh toán cho tất cả các lớp
          this.loadAllPaymentHistory();

          // Không load lịch sử ngay, chỉ load khi cần
          // this.loadPaymentHistory();

          // Ưu tiên kiểm tra vnpResponseCode trước nếu có
          if (vnpResponseCode || vnpTransactionStatus) {
            // Xử lý theo VNPAY response codes
            if (vnpResponseCode === '00' && vnpTransactionStatus === '00') {
              // Thanh toán thành công
              this.message.success('Thanh toán thành công!');
              setTimeout(() => {
                if (paymentId) {
                  this.checkPaymentStatusFromReturn(paymentId, classRoomIdParam, vnpResponseCode, status);
                } else {
                  this.reloadClassData(classRoomIdParam);
                }
              }, 500);
            } else if (vnpResponseCode === '24') {
              // User hủy tại cổng thanh toán
              this.message.warning('Bạn đã hủy thanh toán tại cổng thanh toán. Vui lòng thử lại!');
              this.selectClassAndClearParams(classRoomIdParam);
            } else {
              // Các mã lỗi khác
              const errorMessages: { [key: string]: string } = {
                '07': 'Giao dịch bị nghi ngờ gian lận',
                '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ',
                '10': 'Thẻ/Tài khoản không đủ số dư',
                '11': 'Giao dịch vượt quá hạn mức',
                '12': 'Thẻ/Tài khoản bị khóa',
                '13': 'Sai mật khẩu xác thực giao dịch',
                '51': 'Tài khoản không đủ số dư',
                '65': 'Tài khoản đã vượt quá hạn mức giao dịch',
                '75': 'Ngân hàng thanh toán đang bảo trì',
                '79': 'Giao dịch vượt quá số lần nhập sai mật khẩu',
                '99': 'Lỗi không xác định'
              };
              const errorMsg = errorMessages[vnpResponseCode] || 'Thanh toán thất bại';
              this.message.error(`${errorMsg}. Vui lòng thử lại!`);
              this.selectClassAndClearParams(classRoomIdParam);
            }
          } else if (paymentId) {
            // Không có vnpResponseCode, kiểm tra qua paymentId
            this.checkPaymentStatusFromReturn(paymentId, classRoomIdParam, vnpResponseCode, status);
          } else if (status) {
            // Fallback: xử lý theo status trực tiếp nếu không có paymentId
            this.handlePaymentStatusDirect(status, classRoomIdParam);
          } else {
            // Không có status từ callback, load bình thường
            // Luôn chọn lớp đầu tiên để hiển thị nội dung
            if (this.classes.length > 0) {
              if (classRoomIdParam) {
                const foundClass = this.classes.find(c => c.classRoomId == +classRoomIdParam);
                this.selectClass(foundClass || this.classes[0]);
              } else {
                this.selectClass(this.classes[0]);
              }
            }
          }
        });
      }
    });
  }

  checkPaymentStatusFromReturn(paymentId: string, classRoomIdParam?: string, vnpResponseCode?: string, status?: string) {
    const paymentIdNum = parseInt(paymentId, 10);
    if (isNaN(paymentIdNum)) {
      // Nếu paymentId không hợp lệ, fallback về xử lý status trực tiếp
      this.handlePaymentStatusDirect(status, classRoomIdParam);
      return;
    }

    // Gọi API kiểm tra trạng thái payment theo ID
    this.paymentService.getPaymentById(paymentIdNum).subscribe({
      next: (payment) => {
        console.log('💳 Payment status from API:', payment);

        // Kiểm tra nếu status=PENDING và vnpResponseCode="24" → user đã hủy tại cổng
        if (payment.status === 'PENDING' && vnpResponseCode === '24') {
          this.message.warning('Bạn đã hủy thanh toán tại cổng thanh toán. Vui lòng thử lại!');
          this.selectClassAndClearParams(classRoomIdParam);
        } else if (payment.status === 'SUCCESS' || payment.status === 'COMPLETED') {
          // Thanh toán thành công (backend có thể trả về SUCCESS hoặc COMPLETED)
          this.message.success('Thanh toán thành công!');
          // Reload lại dữ liệu sau khi thanh toán thành công
          setTimeout(() => {
            this.reloadClassData(classRoomIdParam);
          }, 500);
        } else if (payment.status === 'PENDING') {
          // Pending nhưng không phải do hủy (có thể đang chờ xử lý)
          this.message.warning('Thanh toán đang được xử lý. Vui lòng đợi hoặc thử lại!');
          this.selectClassAndClearParams(classRoomIdParam);
        } else if (payment.status === 'FAILED') {
          // Failed
          this.message.error('Thanh toán thất bại. Vui lòng thử lại!');
          this.selectClassAndClearParams(classRoomIdParam);
        } else {
          // Các trạng thái khác (REFUNDED, etc.)
          this.message.info(`Trạng thái thanh toán: ${payment.status}`);
          this.selectClassAndClearParams(classRoomIdParam);
        }
      },
      error: () => {
        // Nếu API lỗi, fallback về xử lý status trực tiếp
        this.message.warning('Không thể kiểm tra trạng thái thanh toán');
        this.handlePaymentStatusDirect(status, classRoomIdParam);
      }
    });
  }

  handlePaymentStatusDirect(status?: string, classRoomIdParam?: string) {
    if (status === 'success') {
      this.message.success('Thanh toán thành công!');
      setTimeout(() => {
        this.reloadClassData(classRoomIdParam);
      }, 500);
    } else if (status === 'pending') {
      this.message.warning('Thanh toán chưa được thực hiện');
      this.selectClassAndClearParams(classRoomIdParam);
    } else if (status === 'failed' || status === 'cancel') {
      if (status === 'cancel') {
        this.message.warning('Bạn đã hủy thanh toán');
      } else {
        this.message.error('Thanh toán thất bại. Vui lòng thử lại!');
      }
      this.selectClassAndClearParams(classRoomIdParam);
    } else {
      // Không có status, chọn lớp bình thường
      this.selectClassAndClearParams(classRoomIdParam);
    }
  }

  selectClassAndClearParams(classRoomIdParam?: string) {
    // Chọn lại lớp
    if (this.classes.length > 0) {
      const foundClass = classRoomIdParam ?
        this.classes.find(c => c.classRoomId == +classRoomIdParam) : null;
      if (foundClass) {
        this.selectClass(foundClass);
      } else {
        this.selectClass(this.classes[0]);
      }
    }

    // Clear query params
    this.router.navigate([], {
      queryParams: {},
      replaceUrl: true
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
    forkJoin({
      allClasses: this.studentService.getClassesByStudent(this.studentId),
      paymentInfo: this.paymentService.getDueForStudent(this.studentId)
    }).subscribe(({ allClasses, paymentInfo }) => {
      // Merge dữ liệu
      this.classes = allClasses.map((cls: any) => {
        const paymentData = paymentInfo.find((p: any) => p.classRoomId === cls.id);
        return {
          classRoomId: cls.id,
          className: cls.name,
          courseName: cls.course?.name || '',
          amount: paymentData?.amount || 0,
          currency: paymentData?.currency || 'VND',
          paidAmount: paymentData?.paidAmount || 0,
          isPaid: paymentData?.isPaid || false,
          paymentStatus: paymentData?.paymentStatus || 'UNPAID',
          dueDate: paymentData?.dueDate || cls.endDate
        };
      });

      // Đánh dấu data đã load xong
      this.dataLoaded = true;

      // Nếu không có lớp nào, load lịch sử
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
        // KHÔNG reset các field khác nữa, giữ nguyên thông tin lớp đang chọn
      },
      error: (err) => {
        console.error('Error loading payment history:', err);
        this.message.error('Không thể tải lịch sử thanh toán');
      }
    });
  }

  loadAllPaymentHistory() {
    if (!this.studentId) return;

    // Gọi API lấy toàn bộ lịch sử thanh toán của học sinh
    this.paymentService.getPaymentHistory(this.studentId).subscribe({
      next: (history) => {
        this.allPaymentHistory = history || [];
        console.log('📜 All payment history:', this.allPaymentHistory);
      },
      error: (err) => {
        console.error('Error loading all payment history:', err);
      }
    });
  }

  getClassNameById(classRoomId: number): string {
    const cls = this.classes.find(c => c.classRoomId === classRoomId);
    return cls?.className || `Lớp #${classRoomId}`;
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
    this.dueDate = cls.dueDate || null;

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
