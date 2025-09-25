import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ScheduleService } from '../../../../../core/services/schedule.service';
import { Schedule } from '../../../../../core/models/schedule.model';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-schedules-form',
  templateUrl: './schedules-form.component.html',
  styleUrls: ['./schedules-form.component.css']
})
export class SchedulesFormComponent implements OnInit {
  @Input() mode: 'create' | 'edit' | 'view' = 'create';
  @Input() scheduleData: Schedule | null = null;

  scheduleForm: FormGroup;
  isLoading = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private scheduleService: ScheduleService,
    private modal: NzModalRef,
    private message: NzMessageService
  ) {
    this.scheduleForm = this.fb.group({
      name: [null, Validators.required],
      description: [null],
      startTime: [null],
      endTime: [null],
      dayOfWeek: [null]
    });
  }

  ngOnInit() {
    this.isEditMode = this.mode === 'edit';

    if (this.scheduleData) {
      this.scheduleForm.patchValue({
        name: this.scheduleData.name,
        description: this.scheduleData.description,
        startTime: this.scheduleData.startTime,
        endTime: this.scheduleData.endTime,
        dayOfWeek: this.scheduleData.dayOfWeek
      });
    }

    // Disable form if view mode
    if (this.mode === 'view') {
      this.scheduleForm.disable();
    }
  }

  onSubmit() {
    if (this.scheduleForm.valid) {
      this.isLoading = true;
      const formData = this.scheduleForm.value;

      const apiCall = this.mode === 'edit' && this.scheduleData?.id
        ? this.scheduleService.updateSchedule(this.scheduleData.id, formData)
        : this.scheduleService.createSchedule(formData);

      apiCall.subscribe({
        next: () => {
          this.isLoading = false;
          this.modal.close(true);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error saving schedule:', error);
          this.message.error('Có lỗi xảy ra khi lưu lịch học');
        }
      });
    }
  }

  onCancel() {
    this.modal.close(false);
  }
}
