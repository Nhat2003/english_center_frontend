import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Material {
  id: number;
  name: string;
  type: string; // pdf, doc, ppt, etc.
  size: string; // e.g., "2.5 MB"
  url: string;
  classRoomId: number;
  uploadedDate: string;
  uploadedBy?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MaterialService {
  private apiUrl = `${environment.apiUrl}/materials`;

  constructor(private http: HttpClient) {}

  // Lấy danh sách tài liệu theo lớp
  getMaterialsByClass(classRoomId: number): Observable<Material[]> {
    return this.http.get<Material[]>(`${this.apiUrl}/class/${classRoomId}`);
  }

  // Lấy chi tiết tài liệu
  getMaterial(id: number): Observable<Material> {
    return this.http.get<Material>(`${this.apiUrl}/${id}`);
  }

  // Upload tài liệu mới
  uploadMaterial(formData: FormData): Observable<Material> {
    return this.http.post<Material>(`${this.apiUrl}/upload`, formData);
  }

  // Xóa tài liệu
  deleteMaterial(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Download tài liệu
  downloadMaterial(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }
}
