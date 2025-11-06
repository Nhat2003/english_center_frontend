import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Class, formatClassScheduleDisplay, formatClassDateRange } from '../../../../core/models/class.model';
import { ClassService } from '../../../../core/services/class.service';
import { ClassesFormComponent } from './classes-form/classes-form.component';

@Component({
  selector: 'app-classes',
  templateUrl: './classes.component.html',
  styleUrls: ['./classes.component.css']
})
export class ClassesComponent implements OnInit {
  classes: Class[] = [];
  allClasses: Class[] = []; // Store all classes for search
  total = 0;
  pageIndex = 1;
  pageSize = 10;
  loading = false;
  searchText = '';

  constructor(
    private classService: ClassService,
    private modal: NzModalService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.fetchClasses();
  }

  fetchClasses() {
    this.loading = true;
    this.classService.getClasses(this.pageIndex - 1, this.pageSize).subscribe({
      next: (data: any) => {
        if (data && data.content && data.totalElements !== undefined) {
          this.allClasses = data.content;
          this.classes = data.content;
          this.total = data.totalElements;
        } else if (Array.isArray(data)) {
          this.allClasses = data;
          this.classes = data;
          this.total = data.length;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSearch() {
    if (!this.searchText.trim()) {
      // If search is empty, show all classes
      this.classes = [...this.allClasses];
      this.total = this.allClasses.length;
    } else {
      // Filter classes based on search text
      const searchLower = this.searchText.toLowerCase();
      this.classes = this.allClasses.filter(classItem =>
        classItem.name?.toLowerCase().includes(searchLower) ||
        classItem.courseName?.toLowerCase().includes(searchLower) ||
        classItem.teacherName?.toLowerCase().includes(searchLower) ||
        classItem.roomName?.toLowerCase().includes(searchLower)
      );
      this.total = this.classes.length;
    }
    // Reset to first page when searching
    this.pageIndex = 1;
  }

  onPageIndexChange(index: number) {
    this.pageIndex = index;
    this.fetchClasses();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.pageIndex = 1;
    this.fetchClasses();
  }

  openAddClassModal() {
    const modalRef = this.modal.create({
      nzTitle: 'Thêm lớp học',
      nzContent: ClassesFormComponent,
      nzFooter: null,
      nzWidth: 800,
      nzComponentParams: {
        mode: 'create'
      }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.message.success('Thêm lớp học thành công!');
        this.fetchClasses();
      }
    });
  }

  viewClass(classItem: Class) {
    this.modal.create({
      nzTitle: 'Thông tin lớp học',
      nzContent: ClassesFormComponent,
      nzFooter: null,
      nzWidth: 800,
      nzComponentParams: {
        classData: { id: classItem.id },
        mode: 'view'
      }
    });
  }

  editClass(classItem: Class) {
    console.log('Edit class called with:', classItem);
    const modalRef = this.modal.create({
      nzTitle: 'Chỉnh sửa lớp học',
      nzContent: ClassesFormComponent,
      nzFooter: null,
      nzWidth: 800,
      nzComponentParams: {
        classData: classItem, // Pass full class object
        mode: 'edit'
      }
    });
    console.log('Modal created with params:', { classData: classItem, mode: 'edit' });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.message.success('Cập nhật lớp học thành công!');
        this.fetchClasses();
      }
    });
  }

  deleteClass(classItem: Class) {
    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn xóa lớp "${classItem.name}"?`,
      nzContent: 'Hành động này không thể hoàn tác.',
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkType: 'danger',
      nzOnOk: () => {
        this.loading = true;
        this.classService.deleteClass(classItem.id).subscribe({
          next: () => {
            this.message.success('Xóa lớp học thành công!');
            this.fetchClasses();
          },
          error: () => {
            this.loading = false;
            this.message.error('Không thể xóa lớp học!');
          }
        });
      }
    });
  }

  // Helper methods for template
  formatScheduleDisplay(fixedSchedule: any): string {
    return formatClassScheduleDisplay(fixedSchedule);
  }

  formatDateRange(startDate: string, endDate: string): string {
    return formatClassDateRange(startDate, endDate);
  }
}
