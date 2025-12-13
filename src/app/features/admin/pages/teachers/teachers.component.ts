import { Component } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TeachersFormComponent } from './teachers-form/teachers-form.component';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TeacherService } from '../../../../core/services/teacher.service';

  interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  }

@Component({
  selector: 'app-teachers',
  templateUrl: './teachers.component.html',
  styleUrls: ['./teachers.component.css']
})
export class TeachersComponent {
  teachers: Teacher[] = [];
  allTeachers: Teacher[] = []; // Store all teachers for search
  pageIndex = 1;
  pageSize = 5;
  loading = false;
  searchText = '';

  constructor(
    private modal: NzModalService,
    private teacherService: TeacherService,
    private message: NzMessageService
  ) {}

  get paginatedTeachers() {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.teachers.slice(start, start + this.pageSize);
  }

  onPageIndexChange(index: number) {
    this.pageIndex = index;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
  }


  openAddTeacherModal() {
    const modalRef = this.modal.create({
      nzTitle: 'Thêm giáo viên',
      nzContent: TeachersFormComponent,
      nzFooter: null,
      nzWidth: 600,
      nzComponentParams: {
        mode: 'create'
      }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.message.success('Thêm giáo viên thành công!');
        this.fetchTeachers();
      }
    });
  }

  ngOnInit(): void {
    this.fetchTeachers();
  }

  fetchTeachers() {
    this.loading = true;
    this.teacherService.getTeachers().subscribe({
      next: (data: any) => {
        const arr = Array.isArray(data) ? data : (data.content || []);
        this.allTeachers = arr.map((t: any) => ({
          id: t.id,
          name: t.fullName || '',
          email: t.email || '',
          phone: t.phone || '',
          subject: t.speciality || ''
        }));
        this.teachers = [...this.allTeachers]; // Copy to display array
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
        this.message.error('Lỗi khi tải danh sách giáo viên!');
        this.loading = false;
      }
    });
  }

  onSearch() {
    if (!this.searchText.trim()) {
      // If search is empty, show all teachers
      this.teachers = [...this.allTeachers];
    } else {
      // Filter teachers based on search text
      const searchLower = this.searchText.toLowerCase();
      this.teachers = this.allTeachers.filter(teacher =>
        teacher.name?.toLowerCase().includes(searchLower) ||
        teacher.email?.toLowerCase().includes(searchLower) ||
        teacher.phone?.toLowerCase().includes(searchLower) ||
        teacher.subject?.toLowerCase().includes(searchLower)
      );
    }
    // Reset to first page when searching
    this.pageIndex = 1;
  }

  deleteTeacher(teacher: Teacher) {
    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn xoá giáo viên "${teacher.name}"?`,
      nzOkType: 'danger',
      nzOnOk: () => {
        this.loading = true;
        this.teacherService.deleteTeacher(teacher.id).subscribe({
          next: () => {
            this.message.success('Xóa giáo viên thành công!');
            this.fetchTeachers();
          },
          error: (error) => {
            console.error('Error deleting teacher:', error);
            this.message.error('Lỗi khi xóa giáo viên!');
            this.loading = false;
          }
        });
      }
    });
  }

  editTeacher(teacher: Teacher) {
    const modalRef = this.modal.create({
      nzTitle: 'Chỉnh sửa giáo viên',
      nzContent: TeachersFormComponent,
      nzFooter: null,
      nzWidth: 600,
      nzComponentParams: {
        teacher: { id: teacher.id }, // Chỉ truyền id để component tự load dữ liệu
        mode: 'edit'
      }
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.message.success('Cập nhật giáo viên thành công!');
        this.fetchTeachers();
      }
    });
  }
  viewTeacher(teacher: Teacher) {
    this.modal.create({
      nzTitle: 'Thông tin giáo viên',
      nzContent: TeachersFormComponent,
      nzFooter: null,
      nzWidth: 1000,
      nzComponentParams: {
        teacher: { id: teacher.id }, // Chỉ truyền id để component tự load dữ liệu
        mode: 'view'
      }
    });
  }

}
