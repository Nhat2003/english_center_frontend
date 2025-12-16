import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
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
  statusOptions = [
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'SUCCESS', label: 'Thành công' },
    { value: 'FAILED', label: 'Thất bại' },
    { value: 'EXPIRED', label: 'Hết hạn' },
    { value: 'CANCELED', label: 'Hủy' }
  ];
  selectedStatus?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELED';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private message: NzMessageService,
    private modal: NzModalService
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
        this.selectedStatus = payment.status as any;
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

    const statusText = this.getStatusText(newStatus);
    this.modal.confirm({
      nzTitle: `Xác nhận cập nhật trạng thái sang "${statusText}"?`,
      nzOkType: 'primary',
      nzOnOk: () => {
        this.paymentService.updatePaymentStatus(
          this.payment!.id!,
          newStatus as 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELED'
        ).subscribe({
          next: (updatedPayment) => {
            this.message.success('Cập nhật trạng thái thành công');
            // Reload để đảm bảo dữ liệu từ DB
            this.loadPaymentDetail();
          },
          error: (error) => {
            console.error('Error updating payment status:', error);
            this.message.error('Không thể cập nhật trạng thái thanh toán');
          }
        });
      }
    });
  }

  onStatusSelectChange(newStatus: string): void {
    if (!this.payment || !newStatus || newStatus === this.payment.status) return;
    this.updatePaymentStatus(newStatus);
  }

  applyStatusChange(): void {
    if (!this.payment || !this.selectedStatus || this.selectedStatus === this.payment.status) {
      return;
    }
    this.updatePaymentStatus(this.selectedStatus);
  }

  goBack(): void {
    this.router.navigate(['/admin/payments']);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      case 'EXPIRED':
        return 'default';
      case 'CANCELED':
        return 'default';
      default:
        return 'default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'SUCCESS':
        return 'Thành công';
      case 'PENDING':
        return 'Chờ xử lý';
      case 'FAILED':
        return 'Thất bại';
      case 'EXPIRED':
        return 'Hết hạn';
      case 'CANCELED':
        return 'Hủy';
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
