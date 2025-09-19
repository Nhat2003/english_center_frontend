import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-courses-form',
  templateUrl: './courses-form.component.html',

})
export class CoursesFormComponent {
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  form: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: [null, Validators.required],
      duration: [null, [Validators.required, Validators.min(1)]],
      fee: [null, [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      // Gửi dữ liệu lên API tại đây nếu cần
      this.save.emit(this.form.value);
      this.loading = false;
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
