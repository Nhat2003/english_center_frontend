import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { StudentService } from '../../../../core/services/student.service';
import { Student } from '../../../../core/models/student.model';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css']
})
export class ProfileSettingsComponent implements OnInit {
  profileForm!: FormGroup;
  loading = false;
  saving = false;
  currentProfile?: Student;

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    private message: NzMessageService,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadProfile();
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.email]],
      address: [''],
      dob: [null]
    });
  }

  loadProfile(): void {
    this.loading = true;
    this.studentService.getMyProfile().subscribe({
      next: (profile) => {
        this.currentProfile = profile;
        this.profileForm.patchValue({
          fullName: profile.fullName,
          phone: profile.phone,
          email: profile.email,
          address: profile.address,
          dob: profile.dob ? new Date(profile.dob) : null
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading student profile:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        this.message.error('Không thể tải thông tin cá nhân');
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.saving = true;
      const formValue = this.profileForm.value;
      
      // Convert date to string if exists
      const profileData = {
        ...formValue,
        dob: formValue.dob 
          ? new Date(formValue.dob).toISOString().split('T')[0]
          : null
      };

      this.studentService.updateMyProfile(profileData).subscribe({
        next: (updatedProfile) => {
          this.currentProfile = updatedProfile;
          this.message.success('Cập nhật thông tin thành công!');
          this.saving = false;
          
          // Navigate back to previous page after 1 second
          setTimeout(() => {
            this.location.back();
          }, 1000);
        },
        error: (error) => {
          console.error('Error updating student profile:', error);
          console.error('Error status:', error.status);
          console.error('Error response:', error.error);
          this.message.error('Cập nhật thông tin thất bại: ' + (error.error?.message || 'Lỗi không xác định'));
          this.saving = false;
        }
      });
    } else {
      Object.values(this.profileForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Vui lòng kiểm tra lại thông tin!');
    }
  }

  resetForm(): void {
    if (this.currentProfile) {
      this.profileForm.patchValue({
        fullName: this.currentProfile.fullName,
        phone: this.currentProfile.phone,
        email: this.currentProfile.email,
        address: this.currentProfile.address,
        dob: this.currentProfile.dob ? new Date(this.currentProfile.dob) : null
      });
    }
  }

}
