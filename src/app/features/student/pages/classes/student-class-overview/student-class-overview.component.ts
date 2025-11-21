import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ClassService } from '../../../../../core/services/class.service';
import { Class } from '../../../../../core/models/class.model';

@Component({
  selector: 'app-student-class-overview',
  templateUrl: './student-class-overview.component.html',
  styleUrls: ['./student-class-overview.component.css']
})
export class StudentClassOverviewComponent implements OnInit {
  classId!: number;
  classInfo?: Class;
  loading = false;
  students: any[] = [];
  loadingStudents = false;
  isStudentsModalVisible = false;

  constructor(
    private route: ActivatedRoute,
    private classService: ClassService,
    private message: NzMessageService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.classId = +params['id'];
      this.loadClassInfo();
      this.loadStudents();
    });
  }

  loadClassInfo(): void {
    this.loading = true;
    this.classService.getClass(this.classId).subscribe({
      next: (data) => {
        this.classInfo = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading class info:', err);
        this.message.error('Không thể tải thông tin lớp học');
        this.loading = false;
      }
    });
  }

  loadStudents(): void {
    this.loadingStudents = true;
    this.classService.getStudentsByClass(this.classId).subscribe({
      next: (data) => {
        this.students = data;
        this.loadingStudents = false;
      },
      error: (err) => {
        console.error('Error loading students:', err);
        this.message.error('Không thể tải danh sách học sinh');
        this.loadingStudents = false;
      }
    });
  }

  showStudentsModal(): void {
    this.isStudentsModalVisible = true;
  }

  handleStudentsModalCancel(): void {
    this.isStudentsModalVisible = false;
  }

  /**
   * Format days of week from "1,3,5" to "Thứ 2, Thứ 4, Thứ 6"
   */
  formatDaysOfWeek(daysOfWeek: string): string {
    if (!daysOfWeek) return '';

    const dayNames: { [key: string]: string } = {
      '2': 'Thứ 2',
      '3': 'Thứ 3',
      '4': 'Thứ 4',
      '5': 'Thứ 5',
      '6': 'Thứ 6',
      '7': 'Thứ 7',
      '8': 'Chủ nhật'
    };

    return daysOfWeek
      .split(',')
      .map(d => dayNames[d.trim()] || d)
      .join(', ');
  }

  /**
   * Calculate duration between start and end date
   */
  calculateDuration(startDate: string, endDate: string): string {
    if (!startDate || !endDate) return 'Chưa xác định';

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const months = Math.floor(diffDays / 30);

    if (months > 0) {
      return `${months} tháng`;
    } else if (weeks > 0) {
      return `${weeks} tuần`;
    } else {
      return `${diffDays} ngày`;
    }
  }

  /**
   * Format course description with proper HTML structure
   * - Convert headings (lines ending with :)
   * - Convert bullet points (lines starting with -)
   * - Add proper spacing and styling
   */
  formatDescription(description: string): SafeHtml {
    if (!description) return '';

    let formatted = description
      // Split by line breaks
      .split('\n')
      .map(line => {
        line = line.trim();

        // Skip empty lines but preserve spacing
        if (!line) return '<br>';

        // Main title (all caps + contains "KHÓA HỌC" or similar)
        if (line === line.toUpperCase() && line.length > 10) {
          return `<h2 class="desc-title">${line}</h2>`;
        }

        // Section headings (lines ending with colon or all caps)
        if (line.endsWith(':') || (line === line.toUpperCase() && line.length > 5 && line.length <= 50)) {
          return `<h3 class="desc-heading">${line.replace(/:$/, '')}</h3>`;
        }

        // Bullet points (lines starting with specific characters)
        if (line.match(/^[•\-→]/)) {
          const content = line.replace(/^[•\-→]\s*/, '');
          return `<li class="desc-bullet">${content}</li>`;
        }

        // Regular paragraph
        return `<p class="desc-paragraph">${line}</p>`;
      })
      .join('');

    // Wrap consecutive <li> items in <ul>
    formatted = formatted.replace(/(<li[^>]*>.*?<\/li>)(?:\s*<li)/g, '$1</ul><ul class="desc-list"><li');
    formatted = formatted.replace(/(<li[^>]*>.*?<\/li>)/g, '<ul class="desc-list">$1</ul>');

    // Clean up multiple consecutive <ul> tags
    formatted = formatted.replace(/<\/ul><ul[^>]*>/g, '');

    return this.sanitizer.sanitize(1, formatted) || this.sanitizer.sanitize(1, description) || '';
  }
}
