import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Payment, PaymentSummary } from '../../../../../core/models/payment.model';
import { PaymentService } from '../../../../../core/services/payment.service';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.css']
})
export class PaymentListComponent implements OnInit {
  payments: Payment[] = [];
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;

  // Filters
  searchValue = '';
  statusFilter = '';
  paymentMethodFilter = '';
  dateRange: Date[] = [];

  // Summary
  paymentSummary: PaymentSummary | null = null;

  // Status options
  statusOptions = [
    { label: 'Tất cả', value: '' },
    { label: 'Chờ xử lý', value: 'PENDING' },
    { label: 'Hoàn thành', value: 'COMPLETED' },
    { label: 'Thất bại', value: 'FAILED' },
    { label: 'Hoàn tiền', value: 'REFUNDED' }
  ];

  // Payment method options
  paymentMethodOptions = [
    { label: 'Tất cả', value: '' },
    { label: 'Tiền mặt', value: 'CASH' },
    { label: 'Chuyển khoản', value: 'TRANSFER' },
    { label: 'Thẻ', value: 'CARD' }
  ];

  constructor(
    private paymentService: PaymentService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadPayments();
    this.loadSummary();
  }

  loadPayments(): void {
    this.loading = true;

    const fromDate = this.dateRange.length > 0 ? this.dateRange[0] : undefined;
    const toDate = this.dateRange.length > 1 ? this.dateRange[1] : undefined;

    this.paymentService.getPayments(
      this.pageIndex,
      this.pageSize,
      this.searchValue || undefined,
      this.statusFilter || undefined,
      this.paymentMethodFilter || undefined,
      fromDate,
      toDate
    ).subscribe({
      next: (response) => {
        this.payments = response.data;
        this.total = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.message.error('Không thể tải danh sách thanh toán');
        this.loading = false;
      }
    });
  }

  loadSummary(): void {
    const fromDate = this.dateRange.length > 0 ? this.dateRange[0] : undefined;
    const toDate = this.dateRange.length > 1 ? this.dateRange[1] : undefined;

    this.paymentService.getPaymentSummary(fromDate, toDate).subscribe({
      next: (summary) => {
        this.paymentSummary = summary;
      },
      error: (error) => {
        console.error('Error loading payment summary:', error);
      }
    });
  }

  onPageIndexChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.loadPayments();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.pageIndex = 1;
    this.loadPayments();
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.loadPayments();
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.loadPayments();
    this.loadSummary();
  }

  onDateRangeChange(): void {
    this.onFilterChange();
  }

  resetFilters(): void {
    this.searchValue = '';
    this.statusFilter = '';
    this.paymentMethodFilter = '';
    this.dateRange = [];
    this.pageIndex = 1;
    this.loadPayments();
    this.loadSummary();
  }

  updatePaymentStatus(payment: Payment, newStatus: string): void {
    this.paymentService.updatePaymentStatus(payment.id!, newStatus).subscribe({
      next: () => {
        this.message.success('Cập nhật trạng thái thành công');
        this.loadPayments();
        this.loadSummary();
      },
      error: (error) => {
        console.error('Error updating payment status:', error);
        this.message.error('Không thể cập nhật trạng thái thanh toán');
      }
    });
  }

  deletePayment(payment: Payment): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa thanh toán của học sinh ${payment.studentName}?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.paymentService.deletePayment(payment.id!).subscribe({
          next: () => {
            this.message.success('Xóa thanh toán thành công');
            this.loadPayments();
            this.loadSummary();
          },
          error: (error) => {
            console.error('Error deleting payment:', error);
            this.message.error('Không thể xóa thanh toán');
          }
        });
      }
    });
  }

  exportPayments(format: 'excel' | 'pdf'): void {
    // Tạm thời hiển thị thông báo do backend chưa implement
    this.message.info(`Tính năng xuất ${format.toUpperCase()} đang được phát triển`);

    /*
    // Code này sẽ hoạt động khi backend có endpoint /export
    const fromDate = this.dateRange.length > 0 ? this.dateRange[0] : undefined;
    const toDate = this.dateRange.length > 1 ? this.dateRange[1] : undefined;

    this.paymentService.exportPayments(format, fromDate, toDate).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payments_${new Date().getTime()}.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.message.success('Xuất báo cáo thành công');
      },
      error: (error) => {
        console.error('Error exporting payments:', error);
        this.message.error('Không thể xuất báo cáo');
      }
    });
    */
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
