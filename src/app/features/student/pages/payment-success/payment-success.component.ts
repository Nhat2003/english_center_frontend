import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css']
})
export class PaymentSuccessComponent implements OnInit {
  isSuccess = false;
  isCancelled = false;
  isFailed = false;
  isProcessing = true;
  errorMessage = '';
  paymentId: string = '';
  classRoomId: string = '';
  countdown = 5;
  private countdownInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private message: NzMessageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Kiểm tra authentication
    const user = this.authService.getCurrentUser();

    if (!user) {
      this.message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
      this.router.navigate(['/login']);
      return;
    }

    // Đọc VNPAY response từ query params
    this.route.queryParams.subscribe(params => {
      const vnpResponseCode = params['vnp_ResponseCode'];
      const vnpTransactionStatus = params['vnp_TransactionStatus'];
      this.paymentId = params['paymentId'] || '';
      this.classRoomId = params['classRoomId'] || '';

      // Thêm delay nhỏ để hiển thị loading state
      setTimeout(() => {
        // Xử lý theo mã response từ VNPAY
        if (vnpResponseCode === '00' && vnpTransactionStatus === '00') {
          // Thanh toán thành công
          this.isSuccess = true;
          this.isProcessing = false;
          this.startCountdown();
        } else if (vnpResponseCode === '24') {
          // User hủy tại cổng thanh toán
          this.isCancelled = true;
          this.isProcessing = false;
          this.errorMessage = 'Bạn đã hủy thanh toán tại cổng thanh toán';
        } else if (vnpResponseCode) {
          // Các mã lỗi khác từ VNPAY
          this.isFailed = true;
          this.isProcessing = false;
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
          this.errorMessage = errorMessages[vnpResponseCode] || 'Thanh toán thất bại';
        } else {
          // Không có mã response, redirect ngay
          this.isProcessing = false;
          this.router.navigate(['/student/payments']);
        }
      }, 500);
    });
  }

  startCountdown() {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.redirectToPayment();
      }
    }, 1000);
  }

  redirectToPayment() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    const queryParams: any = {};

    if (this.isSuccess) {
      queryParams.status = 'success';
      queryParams.paymentId = this.paymentId;
    } else if (this.isCancelled) {
      queryParams.status = 'cancel';
    } else if (this.isFailed) {
      queryParams.status = 'failed';
    }

    if (this.classRoomId) {
      queryParams.classRoomId = this.classRoomId;
    }

    this.router.navigate(['/student/payments'], { queryParams });
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
