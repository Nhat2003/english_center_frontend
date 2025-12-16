import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Student } from '../../../../core/models/student.model';
import { StudentService } from '../../../../core/services/student.service';
import { StudentsFormComponent } from './students-form/students-form.component';
import { ImportStudentsComponent } from './import-students/import-students.component';

@Component({
  selector: 'app-students',
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css']
})
export class StudentsComponent implements OnInit {

  students: Student[] = [];

  total = 0;
  pageIndex = 1;
  pageSize = 10;
  loading = false;
  searchText = '';

  constructor(
    private studentService: StudentService,
    private modal: NzModalService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.fetchStudents();
  }

  /* ======================
     FETCH DATA (CORE)
  ====================== */

  fetchStudents(): void {
    this.loading = true;
    // Nếu có searchText thì gọi endpoint search, không thì gọi admin list
    const page = this.pageIndex - 1;
    const size = this.pageSize;
    if (this.searchText && this.searchText.trim()) {
      this.studentService.searchStudents(this.searchText.trim(), page, size).subscribe({
        next: (res: any) => {
          this.students = res?.data || [];
          this.total = res?.totalElements || 0;
          this.loading = false;
        },
        error: err => {
          console.error('Search students error:', err);
          this.students = [];
          this.total = 0;
          this.loading = false;
          this.message.error('Không thể tìm kiếm học viên');
        }
      });
    } else {
      this.studentService.getAdminStudentList(page, size).subscribe({
        next: (res: any) => {
          this.students = res?.data || [];
          this.total = res?.totalElements || 0;
          this.loading = false;
        },
        error: err => {
          console.error('Fetch students error:', err);
          this.students = [];
          this.total = 0;
          this.loading = false;
          this.message.error('Không thể tải danh sách học viên');
        }
      });
    }
  }

  /* ======================
     SEARCH
  ====================== */

  onSearch(): void {
    this.pageIndex = 1; // reset page
    this.fetchStudents();
  }

  /* ======================
     PAGINATION
  ====================== */

  onPageIndexChange(page: number): void {
    this.pageIndex = page;
    this.fetchStudents();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.fetchStudents();
  }

  /* ======================
     CRUD ACTIONS
  ====================== */

  openAddStudentModal(): void {
    const modalRef = this.modal.create({
      nzTitle: 'Thêm học viên',
      nzContent: StudentsFormComponent,
      nzFooter: null,
      nzWidth: 600,
      nzComponentParams: { mode: 'create' }
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.message.success('Thêm học viên thành công!');
        this.fetchStudents();
      }
    });
  }

  editStudent(student: Student): void {
    const modalRef = this.modal.create({
      nzTitle: 'Chỉnh sửa học viên',
      nzContent: StudentsFormComponent,
      nzFooter: null,
      nzWidth: 600,
      nzComponentParams: {
        student: { id: student.id },
        mode: 'edit'
      }
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.message.success('Cập nhật học viên thành công!');
        this.fetchStudents();
      }
    });
  }

  viewStudent(student: Student): void {
    this.modal.create({
      nzTitle: 'Thông tin học viên',
      nzContent: StudentsFormComponent,
      nzFooter: null,
      nzWidth: 1000,
      nzComponentParams: {
        student: { id: student.id },
        mode: 'view'
      }
    });
  }

  deleteStudent(student: Student): void {
    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn xoá học sinh "${student.fullName}"?`,
      nzOkType: 'danger',
      nzOnOk: () => {
        this.loading = true;
        this.studentService.deleteStudent(student.id).subscribe({
          next: () => {
            this.message.success('Xóa học viên thành công!');
            this.fetchStudents();
          },
          error: () => {
            this.loading = false;
            this.message.error('Không thể xóa học viên!');
          }
        });
      }
    });
  }

  /* ======================
     IMPORT
  ====================== */

  openImportModal(): void {
    const modalRef = this.modal.create({
      nzTitle: 'Import danh sách học viên từ Excel',
      nzContent: ImportStudentsComponent,
      nzFooter: null,
      nzWidth: 1400,
      nzBodyStyle: { padding: '0' }
    });

    modalRef.afterClose.subscribe(result => {
      if (result?.success) {
        this.message.success(`Import thành công ${result.successCount} học viên`);
        if (result.errorCount > 0) {
          this.message.warning(`Có ${result.errorCount} học viên lỗi`);
        }
        this.fetchStudents();
      }
    });
  }

  /* ======================
     HELPERS
  ====================== */

  genderLabel(gender?: string): string {
    const v = (gender || '').toLowerCase();
    if (v === 'male') return 'Nam';
    if (v === 'female') return 'Nữ';
    return gender || '';
  }
}
