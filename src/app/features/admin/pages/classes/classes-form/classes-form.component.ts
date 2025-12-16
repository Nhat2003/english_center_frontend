import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ClassService } from '../../../../../core/services/class.service';
import { CourseService } from '../../../../../core/services/course.service';
import { TeacherService } from '../../../../../core/services/teacher.service';
import { StudentService } from '../../../../../core/services/student.service';
import { ScheduleService } from '../../../../../core/services/schedule.service';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Class } from '../../../../../core/models/class.model';
import { Course } from '../../../../../core/models/course.model';
import { Teacher } from '../../../../../core/models/teacher.model';
import { Student } from '../../../../../core/models/student.model';
import { Schedule } from '../../../../../core/models/schedule.model';
import { Room } from '../../../../../core/models/fixed-schedule.model';
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
  schedules: any[] = []; // Changed to any[] to support both Schedule and FixedSchedule types
  rooms: Room[] = [];

  // Student selection
  filteredStudents: Student[] = [];
  studentSearchText = '';
  selectAllStudents = false;
  isIndeterminate = false;

  isLoadingCourses = false;
  isLoadingTeachers = false;
  isLoadingStudents = false;
  isLoadingSchedules = false;
  isLoadingRooms = false;

  constructor(
    private fb: FormBuilder,
    private classService: ClassService,
    private courseService: CourseService,
    private teacherService: TeacherService,
    private studentService: StudentService,
    private scheduleService: ScheduleService,
    private modal: NzModalRef,
    private modalService: NzModalService,
    private message: NzMessageService
  ) {
    this.classForm = this.fb.group({
      name: [null, Validators.required],
      description: [null],
      fixedScheduleId: [null, Validators.required], // Changed from scheduleId to fixedScheduleId
      teacherId: [null, Validators.required],
      courseId: [null, Validators.required],
      roomId: [null], // Changed from roomName to roomId
      startDate: [null, Validators.required],
      endDate: [{ value: null, disabled: true }], // Auto-calculated, disabled input
      studentIds: [[]],
      maxStudents: [30],
      status: ['active']
    });
  }

  ngOnInit() {
    this.isEditMode = this.mode === 'edit';

    // Load dropdown data first, then populate form when schedules are loaded
    this.loadDropdownData().then(() => {
      // Handle different ways class data can be passed
      if (this.classData) {
        // If we have full class data with more than just ID
        if (this.classData.name || this.classData.teacherId || this.classData.courseId) {
          this.classDetails = this.classData as Class;
          this.populateForm(this.classData);
        }
        // If we only have ID, load details from API
        else if (this.classData.id) {
          this.loadClassDetails(this.classData.id);
        }
      }
    });

    // Setup auto-calculate endDate when courseId or startDate changes
    this.setupEndDateCalculation();

    // Disable form nếu là view mode
    if (this.mode === 'view') {
      this.classForm.disable();
    }
  }



  loadDropdownData(): Promise<void> {
    return new Promise((resolve) => {
      this.isLoadingCourses = true;
      this.isLoadingTeachers = true;
      this.isLoadingStudents = true;
      this.isLoadingSchedules = true;
      this.isLoadingRooms = true;

      const courses$ = this.courseService.getCourses(0, 1000);
      const teachers$ = this.teacherService.getTeachers();
      const students$ = this.studentService.getStudents(0, 1000);
      const schedules$ = this.scheduleService.getFixedSchedules();
      const rooms$ = this.scheduleService.getRooms();

      forkJoin({
        courses: courses$,
        teachers: teachers$,
        students: students$,
        schedules: schedules$,
        rooms: rooms$
      }).subscribe({
        next: (results) => {
          // Process courses
          if (results.courses && (results.courses as any).content && Array.isArray((results.courses as any).content)) {
            this.courses = (results.courses as any).content;
          } else if (Array.isArray(results.courses)) {
            this.courses = results.courses as any[];
          } else {
            this.courses = [];
          }

          // Process teachers
          const teacherArr = Array.isArray(results.teachers) ? results.teachers : ((results.teachers as any).content || []);
          this.teachers = teacherArr.map((t: any) => ({
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

          // Process students
          if (results.students && (results.students as any).content && Array.isArray((results.students as any).content)) {
            this.students = (results.students as any).content.map((s: any) => ({
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
              className: s.className || '',
              checked: false
            }));
          } else if (Array.isArray(results.students)) {
            this.students = (results.students as any[]).map((s: any) => ({
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
              className: s.className || '',
              checked: false
            }));
          } else {
            this.students = [];
          }

          // Initialize filtered students
          this.filteredStudents = [...this.students];

          // Process schedules
          this.schedules = results.schedules as any[];
          // Process rooms
          this.rooms = Array.isArray(results.rooms) ? results.rooms : [];
          // Mark all as loaded
          this.isLoadingCourses = false;
          this.isLoadingTeachers = false;
          this.isLoadingStudents = false;
          this.isLoadingSchedules = false;
          this.isLoadingRooms = false;

          resolve();
        },
        error: (error) => {
          console.error('Error loading dropdown data:', error);
          this.isLoadingCourses = false;
          this.isLoadingTeachers = false;
          this.isLoadingStudents = false;
          this.isLoadingSchedules = false;
          this.isLoadingRooms = false;
          resolve(); // Resolve anyway to not block form
        }
      });
    });
  }

  setupEndDateCalculation() {
    // Listen to changes in courseId and startDate
    this.classForm.get('courseId')?.valueChanges.subscribe(() => {
      this.calculateEndDate();
    });

    this.classForm.get('startDate')?.valueChanges.subscribe(() => {
      this.calculateEndDate();
    });
  }

  calculateEndDate() {
    const courseId = this.classForm.get('courseId')?.value;
    const startDate = this.classForm.get('startDate')?.value;

    if (!courseId || !startDate) {
      // Clear endDate if missing required fields
      this.classForm.get('endDate')?.setValue(null);
      return;
    }

    // Find selected course
    const selectedCourse = this.courses.find(c => c.id === courseId);
    if (!selectedCourse || !selectedCourse.duration) {
      this.classForm.get('endDate')?.setValue(null);
      return;
    }

    // Calculate end date
    const start = new Date(startDate);
    const durationDays = selectedCourse.duration * 7; // Convert weeks to days
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays);

    console.log('Auto-calculated endDate:', {
      courseId,
      courseName: selectedCourse.name,
      durationWeeks: selectedCourse.duration,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });

    // Set the calculated end date
    this.classForm.get('endDate')?.setValue(end);
  }

  getLevelColor(level: string): string {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'green';
      case 'intermediate': return 'orange';
      case 'advanced': return 'red';
      default: return 'blue';
    }
  }

  formatDaysOfWeek(daysOfWeek: string | null | undefined): string {
    if (!daysOfWeek) return '';

    const dayMap: { [key: string]: string } = {
      '2': 'T2',
      '3': 'T3',
      '4': 'T4',
      '5': 'T5',
      '6': 'T6',
      '7': 'T7',
      '8': 'CN'
    };

    return daysOfWeek.split(',').map(d => dayMap[d.trim()] || d).join(', ');
  }

  getScheduleDisplayText(schedule: any): string {
    if (!schedule) return '';

    let text = schedule.name || '';

    if (schedule.daysOfWeek && schedule.startTime && schedule.endTime) {
      const days = this.formatDaysOfWeek(schedule.daysOfWeek);
      const startTime = schedule.startTime.substring(0, 5); // HH:mm
      const endTime = schedule.endTime.substring(0, 5);     // HH:mm
      text += ` (${days}) ${startTime} - ${endTime}`;
    }

    return text;
  }

  // Student selection methods
  get selectedStudentIds(): number[] {
    return this.students.filter(s => (s as any).checked).map(s => s.id!);
  }

  filterStudents() {
    const searchText = this.studentSearchText.toLowerCase().trim();

    if (!searchText) {
      this.filteredStudents = [...this.students];
    } else {
      this.filteredStudents = this.students.filter(student =>
        (student.fullName?.toLowerCase().includes(searchText)) ||
        (student.email?.toLowerCase().includes(searchText))
      );
    }

    this.updateSelectAllState();
  }

  onStudentCheckChange() {
    this.updateSelectAllState();
    this.updateFormValue();
  }

  onSelectAllStudents(checked: boolean) {
    this.filteredStudents.forEach(student => {
      (student as any).checked = checked;
    });
    this.updateFormValue();
  }

  updateSelectAllState() {
    const checkedCount = this.filteredStudents.filter(s => (s as any).checked).length;
    this.selectAllStudents = checkedCount === this.filteredStudents.length && this.filteredStudents.length > 0;
    this.isIndeterminate = checkedCount > 0 && checkedCount < this.filteredStudents.length;
  }

  updateFormValue() {
    const studentIds = this.selectedStudentIds;
    this.classForm.patchValue({ studentIds });
  }

  getStudentName(studentId: number): string {
    const student = this.students.find(s => s.id === studentId);
    return student?.fullName || 'Unknown';
  }

  removeStudent(studentId: number) {
    const student = this.students.find(s => s.id === studentId);
    if (student) {
      (student as any).checked = false;
      this.updateFormValue();
      this.updateSelectAllState();
    }
  }

  isStudentSelectionModalVisible = false;

  openStudentSelectionModal() {
    this.isStudentSelectionModalVisible = true;
    this.filterStudents(); // Reset filter
  }

  handleStudentSelectionOk() {
    this.updateFormValue();
    this.isStudentSelectionModalVisible = false;
  }

  handleStudentSelectionCancel() {
    this.isStudentSelectionModalVisible = false;
  }

  loadClassDetails(classId: number) {
    this.isLoading = true;
    this.classService.getClass(classId).subscribe({
      next: (classItem) => {
        this.classDetails = classItem;
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
    // API trả về fixedSchedule object thay vì fixedScheduleId
    // Nên cần match fixedSchedule với schedule trong dropdown để lấy ID
    let fixedScheduleId = classItem.fixedScheduleId || classItem.scheduleId || classItem.schedule || null;

    // Nếu API trả về fixedSchedule object, tìm schedule tương ứng trong dropdown
    if (!fixedScheduleId && classItem.fixedSchedule && this.schedules.length > 0) {
      const matchedSchedule = this.schedules.find(s =>
        s.name === classItem.fixedSchedule.name &&
        s.daysOfWeek === classItem.fixedSchedule.daysOfWeek &&
        s.startTime === classItem.fixedSchedule.startTime &&
        s.endTime === classItem.fixedSchedule.endTime
      );
      if (matchedSchedule) {
        fixedScheduleId = matchedSchedule.id;
        }
    }

    // API trả về teacherName (string) thay vì teacherId
    // Cần match với teacher trong dropdown
    let teacherId = classItem.teacherId || null;
    if (!teacherId && classItem.teacherName && this.teachers.length > 0) {
      const matchedTeacher = this.teachers.find(t =>
        t.fullName === classItem.teacherName
      );
      if (matchedTeacher) {
        teacherId = matchedTeacher.id;
        } else {
        }
    }

    // API trả về courseName (string) thay vì courseId
    // Cần match với course trong dropdown
    let courseId = classItem.courseId || null;
    if (!courseId && classItem.courseName && this.courses.length > 0) {
      const matchedCourse = this.courses.find(c =>
        c.name === classItem.courseName
      );
      if (matchedCourse) {
        courseId = matchedCourse.id;
        } else {
        }
    }

    // Map the class data to form fields with detailed logging
    const studentIds = classItem.studentIds || classItem.students || [];

    // Get roomId from roomName if needed
    let roomId = classItem.roomId || null;
    if (!roomId && classItem.roomName && this.rooms.length > 0) {
      const matchedRoom = this.rooms.find(r => r.name === classItem.roomName);
      if (matchedRoom) {
        roomId = matchedRoom.id;
        }
    }

    const formData = {
      name: classItem.name || '',
      description: classItem.description || '',
      fixedScheduleId: fixedScheduleId,
      teacherId: teacherId,
      courseId: courseId,
      roomId: roomId,
      startDate: classItem.startDate || null,
      endDate: classItem.endDate || null,
      studentIds: studentIds,
      maxStudents: classItem.maxStudents || 30,
      status: classItem.status || 'active'
    };

    this.classForm.patchValue(formData);

    // Mark students as checked based on studentIds
    if (studentIds && Array.isArray(studentIds)) {
      this.students.forEach(student => {
        (student as any).checked = studentIds.includes(student.id);
      });
      this.filteredStudents = [...this.students];
      this.updateSelectAllState();
    }

    // Mark form as pristine after loading data
    this.classForm.markAsPristine();
  }

  onSubmit() {
    if (this.classForm.valid) {
      this.isLoading = true;
      const rawFormData = this.classForm.value;

      // Get endDate from disabled control
      const endDateValue = this.classForm.get('endDate')?.value;

      // Prepare form data to match backend requirements (Postman format)
      const formData: any = {
        name: rawFormData.name,
        courseId: rawFormData.courseId,
        teacherId: rawFormData.teacherId,
        fixedScheduleId: rawFormData.fixedScheduleId,
        startDate: this.formatDateToString(rawFormData.startDate),
        studentIds: rawFormData.studentIds || []
      };

      // Convert roomId to send to backend (backend may accept roomId)
      if (rawFormData.roomId) {
        formData.roomId = rawFormData.roomId;
      }
      if (rawFormData.description) {
        formData.description = rawFormData.description;
      }
      if (rawFormData.maxStudents) {
        formData.maxStudents = rawFormData.maxStudents;
      }
      if (rawFormData.status) {
        formData.status = rawFormData.status;
      }

      // Xử lý create vs edit mode
      const apiCall = this.mode === 'edit' && this.classDetails?.id
        ? this.classService.updateClass(this.classDetails.id, formData)
        : this.classService.createClass(formData);

      const action = this.mode === 'edit' ? 'cập nhật' : 'tạo';

      apiCall.subscribe({
        next: (classItem) => {
          this.isLoading = false;
          this.message.success(`${action === 'tạo' ? 'Thêm' : 'Cập nhật'} lớp học thành công!`);
          this.modal.close(true);
        },
        error: (error) => {
          this.isLoading = false;
          console.error(`=== ERROR ${action}ing class ===`);
          console.error('Error object:', error);
          console.error('Error status:', error.status);
          console.error('Error statusText:', error.statusText);
          console.error('Error error:', error.error);
          console.error('Error message:', error.message);
          console.error('Error headers:', error.headers);

          // Log the exact error response from backend
          if (error.error) {
            console.error('Backend error response:', error.error);
          }

          // Handle different error codes
          if (error.status === 403) {
            this.message.error('Bạn không có quyền thực hiện thao tác này. Vui lòng kiểm tra lại token hoặc quyền truy cập.');
          } else if (error.status === 409) {
            // Conflict error - schedule conflict
            this.message.error('Xung đột lịch');
          } else if (error.status === 400) {
            // Check if error message indicates schedule conflict
            const errorMsg = error.error?.message || error.error?.error || error.error || '';
            if (typeof errorMsg === 'string' &&
                (errorMsg.toLowerCase().includes('conflict') ||
                 errorMsg.toLowerCase().includes('xung đột') ||
                 errorMsg.toLowerCase().includes('schedule') ||
                 errorMsg.toLowerCase().includes('lịch'))) {
              this.message.error('Xung đột lịch');
            } else {
              this.tryAlternativeCreate(rawFormData, action);
            }
          } else {
            this.handleError(error, action);
          }
        }
      });
    }
  }

  handleError(error: any, action: string) {
    let errorMessage = `Có lỗi xảy ra khi ${action} lớp học`;

    if (error.status === 409) {
      // HTTP 409 Conflict - Schedule conflict
      errorMessage = 'Xung đột lịch';
    } else if (error.status === 400) {
      // Try to get detailed validation error
      if (error.error?.message) {
        const msg = error.error.message;
        // Check if the error message indicates schedule conflict
        if (typeof msg === 'string' &&
            (msg.toLowerCase().includes('conflict') ||
             msg.toLowerCase().includes('xung đột') ||
             msg.toLowerCase().includes('schedule') ||
             msg.toLowerCase().includes('lịch'))) {
          errorMessage = 'Xung đột lịch';
        } else {
          errorMessage = msg;
        }
      } else if (error.error?.error) {
        const err = error.error.error;
        if (typeof err === 'string' &&
            (err.toLowerCase().includes('conflict') ||
             err.toLowerCase().includes('xung đột') ||
             err.toLowerCase().includes('schedule') ||
             err.toLowerCase().includes('lịch'))) {
          errorMessage = 'Xung đột lịch';
        } else {
          errorMessage = err;
        }
      } else if (typeof error.error === 'string') {
        const errStr = error.error;
        if (errStr.toLowerCase().includes('conflict') ||
            errStr.toLowerCase().includes('xung đột') ||
            errStr.toLowerCase().includes('schedule') ||
            errStr.toLowerCase().includes('lịch')) {
          errorMessage = 'Xung đột lịch';
        } else {
          errorMessage = errStr;
        }
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
    // Try with minimal required fields only - matching your sample request
    const alternativeData: any = {
      name: rawFormData.name,
      fixedScheduleId: rawFormData.fixedScheduleId,
      teacherId: rawFormData.teacherId,
      courseId: rawFormData.courseId,
      startDate: this.formatDateToString(rawFormData.startDate),
      studentIds: rawFormData.studentIds || []
    };

    // Add roomId if available
    if (rawFormData.roomId) {
      alternativeData.roomId = rawFormData.roomId;
    }

    const apiCall = this.mode === 'edit' && this.classDetails?.id
      ? this.classService.updateClass(this.classDetails.id, alternativeData)
      : this.classService.createClass(alternativeData);

    apiCall.subscribe({
      next: (classItem) => {
        this.isLoading = false;
        this.message.success(`${action === 'tạo' ? 'Thêm' : 'Cập nhật'} lớp học thành công!`);
        this.modal.close(true);
      },
      error: (error) => {
        this.isLoading = false;
        console.error(`Alternative ${action} also failed:`, error);

        // Check for schedule conflict
        if (error.status === 409) {
          this.message.error('Xung đột lịch');
        } else if (error.status === 400) {
          const errorMsg = error.error?.message || error.error?.error || error.error || '';
          if (typeof errorMsg === 'string' &&
              (errorMsg.toLowerCase().includes('conflict') ||
               errorMsg.toLowerCase().includes('xung đột') ||
               errorMsg.toLowerCase().includes('schedule') ||
               errorMsg.toLowerCase().includes('lịch'))) {
            this.message.error('Xung đột lịch');
          } else {
            this.handleError(error, action);
          }
        } else {
          this.handleError(error, action);
        }
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

  formatDateToString(date: any): string | null {
    if (!date) return null;

    // Nếu là Date object
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Nếu là string
    if (typeof date === 'string') {
      // Kiểm tra xem đã đúng format yyyy-MM-dd chưa
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      // Thử parse và format lại
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return this.formatDateToString(parsedDate);
      }
    }

    return null;
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
