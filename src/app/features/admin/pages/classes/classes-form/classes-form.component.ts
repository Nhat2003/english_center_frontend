import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-classes-form',
  templateUrl: './classes-form.component.html',
})
export class ClassesFormComponent {
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  form: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: [null, Validators.required],
      course: [null, Validators.required],
      teacher: [null, Validators.required],
      schedule: [null, Validators.required]
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      this.save.emit(this.form.value);
      this.loading = false;
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
