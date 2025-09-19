import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Teacher } from '../../../../../core/models/teacher.model';
import { TeacherService } from '../../../../../core/services/teacher.service';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';

@Component({
  selector: 'app-teachers-form',
  templateUrl: './teachers-form.component.html'
})
export class TeachersFormComponent {
  @Input() teacher: Partial<Teacher> | null = null;
  @Output() save = new EventEmitter<Teacher>();
  @Output() cancel = new EventEmitter<void>();
  form: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder, private teacherService: TeacherService) {
    this.form = this.fb.group({
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
    if (this.teacher) {
      this.form.patchValue(this.teacher);
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      const data = this.form.value;
      this.teacherService.createTeacher(data).subscribe({
        next: (teacher) => {
          this.loading = false;
          this.save.emit(teacher);
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
