import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  classId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private message: NzMessageService,
    private classDocumentService: ClassDocumentService
  ) {}

  ngOnInit(): void {
    // Get classId from route parameter
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.classId = +id;
        this.loadDocuments();
      } else {
        this.message.warning('Không tìm thấy thông tin lớp học');
      }
    });
  }

  loadDocuments(): void {
    if (!this.classId) return;

    this.loading = true;
    this.classDocumentService.getDocumentsByClassId(this.classId).subscribe({
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

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName;

        document.body.appendChild(link);
        link.click();

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
