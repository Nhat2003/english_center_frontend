import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Announcement, CreateAnnouncementRequest } from '../models/announcement.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Lấy danh sách thông báo của lớp
  getAnnouncementsByClass(classId: number): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(
      `${this.apiUrl}/classes/${classId}/announcements`,
      { headers: this.getHeaders() }
    );
  }

  // Tạo thông báo mới (teacherId lấy từ token)
  createAnnouncement(classId: number, request: CreateAnnouncementRequest): Observable<Announcement> {
    return this.http.post<Announcement>(
      `${this.apiUrl}/classes/${classId}/announcements`,
      request,
      { headers: this.getHeaders() }
    );
  }

  // Xóa thông báo
  deleteAnnouncement(classId: number, announcementId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/classes/${classId}/announcements/${announcementId}`,
      { headers: this.getHeaders() }
    );
  }
}
