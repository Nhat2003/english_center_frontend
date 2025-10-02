import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Payment } from '../../../../../core/models/payment.model';
import { PaymentService } from '../../../../../core/services/payment.service';

@Component({
  selector: 'app-payment-detail',
  templateUrl: './payment-detail.component.html',
  styleUrls: ['./payment-detail.component.css']
})
export class PaymentDetailComponent implements OnInit {
  payment: Payment | null = null;
  loading = false;
  paymentId: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private message: NzMessageService
  ) {
    this.paymentId = Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.loadPaymentDetail();
  }

  loadPaymentDetail(): void {
    this.loading = true;
    this.paymentService.getPaymentById(this.paymentId).subscribe({
      next: (payment) => {
        this.payment = payment;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payment detail:', error);
        this.message.error('Không thể tải thông tin thanh toán');
        this.loading = false;
        this.router.navigate(['/admin/payments']);
      }
    });
  }

  updatePaymentStatus(newStatus: string): void {
    if (!this.payment) return;

    this.paymentService.updatePaymentStatus(this.payment.id!, newStatus).subscribe({
      next: (updatedPayment) => {
        this.payment = updatedPayment;
        this.message.success('Cập nhật trạng thái thành công');
      },
      error: (error) => {
        console.error('Error updating payment status:', error);
        this.message.error('Không thể cập nhật trạng thái thanh toán');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/payments']);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      case 'REFUNDED':
        return 'default';
      default:
        return 'default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'PENDING':
        return 'Chờ xử lý';
      case 'FAILED':
        return 'Thất bại';
      case 'REFUNDED':
        return 'Hoàn tiền';
      default:
        return status;
    }
  }

  getPaymentMethodText(method: string): string {
    switch (method) {
      case 'CASH':
        return 'Tiền mặt';
      case 'TRANSFER':
        return 'Chuyển khoản';
      case 'CARD':
        return 'Thẻ';
      default:
        return method;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }
}
