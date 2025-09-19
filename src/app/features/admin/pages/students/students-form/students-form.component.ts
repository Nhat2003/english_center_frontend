import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StudentService } from '../../../../../core/services/student.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Student } from '../../../../../core/models/student.model';

@Component({
  selector: 'app-students-form',
  templateUrl: './students-form.component.html',
  styleUrls: ['./students-form.component.css']
})
export class StudentsFormComponent {
  @Input() student: Partial<Student> | null = null;
  @Output() save = new EventEmitter<Student>();
  @Output() cancel = new EventEmitter<void>();
  form: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder, private studentService: StudentService) {
    this.form = this.fb.group({
      fullName: [null, Validators.required],
      dob: [null, Validators.required],
      gender: [null, Validators.required],
      phone: [null, Validators.required],
      address: [null, Validators.required],
      joinedAt: [null, Validators.required]
    });
  }

  ngOnInit() {
    if (this.student) {
      this.form.patchValue(this.student);
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      const data = this.form.value;
      this.studentService.createStudent(data).subscribe({
        next: (student) => {
          this.loading = false;
          this.save.emit(student);
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
