import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Teacher } from '../../../../../core/models/teacher.model';
import { TeacherService } from '../../../../../core/services/teacher.service';
import { UserService } from '../../../../../core/services/user.service';
import { User } from '../../../../../core/models/user.model';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-teachers-form',
  templateUrl: './teachers-form.component.html'
})
export class TeachersFormComponent implements OnInit {
  @Input() teacher: Partial<Teacher> | null = null;
  @Output() save = new EventEmitter<Teacher>();
  @Output() cancel = new EventEmitter<void>();
  form: FormGroup;
  loading = false;
  availableUsers: User[] = [];

  constructor(private fb: FormBuilder, private teacherService: TeacherService, private userService: UserService) {
    this.form = this.fb.group({
      userId: [null, Validators.required],
      fullName: [null, Validators.required],
      dob: [null, Validators.required],
      gender: [null, Validators.required],
      phone: [null, Validators.required],
      address: [null, Validators.required],
      speciality: [null, Validators.required],
      hiredAt: [null, Validators.required]
    });
  }

  ngOnInit() {
    // Load available users for selection
    this.loadAvailableUsers();

    if (this.teacher) {
      this.form.patchValue(this.teacher);
    }
  }

  loadAvailableUsers() {
    // Thử gọi API với role và isActive
    this.userService.getActiveUsersByRole('TEACHER').subscribe({
      next: (users) => {
        // Filter thêm isActive = true để đảm bảo
        this.availableUsers = users.filter(user => user.isActive === true);
        console.log('Available active users for teacher profile (API):', this.availableUsers);
      },
      error: (error) => {
        console.log('API không hỗ trợ isActive filter, sử dụng fallback:', error);
        // Fallback: Lấy tất cả users theo role rồi filter
        this.userService.getUsersByRole('TEACHER').subscribe({
          next: (users) => {
            // Chỉ lấy users có isActive = true
            this.availableUsers = users.filter(user => user.isActive === true);
            console.log('Available active users for teacher profile (filtered):', this.availableUsers);
          },
          error: (err) => {
            console.error('Error loading users with role TEACHER:', err);
          }
        });
      }
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      const data = this.form.value;
      console.log('Creating teacher with data:', data);
      console.log('userId being sent:', data.userId);

      this.teacherService.createTeacher(data).subscribe({
        next: (teacher) => {
          this.loading = false;
          console.log('Teacher created successfully:', teacher);
          this.save.emit(teacher);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error creating teacher:', error);
          console.error('Error details:', error.error);
          console.error('Error message:', error.error?.message);
          console.error('Error status:', error.status);

          // Hiển thị lỗi chi tiết cho user
          alert(`Lỗi tạo giáo viên: ${error.error?.message || error.message || 'Unknown error'}`);
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
