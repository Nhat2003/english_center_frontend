import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Payment, PaymentRequest, PaymentSummary } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  // Lấy danh sách thanh toán với phân trang và lọc
  getPayments(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
    paymentMethod?: string,
    fromDate?: Date,
    toDate?: Date
  ): Observable<{
    data: Payment[];
    total: number;
    page: number;
    limit: number;
  }> {
    let params = new HttpParams()
      .set('page', (page - 1).toString()) // Convert to 0-based for backend
      .set('size', limit.toString()); // Backend uses 'size' instead of 'limit'

    if (search) {
      params = params.set('search', search);
    }
    if (status) {
      params = params.set('status', status);
    }
    if (paymentMethod) {
      params = params.set('paymentMethod', paymentMethod);
    }
    if (fromDate) {
      params = params.set('fromDate', fromDate.toISOString());
    }
    if (toDate) {
      params = params.set('toDate', toDate.toISOString());
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => ({
        data: response.content || response.data || [],
        total: response.totalElements || response.total || 0,
        page: page, // Return original 1-based page
        limit: limit
      }))
    );
  }

  // Lấy thông tin thanh toán theo ID
  getPaymentById(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/${id}`);
  }

  // Tạo thanh toán mới
  createPayment(payment: PaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(this.apiUrl, payment);
  }

  // Cập nhật thanh toán
  updatePayment(id: number, payment: Partial<Payment>): Observable<Payment> {
    return this.http.put<Payment>(`${this.apiUrl}/${id}`, payment);
  }

  // Xóa thanh toán
  deletePayment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Cập nhật trạng thái thanh toán
  updatePaymentStatus(id: number, status: string): Observable<Payment> {
    // Backend expects { status: "STATUS_NAME" } format
    return this.http.patch<Payment>(`${this.apiUrl}/${id}/status`, { status });
  }

  // Lấy thống kê thanh toán
  getPaymentSummary(fromDate?: Date, toDate?: Date): Observable<PaymentSummary> {
    // Gọi các endpoint riêng lẻ từ backend và combine kết quả
    const totalAmount$ = this.http.get<number>(`${this.apiUrl}/summary/total-completed-amount`);
    const totalCount$ = this.http.get<number>(`${this.apiUrl}/summary/total-count`);
    const monthlyRevenue$ = this.http.get<any[]>(`${this.apiUrl}/summary/monthly-revenue`);

    // Combine tất cả requests
    return forkJoin({
      totalAmount: totalAmount$,
      totalCount: totalCount$,
      monthlyRevenue: monthlyRevenue$
    }).pipe(
      map((results: any) => ({
        totalAmount: results.totalAmount || 0,
        totalPayments: results.totalCount || 0,
        pendingAmount: 0, // Backend chưa có endpoint này
        completedAmount: results.totalAmount || 0,
        monthlyRevenue: (results.monthlyRevenue || []).map((item: any) => ({
          month: `${item.year}-${item.month.toString().padStart(2, '0')}`,
          amount: item.totalAmount || 0
        }))
      }))
    );
  }  // Lấy thanh toán theo học sinh
  getPaymentsByStudent(studentId: number): Observable<Payment[]> {
    // Backend chưa có endpoint này, tạm thời return empty array
    return new Observable(observer => {
      observer.next([]);
      observer.complete();
    });
  }

  // Lấy thanh toán theo lớp
  getPaymentsByClass(classId: number): Observable<Payment[]> {
    // Backend chưa có endpoint này, tạm thời return empty array
    return new Observable(observer => {
      observer.next([]);
      observer.complete();
    });
  }

  // Xuất báo cáo thanh toán
  exportPayments(
    format: 'excel' | 'pdf' = 'excel',
    fromDate?: Date,
    toDate?: Date
  ): Observable<Blob> {
    // Backend chưa có endpoint này, tạm thời return empty blob
    return new Observable(observer => {
      const blob = new Blob([''], { type: 'application/octet-stream' });
      observer.next(blob);
      observer.complete();
    });
  }
}
