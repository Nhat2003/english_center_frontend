import { Component, OnInit } from '@angular/core';
import { ScheduleService } from '../../../../core/services/schedule.service';
import { FixedSchedule, formatDaysOfWeekDisplay, formatTimeRange } from '../../../../core/models/fixed-schedule.model';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';


@Component({
  selector: 'app-schedules',
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.css']
})
export class SchedulesComponent implements OnInit {
  fixedSchedules: FixedSchedule[] = [];
  isLoadingFixed = false;  constructor(
    private scheduleService: ScheduleService,
    private modal: NzModalService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.fetchFixedSchedules();
  }





  fetchFixedSchedules() {
    this.isLoadingFixed = true;
    this.scheduleService.getFixedSchedules().subscribe({
      next: (data: FixedSchedule[]) => {
        this.fixedSchedules = data || [];
        this.isLoadingFixed = false;
        this.message.success(`Đã tải ${this.fixedSchedules.length} lịch cố định`);
      },
      error: (error) => {
        console.error('Error fetching fixed schedules from API:', error);
        this.fixedSchedules = [];
        this.isLoadingFixed = false;
        this.message.error('Không thể tải danh sách lịch cố định');
      }
    });
  }

  viewFixedSchedule(schedule: FixedSchedule) {
    this.modal.info({
      nzTitle: 'Chi tiết lịch cố định',
      nzContent: `
        <div>
          <p><strong>Tên ca học:</strong> ${schedule.name}</p>
          <p><strong>Ngày trong tuần:</strong> ${formatDaysOfWeekDisplay(schedule.daysOfWeek)}</p>
          <p><strong>Thời gian:</strong> ${formatTimeRange(schedule.startTime, schedule.endTime)}</p>
        </div>
      `,
      nzWidth: 500
    });
  }



  // Helper methods for fixed schedules
  formatDaysOfWeekDisplay(daysOfWeek: string | null): string {
    return formatDaysOfWeekDisplay(daysOfWeek);
  }

  formatTimeRange(startTime: string | null, endTime: string | null): string {
    return formatTimeRange(startTime, endTime);
  }

}
