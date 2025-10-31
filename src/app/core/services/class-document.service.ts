import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClassDocument } from '../models/class-document.model';

@Injectable({
  providedIn: 'root'
})
export class ClassDocumentService {
  private apiUrl = `${environment.apiUrl}/class-documents`;

  constructor(private http: HttpClient) {}

  /**
   * Upload tài liệu cho một lớp học
   * @param classId ID của lớp học
   * @param file File cần upload
   * @returns Observable<ClassDocument>
   */
  uploadDocument(classId: number, file: File): Observable<ClassDocument> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ClassDocument>(`${this.apiUrl}/upload/${classId}`, formData);
  }

  /**
   * Lấy danh sách tài liệu theo lớp học
   * @param classId ID của lớp học
   * @returns Observable<ClassDocument[]>
   */
  getDocumentsByClassId(classId: number): Observable<ClassDocument[]> {
    return this.http.get<ClassDocument[]>(`${this.apiUrl}/class/${classId}`);
  }

  /**
   * Xóa tài liệu
   * @param id ID của tài liệu
   * @returns Observable<void>
   */
  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cập nhật tài liệu (upload file mới thay thế)
   * @param id ID của tài liệu
   * @param file File mới
   * @returns Observable<ClassDocument>
   */
  updateDocument(id: number, file: File): Observable<ClassDocument> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.put<ClassDocument>(`${this.apiUrl}/${id}`, formData);
  }

  /**
   * Download tài liệu
   * @param id ID của tài liệu
   * @returns Observable<Blob>
   */
  downloadDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${id}`, {
      responseType: 'blob'
    });
  }

  /**
   * Format kích thước file
   * @param bytes Kích thước file tính bằng bytes
   * @returns Chuỗi kích thước file đã format (VD: "2.5 MB")
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Lấy icon cho file dựa trên extension
   * @param fileName Tên file
   * @returns Tên icon Ant Design
   */
  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'file-pdf';
      case 'doc':
      case 'docx':
        return 'file-word';
      case 'xls':
      case 'xlsx':
        return 'file-excel';
      case 'ppt':
      case 'pptx':
        return 'file-ppt';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'file-image';
      case 'zip':
      case 'rar':
        return 'file-zip';
      case 'txt':
        return 'file-text';
      default:
        return 'file';
    }
  }
}
