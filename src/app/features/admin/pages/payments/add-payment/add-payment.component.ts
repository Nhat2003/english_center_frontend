import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { PaymentService } from '../../../../../core/services/payment.service';
import { StudentService } from '../../../../../core/services/student.service';
import { ClassService } from '../../../../../core/services/class.service';
import { Student } from '../../../../../core/models/student.model';
import { Class } from '../../../../../core/models/class.model';

@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.component.html',
  styleUrls: ['./add-payment.component.css']
})
export class AddPaymentComponent implements OnInit {
  paymentForm: FormGroup;
  loading = false;
  students: Student[] = [];
  classes: Class[] = [];
  filteredClasses: Class[] = [];

  paymentMethods = [
    { label: 'Tiền mặt', value: 'CASH' },
    { label: 'Chuyển khoản', value: 'TRANSFER' },
    { label: 'Thẻ', value: 'CARD' }
  ];

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private studentService: StudentService,
    private classService: ClassService,
    private message: NzMessageService,
    private router: Router
  ) {
    this.paymentForm = this.fb.group({
      studentId: [null, [Validators.required]],
      classId: [null, [Validators.required]],
      amount: [null, [Validators.required, Validators.min(1)]],
      paymentMethod: ['CASH', [Validators.required]],
      description: [''],
      transactionId: ['']
    });
  }

  ngOnInit(): void {
    this.loadStudents();
    this.loadClasses();
  }

  loadStudents(): void {
    this.studentService.getStudents(1, 1000).subscribe({
      next: (response) => {
        this.students = response.data;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.message.error('Không thể tải danh sách học sinh');
      }
    });
  }

  loadClasses(): void {
    this.classService.getClasses(1, 1000).subscribe({
      next: (response) => {
        this.classes = response.data;
        this.filteredClasses = response.data;
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.message.error('Không thể tải danh sách lớp học');
      }
    });
  }

  onStudentChange(studentId: number): void {
    if (studentId) {
      // Filter classes based on student's enrollment or available classes
      this.filteredClasses = this.classes;
    } else {
      this.filteredClasses = this.classes;
    }
    this.paymentForm.patchValue({ classId: null });
  }

  onSubmit(): void {
    if (this.paymentForm.valid) {
      this.loading = true;
      const formData = this.paymentForm.value;

      this.paymentService.createPayment(formData).subscribe({
        next: () => {
          this.message.success('Tạo thanh toán thành công');
          this.router.navigate(['/admin/payments']);
        },
        error: (error) => {
          console.error('Error creating payment:', error);
          this.message.error('Không thể tạo thanh toán');
          this.loading = false;
        }
      });
    } else {
      Object.values(this.paymentForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/payments']);
  }

  formatCurrency(value: number): string {
    if (!value) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  }
}
