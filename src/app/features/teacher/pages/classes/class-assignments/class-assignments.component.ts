import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AssignmentService } from '../../../../../core/services/assignment.service';
import { Assignment } from '../../../../../core/models/assignment.model';
import { AuthService } from '../../../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

// Teacher Assignment View Model
interface TeacherAssignment extends Assignment {
  checked?: boolean;
  completedCount?: number;
  totalStudents?: number;
}

@Component({
  selector: 'app-class-assignments',
  templateUrl: './class-assignments.component.html',
  styleUrls: ['./class-assignments.component.css']
})
export class ClassAssignmentsComponent implements OnInit {
  classId: number | null = null;
  assignments: TeacherAssignment[] = [];
  loading = false;
  allChecked = false;

  // Create Assignment Modal
  createModalVisible = false;
  uploadedFile: File | null = null;
  assignmentForm = {
    title: '',
    description: '',
    dueDate: null as Date | null,
    file: null as File | null
  };

  // Edit Assignment Modal
  editModalVisible = false;
  editingAssignment: TeacherAssignment | null = null;
  editForm = {
    title: '',
    description: '',
    dueDate: null as Date | null,
    file: null as File | null
  };
  editUploadedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modal: NzModalService,
    private message: NzMessageService,
    private assignmentService: AssignmentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.classId = +params['id'];
      if (this.classId) {
        this.loadAssignments();
      }
    });
  }

  loadAssignments(): void {
    this.loading = true;

    // TODO: Backend cần tạo endpoint GET /assignments/class/{classRoomId}
    // Tạm thời set empty để test UI
    console.warn('Backend endpoint /assignments/class/:id chưa có hoặc trả về 400');
    console.log('Cần backend tạo endpoint: GET /assignments/class/{classRoomId}');

    this.assignmentService.getAssignmentsByClass(this.classId!).subscribe({
      next: (data) => {
        console.log('Assignments loaded:', data);

        // Map to TeacherAssignment với completedCount và totalStudents từ submissions
        this.assignments = data.map(a => ({
          ...a,
          checked: false,
          completedCount: a.submissions?.length || 0,
          totalStudents: a.classRoom?.students?.length || 0
        } as TeacherAssignment));

        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load assignments:', err);
        console.error('Error details:', {
          status: err.status,
          message: err.message,
          url: err.url
        });
        this.assignments = [];
        this.loading = false;
        this.message.error('Backend chưa có API lấy danh sách bài tập theo lớp');
      }
    });
  }

  checkAll(checked: boolean): void {
    this.assignments.forEach(a => a.checked = checked);
  }

  getCompletionPercentage(assignment: any): number {
    if (!assignment.totalStudents || assignment.totalStudents === 0) return 0;
    return Math.round((assignment.completedCount || 0) / assignment.totalStudents * 100);
  }

  createAssignment(): void {
    this.assignmentForm = {
      title: '',
      description: '',
      dueDate: null,
      file: null
    };
    this.uploadedFile = null;
    this.createModalVisible = true;
  }

  closeCreateModal(): void {
    this.createModalVisible = false;
    this.assignmentForm = {
      title: '',
      description: '',
      dueDate: null,
      file: null
    };
    this.uploadedFile = null;
  }

  handleFileUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadedFile = file;
      this.assignmentForm.file = file;
    }
  }

  removeFile(): void {
    this.uploadedFile = null;
    this.assignmentForm.file = null;
  }

  submitCreateAssignment(): void {
    if (!this.assignmentForm.title || !this.assignmentForm.description || !this.assignmentForm.dueDate) {
      this.message.warning('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Get teacher ID from current user
    const currentUser = this.authService.getCurrentUser();
    console.log('=== CREATE ASSIGNMENT DEBUG ===');
    console.log('Current user from localStorage:', currentUser);
    console.log('Teacher object:', currentUser?.teacher);

    // teacherId is at user.teacher.id according to login response
    let teacherId = currentUser?.teacher?.id;
    console.log('Teacher ID from user.teacher.id:', teacherId);

    // TEMPORARY FIX: If teacherId is null, use hardcoded value
    if (!teacherId) {
      console.warn('⚠️ teacherId is null, using hardcoded value = 2');
      teacherId = 2; // Hardcoded for testing
    }

    console.log('✅ Final teacherId to be sent:', teacherId);
    console.log('✅ Final classRoomId to be sent:', this.classId);

    // Prepare FormData instead of JSON
    const formData = new FormData();
    formData.append('title', this.assignmentForm.title);
    formData.append('description', this.assignmentForm.description);
    formData.append('dueDate', this.assignmentForm.dueDate!.toISOString().split('T')[0]);
    formData.append('classRoomId', this.classId!.toString());
    formData.append('teacherId', teacherId.toString());

    // Add file if exists
    if (this.assignmentForm.file) {
      formData.append('file', this.assignmentForm.file);
      console.log('� File attached:', this.assignmentForm.file.name);
    }

    console.log('📤 Sending FormData with:');
    console.log('  - title:', this.assignmentForm.title);
    console.log('  - description:', this.assignmentForm.description);
    console.log('  - dueDate:', this.assignmentForm.dueDate!.toISOString().split('T')[0]);
    console.log('  - classRoomId:', this.classId);
    console.log('  - teacherId:', teacherId);

    // Call API to create assignment with FormData
    this.assignmentService.createAssignmentWithFile(formData).subscribe({
      next: (response) => {
        console.log('✅ Assignment created successfully:', response);
        this.message.success('Tạo bài tập thành công');
        this.closeCreateModal();
        this.loadAssignments();
      },
      error: (err) => {
        console.error('❌ Failed to create assignment:', err);
        console.error('❌ Error status:', err.status);
        console.error('❌ Error response:', err.error);
        console.error('❌ Error message:', err.message);
        this.message.error('Tạo bài tập thất bại: ' + (err.error?.message || err.message));
      }
    });
  }

  viewAssignment(assignment: Assignment): void {
    this.router.navigate(['/teacher/classes', this.classId, 'assignments', assignment.id]);
  }

  editAssignment(assignment: Assignment): void {
    this.editingAssignment = assignment;
    this.editForm = {
      title: assignment.title,
      description: assignment.description || '',
      dueDate: assignment.dueDate ? new Date(assignment.dueDate) : null,
      file: null
    };
    this.editUploadedFile = null;
    this.editModalVisible = true;
  }

  closeEditModal(): void {
    this.editModalVisible = false;
    this.editingAssignment = null;
    this.editForm = {
      title: '',
      description: '',
      dueDate: null,
      file: null
    };
    this.editUploadedFile = null;
  }

  handleEditFileUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.editUploadedFile = file;
      this.editForm.file = file;
    }
  }

  removeEditFile(): void {
    this.editUploadedFile = null;
    this.editForm.file = null;
  }

  submitEditAssignment(): void {
    if (!this.editForm.title || !this.editForm.description || !this.editForm.dueDate) {
      this.message.warning('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (!this.editingAssignment) {
      this.message.error('Không tìm thấy bài tập cần sửa');
      return;
    }

    // Get teacher ID from current user
    const currentUser = this.authService.getCurrentUser();
    let teacherId = currentUser?.teacher?.id;

    if (!teacherId) {
      console.warn('⚠️ teacherId is null, using hardcoded value = 2');
      teacherId = 2;
    }

    // Prepare FormData
    const formData = new FormData();
    formData.append('title', this.editForm.title);
    formData.append('description', this.editForm.description);
    formData.append('dueDate', this.editForm.dueDate!.toISOString().split('T')[0]);
    formData.append('classRoomId', this.classId!.toString());
    formData.append('teacherId', teacherId.toString());

    // Add file if exists
    if (this.editForm.file) {
      formData.append('file', this.editForm.file);
    }

    console.log('📝 Updating assignment ID:', this.editingAssignment.id);

    // Call API to update assignment
    this.assignmentService.updateAssignment(this.editingAssignment.id, formData).subscribe({
      next: (response) => {
        console.log('✅ Assignment updated successfully:', response);
        this.message.success('Cập nhật bài tập thành công');
        this.closeEditModal();
        this.loadAssignments();
      },
      error: (err) => {
        console.error('❌ Failed to update assignment:', err);
        this.message.error('Cập nhật bài tập thất bại: ' + (err.error?.message || err.message));
      }
    });
  }

  deleteAssignment(assignment: Assignment): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa bài tập',
      nzContent: `Bạn có chắc chắn muốn xóa bài tập "<strong>${assignment.title}</strong>"?<br/>Hành động này không thể hoàn tác.`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        console.log('🗑️ Deleting assignment ID:', assignment.id);

        this.assignmentService.deleteAssignment(assignment.id).subscribe({
          next: () => {
            console.log('✅ Assignment deleted successfully');
            this.message.success('Xóa bài tập thành công');
            this.loadAssignments();
          },
          error: (err) => {
            console.error('❌ Failed to delete assignment:', err);
            this.message.error('Xóa bài tập thất bại: ' + (err.error?.message || err.message));
          }
        });
      }
    });
  }
}
