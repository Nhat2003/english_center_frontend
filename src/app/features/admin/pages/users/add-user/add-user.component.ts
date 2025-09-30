import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from 'src/app/core/services/user.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
@Component({
  selector: 'app-user-add',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent implements OnInit {
 cancel(): void {
    this.modalRef.close(null);
  }
  userForm!: FormGroup;
  roles = ['TEACHER', 'STUDENT', 'ADMIN'];

  // Thêm output để thông báo cho component cha
  @Output() userAdded = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private message: NzMessageService,
    private modalRef: NzModalRef
  ) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: [null, [Validators.required]],
    });
  }

  submitForm(): void {
    if (this.userForm.valid) {
      this.userService.createUser(this.userForm.value).subscribe({
        next: (result) => {
          this.message.success('Thêm user thành công!');
          this.userForm.reset();
          this.userAdded.emit(); // Chỉ emit sự kiện, không truyền dữ liệu
          this.closeModal.emit(); // Đóng modal popup
        },
        error: () => {
          this.message.error('Thêm user thất bại!');
        }
      });
    } else {
      Object.values(this.userForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
