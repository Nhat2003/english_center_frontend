import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

export interface ClassTab {
  label: string;
  icon: string;
  route: string;
  visible: boolean; // Kiểm soát hiển thị theo role
}

@Component({
  selector: 'app-class-tabs',
  templateUrl: './class-tabs.component.html',
  styleUrls: ['./class-tabs.component.css']
})
export class ClassTabsComponent implements OnInit {
  @Input() classId!: number;
  @Input() role: 'teacher' | 'student' = 'teacher';
  @Input() className: string = '';

  selectedIndex = 0;
  tabs: ClassTab[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeTabs();
    this.updateSelectedTab();
  }

  initializeTabs(): void {
    const baseRoute = this.role === 'teacher' ? '/teacher' : '/student';

    this.tabs = [
      {
        label: 'Tổng quan',
        icon: 'dashboard',
        route: `${baseRoute}/classes/${this.classId}/overview`,
        visible: true
      },
      {
        label: 'Học viên',
        icon: 'team',
        route: `${baseRoute}/classes/${this.classId}/students`,
        visible: this.role === 'teacher' // Chỉ giáo viên mới thấy tab này
      },
      {
        label: 'Bài tập',
        icon: 'file-text',
        route: `${baseRoute}/classes/${this.classId}/assignments`,
        visible: true
      },
      {
        label: 'Tài liệu',
        icon: 'book',
        route: `${baseRoute}/classes/${this.classId}/materials`,
        visible: true
      },
      {
        label: 'Điểm danh',
        icon: 'check-square',
        route: `${baseRoute}/classes/${this.classId}/attendance`,
        visible: this.role === 'teacher' // Chỉ giáo viên mới điểm danh
      },
      {
        label: 'Thông báo',
        icon: 'sound',
        route: `${baseRoute}/classes/${this.classId}/announcements`,
        visible: true // Cả 2 role đều thấy thông báo
      }
    ].filter(tab => tab.visible);
  }

  updateSelectedTab(): void {
    const currentUrl = this.router.url;
    const index = this.tabs.findIndex(tab => currentUrl.includes(tab.route));
    if (index !== -1) {
      this.selectedIndex = index;
    }
  }

  onTabChange(index: number): void {
    this.selectedIndex = index;
    this.router.navigate([this.tabs[index].route]);
  }

  goBack(): void {
    const baseRoute = this.role === 'teacher' ? '/teacher/classes' : '/student/classes';
    this.router.navigate([baseRoute]);
  }
}
