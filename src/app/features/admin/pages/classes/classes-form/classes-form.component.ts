import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClassService } from '../../../../../core/services/class.service';
import { CourseService } from '../../../../../core/services/course.service';
import { TeacherService } from '../../../../../core/services/teacher.service';
import { StudentService } from '../../../../../core/services/student.service';
import { ScheduleService } from '../../../../../core/services/schedule.service';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Class } from '../../../../../core/models/class.model';
import { Course } from '../../../../../core/models/course.model';
import { Teacher } from '../../../../../core/models/teacher.model';
import { Student } from '../../../../../core/models/student.model';
import { Schedule } from '../../../../../core/models/schedule.model';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-classes-form',
  templateUrl: './classes-form.component.html',
  styleUrls: ['./classes-form.component.css']
})
export class ClassesFormComponent implements OnInit {
  @Input() classData: Partial<Class> | null = null;
  @Input() mode: 'create' | 'edit' | 'view' = 'create';
  @Output() save = new EventEmitter<Class>();
  @Output() cancel = new EventEmitter<void>();

  classForm: FormGroup;
  isLoading = false;
  isEditMode = false;
  classDetails: Class | null = null;

  courses: Course[] = [];
  teachers: Teacher[] = [];
  students: Student[] = [];
  schedules: Schedule[] = [];

  isLoadingCourses = false;
  isLoadingTeachers = false;
  isLoadingStudents = false;
  isLoadingSchedules = false;

  constructor(
    private fb: FormBuilder,
    private classService: ClassService,
    private courseService: CourseService,
    private teacherService: TeacherService,
    private studentService: StudentService,
    private scheduleService: ScheduleService,
    private modal: NzModalRef,
    private message: NzMessageService
  ) {
    this.classForm = this.fb.group({
      name: [null, Validators.required],
      description: [null],
      scheduleId: [null, Validators.required],
      teacherId: [null, Validators.required],
      courseId: [null, Validators.required],
      studentIds: [[]],
      maxStudents: [30],
      status: ['active']
    });
  }

  ngOnInit() {
    this.isEditMode = this.mode === 'edit';

    // Load dropdown data
    this.loadDropdownData();

    // Handle different ways class data can be passed
    if (this.classData) {
      console.log('Received class data:', this.classData);

      // If we have full class data with more than just ID
      if (this.classData.name || this.classData.teacherId || this.classData.courseId) {
        console.log('Using full class data');
        this.classDetails = this.classData as Class;
        this.populateForm(this.classData);
      }
      // If we only have ID, load details from API
      else if (this.classData.id) {
        console.log('Loading class details by ID:', this.classData.id);
        this.loadClassDetails(this.classData.id);
      }
    }

    // Disable form nếu là view mode
    if (this.mode === 'view') {
      this.classForm.disable();
    }
  }

  loadDropdownData() {
    console.log('Loading dropdown data...');
    // Load courses
    this.isLoadingCourses = true;
    this.courseService.getCourses(0, 1000).subscribe({
      next: (data: any) => {
        // Xử lý response từ backend
        if (data && data.content && Array.isArray(data.content)) {
          this.courses = data.content;
        } else if (Array.isArray(data)) {
          this.courses = data;
        } else {
          this.courses = [];
        }
        this.isLoadingCourses = false;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.isLoadingCourses = false;
      }
    });

    // Load teachers
    this.isLoadingTeachers = true;
    this.teacherService.getTeachers().subscribe({
      next: (data: any) => {
        const arr = Array.isArray(data) ? data : (data.content || []);
        this.teachers = arr.map((t: any) => ({
          id: t.id,
          name: t.fullName || '',
          email: t.email || '',
          phone: t.phone || '',
          speciality: t.speciality || '',
          fullName: t.fullName || '',
          userId: t.userId,
          dob: t.dob,
          gender: t.gender,
          address: t.address,
          hiredAt: t.hiredAt
        }));
        this.isLoadingTeachers = false;
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
        this.isLoadingTeachers = false;
      }
    });

    // Load students
    this.isLoadingStudents = true;
    this.studentService.getStudents(0, 1000).subscribe({
      next: (data: any) => {
        // Xử lý response từ backend
        if (data && data.content && Array.isArray(data.content)) {
          this.students = data.content.map((s: any) => ({
            id: s.id,
            name: s.fullName || '',
            email: s.email || '',
            phone: s.phone || '',
            fullName: s.fullName || '',
            userId: s.userId,
            dob: s.dob,
            gender: s.gender,
            address: s.address,
            joinedAt: s.joinedAt,
            className: s.className || ''
          }));
        } else if (Array.isArray(data)) {
          this.students = data.map((s: any) => ({
            id: s.id,
            name: s.fullName || '',
            email: s.email || '',
            phone: s.phone || '',
            fullName: s.fullName || '',
            userId: s.userId,
            dob: s.dob,
            gender: s.gender,
            address: s.address,
            joinedAt: s.joinedAt,
            className: s.className || ''
          }));
        } else {
          this.students = [];
        }
        this.isLoadingStudents = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.isLoadingStudents = false;
      }
    });

    // Load schedules
    this.isLoadingSchedules = true;
    this.scheduleService.getAllSchedules().subscribe({
      next: (schedules) => {
        this.schedules = schedules;
        this.isLoadingSchedules = false;
      },
      error: (error) => {
        console.error('Error loading schedules from API:', error);
        // Fallback to mock data if API fails
        this.scheduleService.getMockSchedules().subscribe({
          next: (mockSchedules) => {
            this.schedules = mockSchedules;
            this.isLoadingSchedules = false;
          },
          error: () => {
            this.schedules = [];
            this.isLoadingSchedules = false;
          }
        });
      }
    });
  }

  getLevelColor(level: string): string {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'green';
      case 'intermediate': return 'orange';
      case 'advanced': return 'red';
      default: return 'blue';
    }
  }

  loadClassDetails(classId: number) {
    this.isLoading = true;
    this.classService.getClass(classId).subscribe({
      next: (classItem) => {
        this.classDetails = classItem;
        console.log('Loaded class details:', classItem);
        this.populateForm(classItem);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading class details:', error);
        this.message.error('Không thể tải thông tin lớp học');
      }
    });
  }

  populateForm(classItem: any) {
    // Map the class data to form fields with detailed logging
    const formData = {
      name: classItem.name || '',
      description: classItem.description || '',
      scheduleId: classItem.scheduleId || classItem.schedule || null,
      teacherId: classItem.teacherId || null,
      courseId: classItem.courseId || null,
      studentIds: classItem.studentIds || [],
      maxStudents: classItem.maxStudents || 30,
      status: classItem.status || 'active'
    };

    console.log('Original class item:', classItem);
    console.log('Mapped form data:', formData);
    console.log('Form before patch:', this.classForm.value);

    this.classForm.patchValue(formData);

    console.log('Form after patch:', this.classForm.value);

    // Mark form as pristine after loading data
    this.classForm.markAsPristine();
  }

  onSubmit() {
    if (this.classForm.valid) {
      this.isLoading = true;
      const rawFormData = this.classForm.value;

      // Prepare form data to match backend requirements
      // Include all required fields: courseId might be required
      const formData: any = {
        name: rawFormData.name,
        schedule: rawFormData.scheduleId, // Backend database expects 'schedule' field
        courseId: rawFormData.courseId,   // Include courseId as it might be required
        teacherId: rawFormData.teacherId,
        studentIds: rawFormData.studentIds || []
      };

      // Add optional fields if they have values
      if (rawFormData.description) {
        formData.description = rawFormData.description;
      }
      if (rawFormData.maxStudents) {
        formData.maxStudents = rawFormData.maxStudents;
      }
      if (rawFormData.status) {
        formData.status = rawFormData.status;
      }

      console.log('Raw form data:', rawFormData);
      console.log('Sending to backend:', formData);

      // Xử lý create vs edit mode
      const apiCall = this.mode === 'edit' && this.classDetails?.id
        ? this.classService.updateClass(this.classDetails.id, formData)
        : this.classService.createClass(formData);

      const action = this.mode === 'edit' ? 'cập nhật' : 'tạo';

      apiCall.subscribe({
        next: (classItem) => {
          this.isLoading = false;
          console.log(`Class ${action}d successfully:`, classItem);
          this.message.success(`${action === 'tạo' ? 'Thêm' : 'Cập nhật'} lớp học thành công!`);
          this.modal.close(true);
        },
        error: (error) => {
          this.isLoading = false;
          console.error(`Error ${action}ing class:`, error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.error);

          // Log the exact error response from backend
          if (error.error) {
            console.error('Backend error response:', error.error);
          }

          // For 400 Bad Request, try alternative approach
          if (error.status === 400) {
            console.log('400 Bad Request - trying alternative field mapping...');
            this.tryAlternativeCreate(rawFormData, action);
          } else {
            this.handleError(error, action);
          }
        }
      });
    }
  }

  handleError(error: any, action: string) {
    let errorMessage = `Có lỗi xảy ra khi ${action} lớp học`;

    console.log('HandleError called with:', error);

    if (error.status === 400) {
      // Try to get detailed validation error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
      }

      // Log full error for debugging
      console.error('400 Bad Request details:', {
        status: error.status,
        statusText: error.statusText,
        error: error.error,
        message: error.message
      });

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

  tryAlternativeCreate(rawFormData: any, action: string) {
    console.log('Trying alternative field mapping...');

    // Try with minimal required fields only - matching your sample request
    const alternativeData: any = {
      name: rawFormData.name,
      scheduleId: rawFormData.scheduleId, // Try with scheduleId instead of schedule
      teacherId: rawFormData.teacherId,
      studentIds: rawFormData.studentIds || []
    };

    // Add optional fields
    if (rawFormData.courseId) {
      alternativeData.courseId = rawFormData.courseId;
    }

    console.log('Trying alternative data:', alternativeData);

    const apiCall = this.mode === 'edit' && this.classDetails?.id
      ? this.classService.updateClass(this.classDetails.id, alternativeData)
      : this.classService.createClass(alternativeData);

    apiCall.subscribe({
      next: (classItem) => {
        this.isLoading = false;
        console.log(`Class ${action}d successfully with alternative:`, classItem);
        this.message.success(`${action === 'tạo' ? 'Thêm' : 'Cập nhật'} lớp học thành công!`);
        this.modal.close(true);
      },
      error: (error) => {
        this.isLoading = false;
        console.error(`Alternative ${action} also failed:`, error);
        this.handleError(error, action);
      }
    });
  }

  // Bulk add students functionality
  showBulkAddStudents = false;
  bulkStudentData: any[] = [];
  isProcessingBulk = false;

  openBulkAddStudents() {
    this.showBulkAddStudents = true;
  }

  closeBulkAddStudents() {
    this.showBulkAddStudents = false;
    this.bulkStudentData = [];
  }

  onFileUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.readExcelFile(file);
    }
  }

  readExcelFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Lấy sheet đầu tiên
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          this.message.error('File không có dữ liệu hoặc chỉ có header');
          return;
        }

        // Bỏ qua dòng header (dòng đầu tiên)
        this.bulkStudentData = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row: any = jsonData[i];
          if (row[0]) { // Chỉ xử lý nếu có tên
            const student = {
              fullName: row[0] || '',
              email: row[1] || '',
              phone: row[2] || '',
              dob: this.formatDate(row[3]) || '',
              gender: row[4] || '',
              address: row[5] || ''
            };
            this.bulkStudentData.push(student);
          }
        }

        this.message.success(`Đã đọc ${this.bulkStudentData.length} học sinh từ file`);
      } catch (error) {
        console.error('Error reading file:', error);
        // Fallback to CSV parsing for CSV files
        if (file.name.toLowerCase().endsWith('.csv')) {
          this.readCSVFile(e.target.result);
        } else {
          this.message.error('Không thể đọc file. Vui lòng kiểm tra định dạng file.');
        }
      }
    };

    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  readCSVFile(text: string) {
    try {
      const lines = text.split('\n');

      if (lines.length < 2) {
        this.message.error('File CSV không có dữ liệu');
        return;
      }

      this.bulkStudentData = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map((v: string) => v.trim().replace(/"/g, ''));
          const student = {
            fullName: values[0] || '',
            email: values[1] || '',
            phone: values[2] || '',
            dob: this.formatDate(values[3]) || '',
            gender: values[4] || '',
            address: values[5] || ''
          };
          this.bulkStudentData.push(student);
        }
      }
      this.message.success(`Đã đọc ${this.bulkStudentData.length} học sinh từ file CSV`);
    } catch (error) {
      this.message.error('Không thể đọc file CSV. Vui lòng kiểm tra định dạng.');
    }
  }

  formatDate(date: any): string {
    if (!date) return '';

    // Nếu là số Excel date
    if (typeof date === 'number') {
      const excelDate = XLSX.SSF.parse_date_code(date);
      if (excelDate) {
        return `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
      }
    }

    // Nếu là string, thử parse
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
      return date;
    }

    return '';
  }

  processBulkAddStudents() {
    if (this.bulkStudentData.length === 0) {
      this.message.warning('Không có dữ liệu để xử lý');
      return;
    }

    this.isProcessingBulk = true;
    let successCount = 0;
    let errorCount = 0;
    const totalCount = this.bulkStudentData.length;

    // Process each student
    const promises = this.bulkStudentData.map(studentData => {
      return this.studentService.createStudent(studentData).toPromise()
        .then(() => successCount++)
        .catch(() => errorCount++);
    });

    Promise.all(promises).then(() => {
      this.isProcessingBulk = false;
      this.message.success(`Hoàn thành! Thành công: ${successCount}, Lỗi: ${errorCount}`);

      if (successCount > 0) {
        // Reload students list
        this.loadDropdownData();
      }

      this.closeBulkAddStudents();
    });
  }

  downloadTemplate() {
    // Tạo workbook mới
    const workbook = XLSX.utils.book_new();

    // Dữ liệu mẫu
    const templateData = [
      ['Họ tên', 'Email', 'Số điện thoại', 'Ngày sinh (yyyy-mm-dd)', 'Giới tính', 'Địa chỉ'],
      ['Nguyễn Văn A', 'student1@email.com', '0123456789', '2000-01-01', 'Nam', 'Hà Nội'],
      ['Trần Thị B', 'student2@email.com', '0987654321', '2000-02-02', 'Nữ', 'TP.HCM'],
      ['Lê Văn C', 'student3@email.com', '0345678901', '2001-03-03', 'Nam', 'Đà Nẵng']
    ];

    // Tạo worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Họ tên
      { wch: 25 }, // Email
      { wch: 15 }, // Số điện thoại
      { wch: 18 }, // Ngày sinh
      { wch: 10 }, // Giới tính
      { wch: 30 }  // Địa chỉ
    ];

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách học sinh');

    // Download file
    XLSX.writeFile(workbook, 'mau_danh_sach_hoc_sinh.xlsx');

    this.message.success('Đã tải file mẫu thành công!');
  }
}
