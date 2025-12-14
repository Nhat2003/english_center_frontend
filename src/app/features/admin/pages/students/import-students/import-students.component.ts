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
  importMode: 'direct' | 'preview' = 'direct'; // 'direct': upload file trực tiếp, 'preview': xem trước rồi import
  isImporting = false; // Flag để ngăn gọi import nhiều lần

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

      // Nếu chọn mode direct, import ngay
      if (this.importMode === 'direct') {
        this.importDirectly();
      } else {
        // Nếu mode preview, xử lý file để xem trước
        this.processFile();
      }
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

    // Ngăn gọi import nhiều lần
    if (this.isImporting) {
      console.log('Import is already in progress');
      return;
    }

    if (!this.selectedFile) {
      this.message.error('Không tìm thấy file');
      return;
    }

    this.isImporting = true;
    this.isProcessing = true;
    this.step = 3;

    console.log('Starting preview mode import with', this.validData.length, 'records from file:', this.selectedFile.name);

    // Gửi file (FormData) thay vì JSON array vì backend chỉ accept multipart
    this.studentService.importStudentsFromFile(this.selectedFile).subscribe({
      next: (result) => {
        console.log('=== Import Response (Preview Mode) ===');
        console.log('Full response:', result);
        console.log('Response keys:', Object.keys(result));

        // Parse response - backend format: { totalRows, processed, successes, failed, skipped, results }
        const successes = result.successes || 0;
        const failed = result.failed || 0;
        const skipped = result.skipped || 0;
        const totalRows = result.totalRows || 0;

        console.log('Parsed - successes:', successes, 'failed:', failed, 'skipped:', skipped, 'totalRows:', totalRows);

        let successMessage = '';
        if (successes > 0) {
          successMessage += `Import thành công ${successes} học sinh`;
        }
        if (skipped > 0) {
          successMessage += (successMessage ? ', ' : '') + `bỏ qua ${skipped} dòng`;
        }
        if (failed > 0) {
          successMessage += (successMessage ? ', ' : '') + `thất bại ${failed} dòng`;
        }

        if (successMessage) {
          this.message.success(successMessage);
        } else {
          this.message.info('Import complete: ' + JSON.stringify(result));
        }

        // Show error details if any
        if (result.results && Array.isArray(result.results)) {
          const failedResults = result.results.filter((r: any) => r.status !== 'SUCCESS');
          if (failedResults.length > 0) {
            console.error('Failed imports:', failedResults);
            failedResults.forEach((r: any) => {
              console.log(`Row ${r.rowNumber}: ${r.status} - ${r.message}`);
            });
          }
        }

        this.modal.close({
          success: true,
          successCount: successes,
          errorCount: failed,
          skippedCount: skipped,
          response: result
        });
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Import preview error:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          errorBody: error.error
        });

        this.message.error('Lỗi import dữ liệu: ' + (error.error?.message || error.message || 'Unknown error'));
        this.isProcessing = false;
        this.isImporting = false;
        this.step = 2; // Quay lại step preview để user có thể thử lại
      }
    });
  }

  importDirectly(): void {
    // Ngăn gọi import nhiều lần
    if (this.isImporting) {
      console.log('Import is already in progress');
      return;
    }

    if (!this.selectedFile) {
      this.message.error('Chưa chọn file');
      return;
    }

    this.isImporting = true;
    this.isProcessing = true;
    this.step = 3;

    console.log('Starting direct import of file:', this.selectedFile.name);

    // Gọi API import với file upload trực tiếp
    this.studentService.importStudentsFromFile(this.selectedFile).subscribe({
      next: (result) => {
        console.log('=== Import Response ===');
        console.log('Full response:', result);
        console.log('Response keys:', Object.keys(result));

        // Parse response - backend format: { totalRows, processed, successes, failed, skipped, results }
        const successes = result.successes || 0;
        const failed = result.failed || 0;
        const skipped = result.skipped || 0;
        const totalRows = result.totalRows || 0;

        console.log('Parsed - successes:', successes, 'failed:', failed, 'skipped:', skipped, 'totalRows:', totalRows);

        let successMessage = '';
        if (successes > 0) {
          successMessage += `Import thành công ${successes} học sinh`;
        }
        if (skipped > 0) {
          successMessage += (successMessage ? ', ' : '') + `bỏ qua ${skipped} dòng`;
        }
        if (failed > 0) {
          successMessage += (successMessage ? ', ' : '') + `thất bại ${failed} dòng`;
        }

        if (successMessage) {
          this.message.success(successMessage);
        } else {
          this.message.info('Import complete: ' + JSON.stringify(result));
        }

        // Show error details if any
        if (result.results && Array.isArray(result.results)) {
          const failedResults = result.results.filter((r: any) => r.status !== 'SUCCESS');
          if (failedResults.length > 0) {
            console.error('Failed imports:', failedResults);
            failedResults.forEach((r: any) => {
              console.log(`Row ${r.rowNumber}: ${r.status} - ${r.message}`);
            });
          }
        }

        this.modal.close({
          success: true,
          successCount: successes,
          errorCount: failed,
          skippedCount: skipped,
          response: result
        });
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Import file error details:', error);
        console.error('Error response:', error.error);
        console.error('Error status:', error.status);

        // Nếu gặp lỗi multipart, tự động fallback sang JSON mode
        if (error.error?.message && error.error.message.includes('multipart')) {
          this.message.warning('Chế độ upload file không khả dụng, chuyển sang chế độ xem trước...');
          console.log('Falling back to preview mode');
          this.isProcessing = false;
          this.isImporting = false;
          this.step = 1;
          this.importMode = 'preview';
          this.message.info('Vui lòng chọn file lại với chế độ "Xem trước dữ liệu"');
        } else {
          this.message.error('Lỗi import file: ' + (error.error?.message || error.message || 'Unknown error'));
          this.isProcessing = false;
          this.isImporting = false;
          this.step = 1; // Quay lại step chọn file
        }
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
