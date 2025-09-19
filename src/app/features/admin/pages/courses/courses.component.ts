import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

interface Course {
  id: number;
  name: string;
  duration: string;
  fee: string;
}

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css']
})
export class CoursesComponent {
  courses: Course[] = [
    { id: 1, name: 'Tiếng Anh Giao Tiếp', duration: '3 tháng', fee: '3.000.000 VNĐ' },
    { id: 2, name: 'IELTS 6.5+', duration: '6 tháng', fee: '8.000.000 VNĐ' }
  ];

  pageIndex = 1;
  pageSize = 5;
  showAddForm = false;

  get paginatedCourses() {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.courses.slice(start, start + this.pageSize);
  }

  onPageIndexChange(index: number) {
    this.pageIndex = index;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
  }
  viewCourse(course: Course) {
    console.log('View course:', course);
  }
  editCourse(course: Course) {
    console.log('Edit course:', course);
  }
  deleteCourse(course: Course) {
    console.log('Delete course:', course);
  }
  onAddCourse() {
    this.showAddForm = true;
  }

  onSaveCourse(courseData: any) {
    // Thêm course mới vào danh sách (hoặc gọi API)
    this.courses.push({
      id: this.courses.length + 1,
      name: courseData.name,
      duration: courseData.duration,
      fee: courseData.fee
    });
    this.showAddForm = false;
  }

  onCancelAddCourse() {
    this.showAddForm = false;
  }
}
