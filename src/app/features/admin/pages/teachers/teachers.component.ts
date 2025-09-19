  import { Component } from '@angular/core';
  import { NzModalService } from 'ng-zorro-antd/modal';
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
  pageIndex = 1;
  pageSize = 5;
  loading = false;

  constructor(private modal: NzModalService, private teacherService: TeacherService) {}

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
      nzWidth: 600
    });
    modalRef.afterClose.subscribe(result => {
      if (result) {
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
        this.teachers = arr.map((t: any) => ({
          id: t.id,
          name: t.fullName || '',
          email: t.email || '',
          phone: t.phone || '',
          subject: t.speciality || ''
        }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  deleteTeacher(teacher: Teacher) {
    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn xoá giáo viên "${teacher.name}"?`,
      nzOkType: 'danger',
      nzOnOk: () => {
        this.loading = true;
        this.teacherService.deleteTeacher(teacher.id).subscribe({
          next: () => {
            this.fetchTeachers();
          },
          error: () => {
            this.loading = false;
          }
        });
      }
    });
  }

  editTeacher(teacher: Teacher) {
    // TODO: Hiện modal hoặc chuyển trang để sửa giáo viên
    console.log('Edit teacher:', teacher);
  }

}
