import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Course } from '../../../../core/models/course.model';
import { CourseService } from '../../../../core/services/course.service';
import { CoursesFormComponent } from './courses-form/courses-form.component';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css']
})
export class CoursesComponent implements OnInit {
  courses: Course[] = [];
  allCourses: Course[] = []; // Store all courses for search
  total = 0;
  pageIndex = 1;
  pageSize = 10;
  loading = false;
  searchText = '';

  constructor(
    private courseService: CourseService,
    private modal: NzModalService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.fetchCourses();
  }

  fetchCourses() {
    this.loading = true;
    this.courseService.getCourses(this.pageIndex - 1, this.pageSize).subscribe({
      next: (data: any) => {
        // Nếu backend trả về { content: Course[], totalElements: number }
        if (data && data.content && data.totalElements !== undefined) {
          this.allCourses = data.content;
          this.courses = data.content;
          this.total = data.totalElements;
        } else if (Array.isArray(data)) {
          // Nếu backend trả về mảng đơn giản
          this.allCourses = data;
          this.courses = data;
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
      // If search is empty, show all courses
      this.courses = [...this.allCourses];
      this.total = this.allCourses.length;
    } else {
      // Filter courses based on search text
      const searchLower = this.searchText.toLowerCase();
      this.courses = this.allCourses.filter(course =>
        course.name?.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower)
      );
      this.total = this.courses.length;
    }
    // Reset to first page when searching
    this.pageIndex = 1;
  }

  onPageIndexChange(index: number) {
    this.pageIndex = index;
    this.fetchCourses();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.pageIndex = 1;
    this.fetchCourses();
  }

  openAddCourseModal() {
    const modalRef = this.modal.create({
      nzTitle: 'Thêm khóa học',
      nzContent: CoursesFormComponent,
      nzFooter: null,
      nzWidth: 600,
      nzComponentParams: {
        mode: 'create'
      }
    });
    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.message.success('Thêm khóa học thành công!');
        this.fetchCourses();
      }
    });
  }

  viewCourse(course: Course) {
    this.modal.create({
      nzTitle: 'Thông tin khóa học',
      nzContent: CoursesFormComponent,
      nzFooter: null,
      nzWidth: 900,
      nzComponentParams: {
        course: { id: course.id },
        mode: 'view'
      }
    });
  }

  editCourse(course: Course) {
    const modalRef = this.modal.create({
      nzTitle: 'Chỉnh sửa khóa học',
      nzContent: CoursesFormComponent,
      nzFooter: null,
      nzWidth: 600,
      nzComponentParams: {
        course: { id: course.id },
        mode: 'edit'
      }
    });

    modalRef.afterClose.subscribe(result => {
      if (result) {
        this.message.success('Cập nhật khóa học thành công!');
        this.fetchCourses();
      }
    });
  }

  deleteCourse(course: Course) {
    this.modal.confirm({
      nzTitle: `Bạn có chắc chắn muốn xóa khóa học "${course.name}"?`,
      nzContent: 'Hành động này không thể hoàn tác.',
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkType: 'danger',
      nzOnOk: () => {
        this.loading = true;
        this.courseService.deleteCourse(course.id).subscribe({
          next: () => {
            this.message.success('Xóa khóa học thành công!');
            this.fetchCourses();
          },
          error: () => {
            this.loading = false;
            this.message.error('Không thể xóa khóa học!');
          }
        });
      }
    });
  }

  getLevelColor(level?: string): string {
    switch (level) {
      case 'Beginner':
        return 'green';
      case 'Intermediate':
        return 'orange';
      case 'Advanced':
        return 'red';
      default:
        return 'default';
    }
  }
}
