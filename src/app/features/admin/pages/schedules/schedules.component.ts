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
        console.log('Loaded schedules from API:', this.schedules);
      },
      error: (error) => {
        console.error('Error fetching schedules from API:', error);
        console.log('Fallback to mock data...');

        // Fallback to mock data if API fails
        this.scheduleService.getMockSchedules().subscribe({
          next: (mockData: Schedule[]) => {
            this.schedules = mockData || [];
            this.isLoading = false;
            this.message.warning('Đang sử dụng dữ liệu demo (không kết nối được API)');
          },
          error: () => {
            this.schedules = [];
            this.isLoading = false;
            this.message.error('Không thể tải danh sách lịch học');
          }
        });
      }
    });
  }

  viewSchedule(schedule: Schedule) {
    const detailsHtml = schedule.details?.map(detail => {
      const dayName = this.getDayName(detail.dayOfWeek);
      return `<p><strong>${dayName}:</strong> ${detail.startTime} - ${detail.endTime}</p>`;
    }).join('') || '<p>Không có chi tiết lịch học</p>';

    this.modal.info({
      nzTitle: 'Chi tiết lịch học',
      nzContent: `
        <div>
          <p><strong>Tên:</strong> ${schedule.name}</p>
          <p><strong>Mô tả:</strong> ${schedule.description || 'Không có'}</p>
          <div><strong>Lịch học:</strong></div>
          ${detailsHtml}
        </div>
      `,
      nzWidth: 500
    });
  }

  getDayName(dayOfWeek: string): string {
    const dayMap: { [key: string]: string } = {
      'MONDAY': 'Thứ 2',
      'TUESDAY': 'Thứ 3',
      'WEDNESDAY': 'Thứ 4',
      'THURSDAY': 'Thứ 5',
      'FRIDAY': 'Thứ 6',
      'SATURDAY': 'Thứ 7',
      'SUNDAY': 'Chủ nhật'
    };
    return dayMap[dayOfWeek] || dayOfWeek;
  }

  getScheduleTimeRange(schedule: Schedule): string {
    if (!schedule.details || schedule.details.length === 0) {
      return 'Chưa xác định';
    }

    const times = schedule.details.map(d => `${d.startTime}-${d.endTime}`);
    const uniqueTimes = [...new Set(times)];
    return uniqueTimes.join(', ');
  }

  getScheduleDays(schedule: Schedule): string {
    if (!schedule.details || schedule.details.length === 0) {
      return 'Chưa xác định';
    }

    const days = schedule.details.map(d => this.getDayName(d.dayOfWeek));
    return days.join(', ');
  }

}
