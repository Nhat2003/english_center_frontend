
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { StudentService } from '../../../../core/services/student.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
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
    private message: NzMessageService,
    private notification: NzNotificationService
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
      const vnpResponseCode = params['vnp_ResponseCode'] || params['rspCode'];
      const rspMsg = params['rspMsg']; // Thông điệp từ backend nếu có

      if (this.studentId) {
        forkJoin({
          allClasses: this.studentService.getClassesByStudent(this.studentId),
          paymentInfo: this.paymentService.getDueForStudent(this.studentId)
        }).subscribe(({ allClasses, paymentInfo }) => {
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
          this.dataLoaded = true;
          this.loadAllPaymentHistory();

          // Xử lý triệt để: chỉ message.success cho thành công, notification.error cho mọi trạng thái khác
          this.message.remove();
          this.notification.remove();
          let notifyMsg = '';
          const code = String(vnpResponseCode);
          if (rspMsg) {
            notifyMsg = decodeURIComponent(rspMsg);
          } else if (vnpResponseCode) {
            const errorMessages: { [key: string]: string } = {
              '07': 'Giao dịch bị nghi ngờ gian lận',
              '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ',
              '10': 'Thẻ/Tài khoản không đủ số dư',
              '11': 'Giao dịch vượt quá hạn mức',
              '12': 'Thẻ/Tài khoản bị khóa',
              '13': 'Sai mật khẩu xác thực giao dịch',
              '24': 'Bạn đã hủy thanh toán tại cổng thanh toán. Vui lòng thử lại!',
              '51': 'Tài khoản không đủ số dư',
              '65': 'Tài khoản đã vượt quá hạn mức giao dịch',
              '75': 'Ngân hàng thanh toán đang bảo trì',
              '79': 'Giao dịch vượt quá số lần nhập sai mật khẩu',
              '99': 'Lỗi không xác định'
            };
            notifyMsg = errorMessages[code] || 'Thanh toán thất bại. Vui lòng thử lại!';
          }

          const negativeMsg = notifyMsg && /hủy|huy|cancel|canceled|không thành công|that bai|thất bại|fail/i.test(notifyMsg);

          if (code === '00' && !negativeMsg) {
            this.message.success(notifyMsg || 'Thanh toán thành công!', { nzDuration: 1000 });
            setTimeout(() => {
              this.reloadClassData(classRoomIdParam);
            }, 500);
          } else if (code === '24' || negativeMsg) {
            this.notification.create('error', 'Giao dịch không thành công', notifyMsg || 'Bạn đã hủy thanh toán tại VNPAY', {
              nzDuration: 3000,
              nzStyle: { color: '#cf1322', fontWeight: 'bold' }
            });
            setTimeout(() => this.selectClassAndClearParams(classRoomIdParam), 3000);
          } else if (code === 'pending') {
            this.notification.create('warning', 'Thanh toán đang chờ xác nhận từ ngân hàng. Vui lòng đợi!', '', {
              nzDuration: 3000
            });
            setTimeout(() => this.selectClassAndClearParams(classRoomIdParam), 3000);
          } else if (vnpResponseCode) {
            this.notification.create('error', 'Giao dịch không thành công', notifyMsg, {
              nzDuration: 3000,
              nzStyle: { color: '#cf1322', fontWeight: 'bold' }
            });
            setTimeout(() => this.selectClassAndClearParams(classRoomIdParam), 3000);
          } else if (paymentId) {
            this.checkPaymentStatusFromReturn(paymentId, classRoomIdParam, vnpResponseCode, status);
          } else if (status) {
            this.handlePaymentStatusDirect(status, classRoomIdParam);
          } else {
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
      this._handlePaymentStatusDirect(status, classRoomIdParam, vnpResponseCode);
      return;
    }

    // Chỉ báo thành công khi cả hai đều '00', còn lại notification.error
    if (String(vnpResponseCode) === '00' && String(status) === '00') {
      this.message.success('Thanh toán thành công!', { nzDuration: 1000 });
      setTimeout(() => {
        this.reloadClassData(classRoomIdParam);
      }, 800);
      return;
    } else {
      let notifyMsg = '';
      const errorMessages: { [key: string]: string } = {
        '07': 'Giao dịch bị nghi ngờ gian lận',
        '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ',
        '10': 'Thẻ/Tài khoản không đủ số dư',
        '11': 'Giao dịch vượt quá hạn mức',
        '12': 'Thẻ/Tài khoản bị khóa',
        '13': 'Sai mật khẩu xác thực giao dịch',
        '24': 'Bạn đã hủy thanh toán tại cổng thanh toán. Vui lòng thử lại!',
        '51': 'Tài khoản không đủ số dư',
        '65': 'Tài khoản đã vượt quá hạn mức giao dịch',
        '75': 'Ngân hàng thanh toán đang bảo trì',
        '79': 'Giao dịch vượt quá số lần nhập sai mật khẩu',
        '99': 'Lỗi không xác định'
      };
      notifyMsg = errorMessages[String(vnpResponseCode)] || 'Thanh toán thất bại. Vui lòng thử lại!';
      this.notification.create('error', 'Giao dịch không thành công', notifyMsg, {
        nzDuration: 3000,
        nzStyle: { color: '#cf1322', fontWeight: 'bold' }
      });
      setTimeout(() => this.selectClassAndClearParams(classRoomIdParam), 3000);
      return;
    }

    // Gọi API kiểm tra trạng thái payment theo ID
    this.paymentService.getPaymentById(paymentIdNum).subscribe({
      next: (payment) => {
        console.log('💳 Payment status from API:', payment);
        if (payment.status === 'SUCCESS') {
          this.message.success('Thanh toán thành công!', { nzDuration: 1000 });
          setTimeout(() => {
            this.reloadClassData(classRoomIdParam);
          }, 500);
        } else {
          let notifyMsg = '';
          if (payment.status === 'PENDING' && vnpResponseCode === '24') {
            notifyMsg = 'Bạn đã hủy thanh toán tại cổng thanh toán. Vui lòng thử lại!';
          } else if (payment.status === 'PENDING') {
            notifyMsg = 'Thanh toán đang được xác nhận từ ngân hàng. Vui lòng đợi vài phút và tải lại trang!';
          } else if (payment.status === 'FAILED') {
            notifyMsg = 'Thanh toán thất bại. Vui lòng thử lại!';
          } else {
            notifyMsg = `Trạng thái thanh toán: ${payment.status}`;
          }
          this.notification.create('error', 'Giao dịch không thành công', notifyMsg, {
            nzDuration: 3000,
            nzStyle: { color: '#cf1322', fontWeight: 'bold' }
          });
          setTimeout(() => this.selectClassAndClearParams(classRoomIdParam), 3000);
        }
      },
      error: () => {
        this.message.warning('Không thể kiểm tra trạng thái thanh toán', { nzDuration: 1000 });
        this.handlePaymentStatusDirect(status, classRoomIdParam);
      }
    });
  }

  private handlePaymentStatusDirect(status?: string, classRoomIdParam?: string) {
    // Ưu tiên thông báo hủy nếu có vnp_ResponseCode=24 hoặc status=cancel hoặc status=pending và vnp_ResponseCode=24
    return this._handlePaymentStatusDirect(status, classRoomIdParam, undefined);
  }

  // Overload để truyền vnpResponseCode rõ ràng
  private _handlePaymentStatusDirect(status?: string, classRoomIdParam?: string, vnpResponseCode?: string) {
    this.message.remove();
    this.notification.remove();
    let code = vnpResponseCode;
    if (!code) {
      const queryParams = this.route.snapshot.queryParams;
      code = queryParams['vnp_ResponseCode'] || queryParams['rspCode'];
    }
    const codeStr = String(code);

    if ((status === 'success' || status === '00') && (codeStr === '00' || !code)) {
      this.message.success('Thanh toán thành công!', { nzDuration: 1000 });
      setTimeout(() => {
        this.reloadClassData(classRoomIdParam);
      }, 500);
      return;
    }

    if (codeStr === '24' || status === 'cancel') {
      this.notification.create('error', 'Giao dịch không thành công', 'Bạn đã hủy thanh toán tại cổng thanh toán. Vui lòng thử lại!', {
        nzDuration: 3000,
        nzStyle: { color: '#cf1322', fontWeight: 'bold' }
      });
      setTimeout(() => this.selectClassAndClearParams(classRoomIdParam), 3000);
      return;
    }

    if (status === 'pending' || codeStr === 'pending') {
      this.notification.create('warning', 'Thanh toán đang chờ xác nhận từ ngân hàng. Vui lòng đợi!', '', {
        nzDuration: 3000
      });
      setTimeout(() => this.selectClassAndClearParams(classRoomIdParam), 3000);
      return;
    }

    const notifyMsg = status === 'failed'
      ? 'Thanh toán thất bại. Vui lòng thử lại!'
      : `Trạng thái thanh toán: ${status}`;
    this.notification.create('error', 'Giao dịch không thành công', notifyMsg, {
      nzDuration: 3000,
      nzStyle: { color: '#cf1322', fontWeight: 'bold' }
    });
    setTimeout(() => this.selectClassAndClearParams(classRoomIdParam), 3000);
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
        if (payment && payment.status === 'SUCCESS') {
          // Payment đã được xác nhận thành công
          this.message.success('Đã xác nhận thanh toán thành công!', { nzDuration: 1000 });
          this.reloadClassData(classRoomIdParam);
        } else if (payment && payment.status === 'PENDING') {
          // Payment vẫn đang pending
          this.message.warning('Đang chờ xác nhận thanh toán...', { nzDuration: 1000 });
          this.reloadClassData(classRoomIdParam);
        } else {
          // Payment failed
          this.message.error('Thanh toán thất bại!', { nzDuration: 1000 });
          this.reloadClassData(classRoomIdParam);
        }
      },
      error: () => {
        // Nếu API lỗi, fallback về cách cũ
        this.message.warning('Không thể kiểm tra trạng thái thanh toán', { nzDuration: 1000 });
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
        this.message.error('Không thể tải lịch sử thanh toán', { nzDuration: 1000 });
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
    this.message.remove();
    this.notification.remove();
    if (!this.studentId || !this.classRoomId) {
      this.message.error('Không tìm thấy lớp học của bạn!', { nzDuration: 1000 });
      return;
    }
    if (!this.amount || this.amount <= 0) {
      this.message.error('Vui lòng nhập số tiền cần nạp hợp lệ!', { nzDuration: 1000 });
      return;
    }
    this.loading = true;

    // Bước 1: Gọi API tạo link thanh toán
    // GET /payments/create-url-by-student?studentId=...&classRoomId=...
    this.paymentService.createUrlByStudent(this.studentId, this.classRoomId).subscribe({
      next: (res) => {
        this.loading = false;
        this.message.remove();
        this.notification.remove();
        if (res.paid) {
          // Đã thanh toán đủ, hiển thị lịch sử
          this.paid = true;
          this.paidAmount = res.paidAmount;
          this.paymentHistory = res.payments || [];
          this.message.info('Lớp học này đã được thanh toán đủ!', { nzDuration: 1000 });
        } else if (res.url && res.paymentId) {
          // Bước 2: Điều hướng trình duyệt sang VNPAY
          // QUAN TRỌNG: Sử dụng window.location.href để browser redirect
          // KHÔNG sử dụng fetch/XHR/Postman để gọi link này
          localStorage.setItem('lastPaymentId', res.paymentId.toString());
          window.location.href = res.url;

        } else {
          this.message.error('Không thể tạo link thanh toán!', { nzDuration: 1000 });
        }
      },
      error: (err) => {
        this.loading = false;
        this.message.remove();
        this.notification.remove();
        this.message.error('Có lỗi xảy ra khi tạo link thanh toán!', { nzDuration: 1000 });
        console.error('Payment error:', err);
      }
    });
  }
}
