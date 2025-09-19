import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';import { NzPaginationModule } from 'ng-zorro-antd/pagination';


interface Class {
  id: number;
  name: string;
  teacher: string;
  course: string;
}

@Component({
  selector: 'app-classes',
  templateUrl: './classes.component.html',
  styleUrls: ['./classes.component.css']
})
export class ClassesComponent {
  classes: Class[] = [
    { id: 1, name: 'Lớp Giao Tiếp 1', teacher: 'Nguyễn Văn A', course: 'Tiếng Anh Giao Tiếp' },
    { id: 2, name: 'Lớp IELTS 1', teacher: 'Trần Thị B', course: 'IELTS 6.5+' }
  ];

  pageIndex = 1;
  pageSize = 5;
  showAddForm = false;

  get paginatedClasses() {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.classes.slice(start, start + this.pageSize);
  }

  onPageIndexChange(index: number) {
    this.pageIndex = index;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
  }

  editClass(classItem: Class) {
    console.log('Edit class:', classItem);
  }
  viewClassroom(classItem: Class) {
    console.log('View classroom:', classItem);
  }

  deleteClass(classItem: Class) {
    console.log('Delete class:', classItem);
  }

  onAddClass() {
    this.showAddForm = true;
  }

  onSaveClass(classData: any) {
    this.classes.push({
      id: this.classes.length + 1,
      name: classData.name,
      teacher: classData.teacher,
      course: classData.course
    });
    this.showAddForm = false;
  }

  onCancelAddClass() {
    this.showAddForm = false;
  }

}
