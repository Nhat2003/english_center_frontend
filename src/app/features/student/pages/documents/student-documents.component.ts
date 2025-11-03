import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ClassDocumentService } from '../../../../core/services/class-document.service';
import { ClassDocument } from '../../../../core/models/class-document.model';

@Component({
  selector: 'app-student-documents',
  templateUrl: './student-documents.component.html',
  styleUrls: ['./student-documents.component.css']
})
export class StudentDocumentsComponent implements OnInit {
  documents: ClassDocument[] = [];
  loading = false;
  studentClassId: number | null = null;

  constructor(
    private message: NzMessageService,
    private classDocumentService: ClassDocumentService
  ) {}

  ngOnInit(): void {
    // Get student's class ID from localStorage user info
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Assuming user object has classRoomId or classId
        this.studentClassId = user.classRoomId || user.classId || null;

        if (this.studentClassId) {
          this.loadDocuments();
        } else {
          this.message.warning('Bạn chưa được phân lớp');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.message.error('Không thể lấy thông tin lớp học');
      }
    } else {
      this.message.warning('Vui lòng đăng nhập lại');
    }
  }

  loadDocuments(): void {
    if (!this.studentClassId) return;

    this.loading = true;
    this.classDocumentService.getDocumentsByClassId(this.studentClassId).subscribe({
      next: (data) => {
        this.documents = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load documents:', err);
        this.documents = [];
        this.loading = false;

        if (err.status === 403) {
          this.message.error('Bạn không có quyền truy cập tài liệu này');
        } else if (err.status === 404) {
          this.message.warning('Không tìm thấy tài liệu');
        } else {
          this.message.error('Không thể tải danh sách tài liệu');
        }
      }
    });
  }

  downloadDocument(doc: ClassDocument): void {
    this.message.loading('Đang tải xuống file...', { nzDuration: 0 });

    this.classDocumentService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        this.message.remove();

        // Tạo URL từ blob
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.message.success('Tải xuống thành công');
      },
      error: (err) => {
        this.message.remove();
        console.error('Download failed:', err);

        if (err.status === 403) {
          this.message.error('Bạn không có quyền tải xuống tài liệu này');
        } else if (err.status === 404) {
          this.message.error('Không tìm thấy file');
        } else {
          this.message.error('Không thể tải xuống tài liệu');
        }
      }
    });
  }

  getFileIcon(fileName: string): string {
    return this.classDocumentService.getFileIcon(fileName);
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '-';
    return this.classDocumentService.formatFileSize(bytes);
  }

  getFileType(doc: ClassDocument): string {
    if (doc.fileType) {
      return doc.fileType.toUpperCase();
    }
    // Extract from fileName
    const extension = doc.fileName.split('.').pop()?.toUpperCase();
    return extension || '-';
  }
}
