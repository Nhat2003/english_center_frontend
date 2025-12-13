import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CourseService } from '../../../../../core/services/course.service';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Course } from '../../../../../core/models/course.model';

@Component({
  selector: 'app-courses-form',
  templateUrl: './courses-form.component.html',
  styleUrls: ['./courses-form.component.css']
})
export class CoursesFormComponent implements OnInit {
  @Input() course: Partial<Course> | null = null;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';
  @Output() save = new EventEmitter<Course>();
  @Output() cancel = new EventEmitter<void>();
  form: FormGroup;
  loading = false;
  courseData: Course | null = null;
  isViewMode = false;

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private modal: NzModalRef,
    private message: NzMessageService
  ) {
    this.form = this.fb.group({
      name: [null, Validators.required],
      description: [null],
      duration: [null, [Validators.required, Validators.min(1)]],
      fee: [null, [Validators.required, Validators.min(0)]],
      level: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.isViewMode = this.mode === 'view';

    // Load course data nếu có id (cho edit/view mode)
    if (this.course?.id) {
      this.loadCourseDetails(this.course.id);
    } else if (this.course) {
      // Trường hợp tạo mới với dữ liệu sẵn có
      this.form.patchValue(this.course);
    }

    // Disable form nếu là view mode
    if (this.isViewMode) {
      this.form.disable();
    }
  }

  loadCourseDetails(courseId: number) {
    this.loading = true;
    this.courseService.getCourse(courseId).subscribe({
      next: (course) => {
        this.courseData = course;
        this.form.patchValue({
          name: course.name,
          description: course.description,
          duration: course.duration,
          fee: course.fee,
          level: course.level
        });
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading course details:', error);
        this.message.error('Không thể tải thông tin khóa học');
      }
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      const formData = this.form.value;

      // Xử lý create vs edit mode
      const apiCall = this.mode === 'edit' && this.courseData?.id
        ? this.courseService.updateCourse(this.courseData.id, formData)
        : this.courseService.createCourse(formData);

      const action = this.mode === 'edit' ? 'cập nhật' : 'tạo';

      apiCall.subscribe({
        next: (course) => {
          this.loading = false;
          this.modal.close(true);
        },
        error: (error) => {
          this.loading = false;
          console.error(`Error ${action}ing course:`, error);
          this.handleError(error, action);
        }
      });
    }
  }

  handleError(error: any, action: string) {
    let errorMessage = `Có lỗi xảy ra khi ${action} khóa học`;

    if (error.status === 400) {
      errorMessage = error.error?.message || 'Dữ liệu không hợp lệ';
    } else if (error.status === 500) {
      errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.message.error(errorMessage);
  }

  onCancel() {
    this.modal.close(false);
  }

  getLevelText(level: string | undefined): string {
    if (!level) return 'N/A';
    const levels: { [key: string]: string } = {
      'BEGINNER': 'Sơ cấp',
      'INTERMEDIATE': 'Trung cấp',
      'ADVANCED': 'Nâng cao',
      'TOEIC': 'TOEIC',
      'IELTS': 'IELTS'
    };
    return levels[level] || level;
  }
}
