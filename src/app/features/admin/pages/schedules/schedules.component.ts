import { Component, OnInit } from '@angular/core';
import { ScheduleService } from '../../../../core/services/schedule.service';
import { Schedule } from '../../../../core/models/schedule.model';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';


@Component({
  selector: 'app-schedules',
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.css']
})
export class SchedulesComponent implements OnInit {
  schedules: Schedule[] = [];
  isLoading = false;  constructor(
    private scheduleService: ScheduleService,
    private modal: NzModalService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.fetchSchedules();
  }

  fetchSchedules() {
    this.isLoading = true;
    this.scheduleService.getSchedules().subscribe({
      next: (data: Schedule[]) => {
        this.schedules = data || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching schedules:', error);
        this.message.error('Không thể tải danh sách lịch học');
        this.isLoading = false;
      }
    });
  }

  viewSchedule(schedule: Schedule) {
    this.modal.info({
      nzTitle: 'Chi tiết lịch học',
      nzContent: `
        <div>
          <p><strong>Tên:</strong> ${schedule.name}</p>
          <p><strong>Mô tả:</strong> ${schedule.description || 'Không có'}</p>
          <p><strong>Thời gian:</strong> ${schedule.startTime || ''} - ${schedule.endTime || ''}</p>
          <p><strong>Ngày:</strong> ${schedule.dayOfWeek || 'Không xác định'}</p>
        </div>
      `,
      nzWidth: 500
    });
  }


}
