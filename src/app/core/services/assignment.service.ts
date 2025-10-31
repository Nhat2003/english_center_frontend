import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Student {
  id: number;
  email: string;
  fullName: string;
  className?: string;
  dob?: string;
  gender?: string;
  phone?: string;
  address?: string;
  joinedAt?: string;
}

export interface Submission {
  id: number;
  student: Student;
  submittedAt: string;
  fileUrl: string;
  grade: number | null;
  feedback: string | null;
}

export interface Teacher {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  speciality?: string;
}

export interface ClassRoom {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  students?: Student[];
}

export interface AssignmentDetail {
  id: number;
  title: string;
  description: string;
  fileUrl?: string;
  dueDate: string;
  classRoom: ClassRoom;
  teacher: Teacher;
  submissions: Submission[];
}

export interface Assignment {
  id: number;
  title: string;
  description?: string;
  classRoomId: number;
  classCode?: string;
  assignedDate: string;
  dueDate: string;
  status: 'active' | 'closed';
  completedCount?: number;
  totalStudents?: number;
  createdAt?: string;
  updatedAt?: string;
  checked?: boolean; // For UI selection
}

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private apiUrl = `${environment.apiUrl}/assignments`;

  constructor(private http: HttpClient) {}

  // Lấy danh sách bài tập theo lớp
  getAssignmentsByClass(classRoomId: number): Observable<Assignment[]> {
    return this.http.get<Assignment[]>(`${this.apiUrl}/class/${classRoomId}`);
  }

  // Lấy chi tiết bài tập
  getAssignmentDetail(id: number): Observable<AssignmentDetail> {
    return this.http.get<AssignmentDetail>(`${this.apiUrl}/${id}`);
  }

  // Lấy chi tiết bài tập (legacy)
  getAssignment(id: number): Observable<Assignment> {
    return this.http.get<Assignment>(`${this.apiUrl}/${id}`);
  }

  // Chấm điểm submission
  gradeSubmission(submissionId: number, data: { grade: number; feedback?: string }): Observable<Submission> {
    return this.http.put<Submission>(`${environment.apiUrl}/submissions/${submissionId}/grade`, data);
  }

  // Tạo bài tập mới
  createAssignment(assignment: any): Observable<Assignment> {
    console.log('📡 AssignmentService.createAssignment called with:', assignment);
    return this.http.post<Assignment>(this.apiUrl, assignment);
  }

  // Tạo bài tập mới với file (FormData)
  createAssignmentWithFile(formData: FormData): Observable<Assignment> {
    console.log('📡 AssignmentService.createAssignmentWithFile called');
    // Don't set Content-Type header, browser will set it automatically with boundary for FormData
    return this.http.post<Assignment>(this.apiUrl, formData);
  }

  // Cập nhật bài tập
  updateAssignment(id: number, formData: FormData): Observable<Assignment> {
    console.log('📡 AssignmentService.updateAssignment called for ID:', id);
    return this.http.put<Assignment>(`${this.apiUrl}/${id}`, formData);
  }

  // Xóa bài tập
  deleteAssignment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Student nộp bài tập
  submitAssignment(assignmentId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${environment.apiUrl}/submissions/assignment/${assignmentId}`, formData);
  }

  // Lấy danh sách assignments của student
  getStudentAssignments(classRoomId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/class/${classRoomId}/student`);
  }
}
