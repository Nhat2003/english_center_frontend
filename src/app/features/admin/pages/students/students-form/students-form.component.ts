import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { StudentService } from '../../../../../core/services/student.service';
import { UserService } from '../../../../../core/services/user.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Student } from '../../../../../core/models/student.model';
import { User } from '../../../../../core/models/user.model';

@Component({
  selector: 'app-students-form',
  templateUrl: './students-form.component.html',
  styleUrls: ['./students-form.component.css']
})
export class StudentsFormComponent implements OnInit {
  @Input() student: Partial<Student> | null = null;
  @Output() save = new EventEmitter<Student>();
  @Output() cancel = new EventEmitter<void>();
  form: FormGroup;
  loading = false;
  availableUsers: User[] = [];

  constructor(private fb: FormBuilder, private studentService: StudentService, private userService: UserService) {
    this.form = this.fb.group({
      userId: [null, Validators.required],
      fullName: [null, Validators.required],
      dob: [null, Validators.required],
      gender: [null, Validators.required],
      phone: [null, Validators.required],
      address: [null, Validators.required],
      joinedAt: [null, Validators.required]
    });
  }

  ngOnInit() {
    // Load available users for selection
    this.loadAvailableUsers();

    if (this.student) {
      this.form.patchValue(this.student);
    }
  }

  loadAvailableUsers() {
    // Thử gọi API với role và isActive
    this.userService.getActiveUsersByRole('STUDENT').subscribe({
      next: (users) => {
        // Filter thêm isActive = true để đảm bảo
        this.availableUsers = users.filter(user => user.isActive === true);
        console.log('Available active users for student profile (API):', this.availableUsers);
      },
      error: (error) => {
        console.log('API không hỗ trợ isActive filter, sử dụng fallback:', error);
        // Fallback: Lấy tất cả users theo role rồi filter
        this.userService.getUsersByRole('STUDENT').subscribe({
          next: (users) => {
            // Chỉ lấy users có isActive = true
            this.availableUsers = users.filter(user => user.isActive === true);
            console.log('Available active users for student profile (filtered):', this.availableUsers);
          },
          error: (err) => {
            console.error('Error loading users with role STUDENT:', err);
          }
        });
      }
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      const formData = this.form.value;

      // Chuyển đổi format ngày nếu cần
      const data = {
        ...formData,
        dob: formData.dob, // Có thể cần format khác
        joinedAt: formData.joinedAt // Có thể cần format khác
      };

      // Loại bỏ id nếu đang tạo mới (không edit)
      if (!this.student) {
        delete data.id;
      }

      console.log('Creating student with data:', data);
      console.log('userId being sent:', data.userId);
      console.log('Original form data:', formData);

      this.studentService.createStudent(data).subscribe({
        next: (student) => {
          this.loading = false;
          console.log('Student created successfully:', student);
          this.save.emit(student);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error creating student:', error);
          console.error('Error details:', error.error);
          console.error('Error message:', error.error?.message);
          console.error('Error status:', error.status);

          // Hiển thị lỗi chi tiết cho user
          alert(`Lỗi tạo học viên: ${error.error?.message || error.message || 'Unknown error'}`);
        }
      });
    } else {
      console.log('Form is invalid:', this.form.errors);
      console.log('Form values:', this.form.value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
