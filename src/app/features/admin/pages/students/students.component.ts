import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { Student } from '../../../../core/models/student.model';
import { StudentService } from '../../../../core/services/student.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
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

  constructor(
    private studentService: StudentService,
    private modal: NzModalService,
    private message: NzMessageService
  ) {}
  openAddStudentModal() {
    const modalRef = this.modal.create({
      nzTitle: 'Thêm học viên',
      nzContent: StudentsFormComponent,
      nzFooter: null,
      nzWidth: 600,
      nzComponentParams: {
        mode: 'create'
      }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.message.success('Thêm học viên thành công!');
        this.fetchStudents(); // Refresh the list
      }
    });
  }

  deleteStudent(student: Student) {
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


  ngOnInit(): void {
    this.fetchStudents();
  }

  fetchStudents() {
    this.loading = true;
    console.log('Fetching students with pagination:', { pageIndex: this.pageIndex, pageSize: this.pageSize });

    // Test với API đơn giản trước
    this.studentService.getStudentsWithoutPagination().subscribe({
      next: (data: any) => {
        console.log('Students API response (without pagination):', data);
        if (Array.isArray(data)) {
          this.students = data;
          this.total = data.length;
        } else {
          console.warn('Unexpected API response format:', data);
          this.students = [];
          this.total = 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to fetch students (without pagination):', error);
        // Fallback: try with pagination
        console.log('Trying with pagination...');
        this.studentService.getStudents(this.pageIndex - 1, this.pageSize).subscribe({
          next: (data: any) => {
            console.log('Students API response (with pagination):', data);
            if (data && data.content && data.totalElements !== undefined) {
              this.students = data.content;
              this.total = data.totalElements;
            } else if (Array.isArray(data)) {
              this.students = data;
              this.total = data.length;
            } else {
              console.warn('Unexpected API response format:', data);
              this.students = [];
              this.total = 0;
            }
            this.loading = false;
          },
          error: (error) => {
            console.error('Failed to fetch students (with pagination):', error);
            this.students = [];
            this.total = 0;
            this.loading = false;
          }
        });
      }
    });
  }


  // Không cần paginatedStudents nữa, dữ liệu đã phân trang từ backend


  onPageIndexChange(index: number) {
    this.pageIndex = index;
    this.fetchStudents();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.pageIndex = 1;
    this.fetchStudents();
  }

  viewStudent(student: Student) {
    this.modal.create({
      nzTitle: 'Thông tin học viên',
      nzContent: StudentsFormComponent,
      nzFooter: null,
      nzWidth: 600,
      nzComponentParams: {
        student: { id: student.id }, // Chỉ truyền id để component tự load dữ liệu
        mode: 'view'
      }
    });
  }

  editStudent(student: Student) {
    const modalRef = this.modal.create({
      nzTitle: 'Chỉnh sửa học viên',
      nzContent: StudentsFormComponent,
      nzFooter: null,
      nzWidth: 600,
      nzComponentParams: {
        student: { id: student.id }, // Chỉ truyền id để component tự load dữ liệu
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
  openImportModal() {
    const modalRef = this.modal.create({
      nzTitle: 'Import danh sách học viên từ Excel',
      nzContent: ImportStudentsComponent,
      nzFooter: null,
      nzWidth: 800,
      nzBodyStyle: { padding: '0' }
    });

    modalRef.afterClose.subscribe(result => {
      if (result && result.success) {
        this.message.success(`Import thành công ${result.successCount} học viên!`);
        if (result.errorCount > 0) {
          this.message.warning(`Có ${result.errorCount} học viên không thể import`);
        }
        this.fetchStudents(); // Refresh the list
      }
    });
  }
}
