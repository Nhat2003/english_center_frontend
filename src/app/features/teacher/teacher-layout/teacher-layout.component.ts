import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { ClassService } from '../../../core/services/class.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-teacher-layout',
  templateUrl: './teacher-layout.component.html',
  styleUrls: ['./teacher-layout.component.css']
})
export class TeacherLayoutComponent implements OnInit {
  isCollapsed = false;
  currentUser: User | null = null;
  newNotifications = 3; // Number of new notifications for badge

  // Class management mode
  isClassManagementMode = false;
  currentClassId: number | null = null;
  currentClassInfo: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private classService: ClassService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Theo dõi navigation để detect class management mode
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkClassManagementMode();
    });

    // Check initial route
    this.checkClassManagementMode();
  }

  checkClassManagementMode() {
    const url = this.router.url;
    const classManagementMatch = url.match(/\/teacher\/classes\/(\d+)/);

    if (classManagementMatch) {
      this.isClassManagementMode = true;
      const classId = parseInt(classManagementMatch[1]);

      if (this.currentClassId !== classId) {
        this.currentClassId = classId;
        this.loadClassInfo(classId);
      }
    } else {
      this.isClassManagementMode = false;
      this.currentClassId = null;
      this.currentClassInfo = null;
    }
  }

  loadClassInfo(classId: number) {
    this.classService.getClass(classId).subscribe({
      next: (data) => {
        this.currentClassInfo = data;
      },
      error: (err) => {
        console.error('Failed to load class info:', err);
      }
    });
  }

  backToClasses() {
    this.router.navigate(['/teacher/classes']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
