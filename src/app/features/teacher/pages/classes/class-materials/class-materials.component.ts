import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ClassDocumentService } from '../../../../../core/services/class-document.service';
import { ClassDocument } from '../../../../../core/models/class-document.model';

@Component({
  selector: 'app-class-materials',
  templateUrl: './class-materials.component.html',
  styleUrls: ['./class-materials.component.css']
})
export class ClassMaterialsComponent implements OnInit {
  classId: number | null = null;
  documents: ClassDocument[] = [];
  loading = false;
  uploadModalVisible = false;
  selectedFile: File | null = null;
  uploading = false;

  constructor(
    private route: ActivatedRoute,
    private message: NzMessageService,
    private modal: NzModalService,
    private classDocumentService: ClassDocumentService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.classId = +params['id'];
      if (this.classId) {
        this.loadDocuments();
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

  openUploadModal(): void {
    this.uploadModalVisible = true;
    this.selectedFile = null;
  }

  closeUploadModal(): void {
    this.uploadModalVisible = false;
    this.selectedFile = null;
  }

  handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  uploadDocument(): void {
    if (!this.selectedFile || !this.classId) {
      this.message.warning('Vui lòng chọn file để upload');
      return;
    }

    this.uploading = true;
    this.classDocumentService.uploadDocument(this.classId, this.selectedFile).subscribe({
      next: (document) => {
        this.message.success('Upload tài liệu thành công');
        this.uploading = false;
        this.closeUploadModal();
        this.loadDocuments();
      },
      error: (err) => {
        console.error('Upload failed:', err);
        this.uploading = false;

        if (err.status === 403) {
          this.message.error('Bạn không có quyền upload tài liệu');
        } else if (err.status === 400) {
          this.message.error('File không hợp lệ hoặc quá lớn');
        } else if (err.status === 500) {
          this.message.error('Lỗi server khi upload file');
        } else {
          this.message.error('Upload tài liệu thất bại');
        }
      }
    });
  }

  deleteDocument(doc: ClassDocument): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa tài liệu "${doc.fileName}"?`,
      nzOkText: 'Xóa',
      nzOkType: 'danger',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.classDocumentService.deleteDocument(doc.id).subscribe({
          next: () => {
            this.message.success('Xóa tài liệu thành công');
            this.loadDocuments();
          },
          error: (err) => {
            console.error('Delete failed:', err);
            this.message.error('Xóa tài liệu thất bại');
          }
        });
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
          this.message.error('Không tìm thấy file. Vui lòng kiểm tra backend đã có endpoint /class-documents/{id}/download');
        } else if (err.status === 0) {
          // CORS or network error - fallback to direct URL
          this.message.warning('Endpoint download chưa sẵn sàng');
          console.warn('Backend cần implement: GET /class-documents/{id}/download');
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
