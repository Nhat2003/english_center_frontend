import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { StudentService } from '../../../../../core/services/student.service';
import { UserService } from '../../../../../core/services/user.service';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
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
  @Input() mode: 'create' | 'edit' | 'view' = 'create';
  @Output() save = new EventEmitter<Student>();
  @Output() cancel = new EventEmitter<void>();
  form: FormGroup;
  loading = false;
  availableUsers: User[] = [];
  filteredUsers: User[] = [];
  userSearchText = '';
  isUserSelectionModalVisible = false;
  studentData: Student | null = null;
  isViewMode = false;

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    private userService: UserService,
    private modal: NzModalRef,
    private message: NzMessageService
  ) {
    this.form = this.fb.group({
      userId: [null, Validators.required],
      fullName: [null],
      email: [null],
      dob: [null],
      gender: [null],
      phone: [null],
      address: [null],
      joinedAt: [null],
      className: [null]
    });
  }

  ngOnInit() {
    this.isViewMode = this.mode === 'view';

    // Load available users for selection (chỉ khi tạo mới)
    if (this.mode === 'create') {
      this.loadAvailableUsers();
    }

    // Load student data nếu có id (cho edit/view mode)
    if (this.student?.id) {
      this.loadStudentDetails(this.student.id);
    } else if (this.student) {
      // Trường hợp tạo mới với dữ liệu sẵn có
      this.form.patchValue(this.student);
    }

    // Disable form nếu là view mode
    if (this.isViewMode) {
      this.form.disable();
    }
  }

  loadAvailableUsers() {
    // Thử gọi API với role và isActive
    this.userService.getActiveUsersByRole('STUDENT').subscribe({
      next: (users) => {
        // Filter thêm isActive = true để đảm bảo
        this.availableUsers = users.filter(user => user.isActive === true);
        this.filteredUsers = [...this.availableUsers];
        console.log('Available active users for student profile (API):', this.availableUsers);
      },
      error: (error) => {
        // Fallback: Lấy tất cả users theo role rồi filter
        this.userService.getUsersByRole('STUDENT').subscribe({
          next: (users) => {
            // Chỉ lấy users có isActive = true
            this.availableUsers = users.filter(user => user.isActive === true);
            this.filteredUsers = [...this.availableUsers];
            console.log('Available active users for student profile (filtered):', this.availableUsers);
          },
          error: (err) => {
            console.error('Error loading users with role STUDENT:', err);
          }
        });
      }
    });
  }

  loadStudentDetails(studentId: number) {
    this.loading = true;
    this.studentService.getStudent(studentId).subscribe({
      next: (student) => {
        this.studentData = student;
        this.form.patchValue({
          userId: student.userId,
          fullName: student.fullName,
          email: student.email,
          dob: student.dob,
          gender: student.gender,
          phone: student.phone,
          address: student.address,
          joinedAt: student.joinedAt,
          className: student.className
        });
        this.loading = false;

        // Load available users sau khi có dữ liệu student (cho edit mode)
        if (this.mode === 'edit') {
          this.loadAvailableUsers();
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading student details:', error);
        this.message.error('Không thể tải thông tin học viên');
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

      // Xử lý create vs edit mode
      const apiCall = this.mode === 'edit' && this.studentData?.id
        ? this.studentService.updateStudent(this.studentData.id, data)
        : this.studentService.createStudent(data);

      const action = this.mode === 'edit' ? 'cập nhật' : 'tạo';
      apiCall.subscribe({
        next: (student) => {
          this.loading = false;
          this.modal.close(true); // Đóng modal và trả về true
        },
        error: (error) => {
          this.loading = false;
          console.error(`Error ${action}ing student:`, error);
          this.handleError(error, action);
        }
      });
    } else {
      }
  }

  handleError(error: any, action: string) {
    console.error('Error details:', error.error);
    console.error('Error message:', error.error?.message);
    console.error('Error status:', error.status);

    let errorMessage = `Có lỗi xảy ra khi ${action} học viên`;

    if (error.status === 400 || error.status === 409) {
      // Lỗi duplicate userId hoặc validation
      if (error.error?.message?.includes('userId') || error.error?.message?.includes('exist')) {
        errorMessage = 'User này đã có hồ sơ học viên hoặc giáo viên. Vui lòng chọn user khác.';
      } else {
        errorMessage = error.error?.message || 'Dữ liệu không hợp lệ';
      }
    } else if (error.status === 500) {
      errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.message.error(errorMessage);
  }

  onCancel() {
    this.modal.close(false); // Đóng modal và trả về false
  }

  // User selection modal methods
  openUserSelectionModal() {
    console.log('Current userId:', this.form.get('userId')?.value);
    this.isUserSelectionModalVisible = true;
    this.filterUsers();
  }

  handleUserSelectionOk() {
    this.isUserSelectionModalVisible = false;
  }

  handleUserSelectionCancel() {
    this.isUserSelectionModalVisible = false;
  }

  filterUsers() {
    const searchText = this.userSearchText.toLowerCase().trim();

    if (!searchText) {
      this.filteredUsers = [...this.availableUsers];
    } else {
      this.filteredUsers = this.availableUsers.filter(user =>
        (user.fullName?.toLowerCase().includes(searchText)) ||
        (user.username?.toLowerCase().includes(searchText)) ||
        (user.email?.toLowerCase().includes(searchText))
      );
    }
  }

  selectUser(user: User) {
    this.form.patchValue({
      userId: user.id,
      fullName: user.fullName || user.username,
      email: user.email
    });
    this.isUserSelectionModalVisible = false;
    this.message.success(`Đã chọn: ${user.fullName || user.username}`);
  }

  getSelectedUserName(): string {
    const userId = this.form.get('userId')?.value;
    if (!userId) return '';

    const user = this.availableUsers.find(u => u.id === userId);
    return user ? (user.fullName || user.username || '') : '';
  }
}
