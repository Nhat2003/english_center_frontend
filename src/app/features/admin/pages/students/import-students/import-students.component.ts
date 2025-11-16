import { Component, EventEmitter, Output } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { ExcelService, ExcelStudent } from '../../../../../core/services/excel.service';
import { StudentService } from '../../../../../core/services/student.service';

@Component({
  selector: 'app-import-students',
  templateUrl: './import-students.component.html',
  styleUrls: ['./import-students.component.css']
})
export class ImportStudentsComponent {
  @Output() importSuccess = new EventEmitter<void>();

  selectedFile: File | null = null;
  isProcessing = false;
  previewData: ExcelStudent[] = [];
  validData: ExcelStudent[] = [];
  errors: string[] = [];
  showPreview = false;
  step = 1; // 1: Select file, 2: Preview, 3: Import

  constructor(
    private modal: NzModalRef,
    private message: NzMessageService,
    private excelService: ExcelService,
    private studentService: StudentService
  ) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
      ];

      if (!allowedTypes.includes(file.type)) {
        this.message.error('Chỉ hỗ trợ file Excel (.xls, .xlsx)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.message.error('File không được vượt quá 5MB');
        return;
      }

      this.selectedFile = file;
      this.processFile();
    }
  }

  async processFile(): Promise<void> {
    if (!this.selectedFile) return;

    this.isProcessing = true;
    try {
      // Đọc file Excel
      this.previewData = await this.excelService.readExcelFile(this.selectedFile);

      // Validate dữ liệu
      const validation = this.excelService.validateStudentData(this.previewData);
      this.validData = validation.valid;
      this.errors = validation.errors;

      if (this.validData.length === 0) {
        this.message.error('Không có dữ liệu hợp lệ để import');
        return;
      }

      this.showPreview = true;
      this.step = 2;

      if (this.errors.length > 0) {
        this.message.warning(`Có ${this.errors.length} lỗi trong dữ liệu. Vui lòng kiểm tra lại.`);
      } else {
        this.message.success(`Đã đọc thành công ${this.validData.length} học sinh từ file Excel`);
      }

    } catch (error) {
      this.message.error(error.message || 'Lỗi đọc file Excel');
      console.error('Error processing Excel file:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  importStudents(): void {
    if (this.validData.length === 0) {
      this.message.error('Không có dữ liệu để import');
      return;
    }

    this.isProcessing = true;
    this.step = 3;

    // Gọi API import students
    this.studentService.importStudents(this.validData).subscribe({
      next: (result) => {
        this.message.success(`Import thành công ${result.successCount || this.validData.length} học sinh`);
        this.importSuccess.emit();
        this.closeModal();
        this.isProcessing = false;
      },
      error: (error) => {
        this.message.error('Lỗi import dữ liệu: ' + (error.error?.message || error.message || 'Unknown error'));
        console.error('Import error:', error);
        this.isProcessing = false;
      }
    });
  }

  downloadSample(): void {
    this.excelService.downloadSampleExcel();
    this.message.success('Đã tải xuống file mẫu');
  }

  resetFile(): void {
    this.selectedFile = null;
    this.previewData = [];
    this.validData = [];
    this.errors = [];
    this.showPreview = false;
    this.step = 1;
  }

  closeModal(): void {
    this.modal.close();
  }
}
