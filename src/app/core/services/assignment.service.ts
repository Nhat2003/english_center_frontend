import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Assignment,
  StudentAssignment,
  AssignmentSubmission,
  AssignmentDetailResponse,
  SubmitAssignmentResponse
} from '../models/assignment.model';

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
  originalFilename?: string;  // Tên file gốc khi upload
  content?: string;            // Nội dung text của submission
  grade: number | null;
  feedback: string | null;
}

// Response từ GET /submissions/me
export interface MySubmissionResponse {
  id: number;
  assignmentId: number;
  assignmentTitle: string;  // API đã trả về assignmentTitle
  studentId: number;
  submittedAt: string;
  fileUrl: string | null;
  grade: number | null;
  feedback: string | null;
  content: string | null;
  originalFilename: string | null;
}

// Response từ GET /submissions/me/history - Có thêm assignmentTitle
export interface SubmissionHistoryResponse {
  id: number;
  assignmentId: number;
  assignmentTitle: string;  // Tên bài tập
  studentId: number;
  submittedAt: string;
  fileUrl: string | null;
  grade: number | null;
  feedback: string | null;
  content: string | null;
  originalFilename: string | null;
}

// Response từ GET /submissions/student/{studentId}/history?gradedOnly=true
export interface GroupedSubmissionHistory {
  assignmentId: number;
  assignmentTitle: string;
  submissions: SubmissionHistoryResponse[];
  latestGrade: number | null;
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
  originalFilename?: string;
  dueDate: string;
  classRoom: ClassRoom;
  teacher: Teacher;
  submissions: Submission[];
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
    return this.http.post<Assignment>(this.apiUrl, assignment);
  }

  // Tạo bài tập mới với file (FormData)
  createAssignmentWithFile(formData: FormData): Observable<Assignment> {
    // Don't set Content-Type header, browser will set it automatically with boundary for FormData
    return this.http.post<Assignment>(this.apiUrl, formData);
  }

  // Cập nhật bài tập
  updateAssignment(id: number, formData: FormData): Observable<Assignment> {
    return this.http.put<Assignment>(`${this.apiUrl}/${id}`, formData);
  }

  // Xóa bài tập
  deleteAssignment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ========== STUDENT METHODS ==========

  /**
   * Nộp bài tập cho assignment
   * POST /submissions/assignment/{assignmentId}
   * @param assignmentId - ID của bài tập
   * @param studentId - ID của học sinh
   * @param file - File bài làm (tùy chọn)
   * @param content - Nội dung bài làm (text, tùy chọn)
   * @returns Observable<Submission>
   */
  submitAssignment(assignmentId: number, studentId: number, file?: File, content?: string): Observable<Submission> {
    const formData = new FormData();
    formData.append('studentId', studentId.toString());

    if (file) {
      formData.append('file', file, file.name);
    }

    if (content) {
      formData.append('content', content);
    }

    return this.http.post<Submission>(`${environment.apiUrl}/submissions/assignment/${assignmentId}`, formData);
  }

  /**
   * Upload file submission (Legacy endpoint)
   * POST /submissions/upload
   * @param file - File to upload
   * @param params - Additional parameters
   * @returns Observable<any>
   */
  uploadSubmission(file: File, params?: { [key: string]: string }): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    // Append additional parameters if provided
    if (params) {
      Object.keys(params).forEach(key => {
        formData.append(key, params[key]);
      });
    }

    console.log('📤 Uploading submission (legacy):', { fileName: file.name, params });
    return this.http.post(`${environment.apiUrl}/submissions/upload`, formData);
  }

  /**
   * Lấy danh sách assignments của student (tất cả lớp)
   * GET /assignments/me
   * @returns Observable<StudentAssignment[]> với computed fields
   */
  getMyAssignments(): Observable<StudentAssignment[]> {
    return this.http.get<Assignment[]>(`${this.apiUrl}/me`).pipe(
      map(assignments => {
        const mapped = this.mapToStudentAssignments(assignments);
        return mapped;
      })
    );
  }

  /**
   * Lấy danh sách assignments của student theo lớp
   * GET /assignments/class/{classId}
   * @param classRoomId - ID của lớp học
   * @returns Observable<StudentAssignment[]>
   */
  getStudentAssignments(classRoomId: number): Observable<StudentAssignment[]> {
    return this.http.get<Assignment[]>(`${this.apiUrl}/class/${classRoomId}`).pipe(
      map(assignments => this.mapToStudentAssignments(assignments))
    );
  }

  /**
   * Map API assignments to StudentAssignment với computed fields
   * @param assignments - Assignments từ API
   * @returns StudentAssignment[] với UI fields
   */
  private mapToStudentAssignments(assignments: Assignment[]): StudentAssignment[] {
    // Get current student ID from localStorage
    let currentStudentId = 0;
    const userStr = localStorage.getItem('user');

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        currentStudentId = user?.id || user?.student?.id || user?.studentId || 0;
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }

    return assignments.map(assignment => {
      // Find my submission
      const mySubmission = assignment.submissions?.find(s => s.studentId === currentStudentId);

      // Extract filename from fileUrl
      let fileName: string | undefined;
      if (assignment.fileUrl) {
        const parts = assignment.fileUrl.split('/');
        fileName = parts[parts.length - 1];
      }

      // Extract submitted filename from submittedFileUrl
      let submittedFileName: string | undefined;
      if (mySubmission?.fileUrl) {
        const parts = mySubmission.fileUrl.split('/');
        submittedFileName = parts[parts.length - 1];
      }

      return {
        ...assignment,
        // Computed UI fields
        submitted: !!mySubmission,
        submittedAt: mySubmission?.submittedAt,
        submittedFileUrl: mySubmission?.fileUrl,
        submittedFileName,
        submittedContent: mySubmission?.content,
        grade: mySubmission?.grade,
        feedback: mySubmission?.feedback,
        hasFile: !!assignment.fileUrl,
        fileName,
        allowLateSubmission: true,
        mySubmission
      } as StudentAssignment;
    });
  }

  /**
   * Lấy submission của học sinh cho một assignment
   * @param assignmentId - ID của bài tập
   * @param studentId - ID của học sinh
   * @returns Observable<Submission | null>
   */
  getStudentSubmission(assignmentId: number, studentId: number): Observable<Submission | null> {
    return this.http.get<Submission | null>(
      `${environment.apiUrl}/submissions/assignment/${assignmentId}/student/${studentId}`
    );
  }

  /**
   * Lấy submission của học sinh hiện tại cho một assignment (endpoint an toàn)
   * GET /submissions/assignment/{assignmentId}/me
   * @param assignmentId - ID của bài tập
   * @returns Observable<MySubmissionResponse | null> - Submission của học sinh hoặc null nếu chưa nộp
   */
  getMySubmissionForAssignment(assignmentId: number): Observable<MySubmissionResponse | null> {
    return this.http.get<MySubmissionResponse | null>(
      `${environment.apiUrl}/submissions/assignment/${assignmentId}/me`
    );
  }

  /**
   * Lấy tất cả submissions của học sinh
   * @param studentId - ID của học sinh
   * @returns Observable<Submission[]>
   */
  getSubmissionsByStudent(studentId: number): Observable<Submission[]> {
    return this.http.get<Submission[]>(`${environment.apiUrl}/submissions/student/${studentId}`);
  }

  /**
   * Lấy tất cả submissions của học sinh hiện tại (đã chấm điểm)
   * GET /submissions/me
   * @returns Observable<MySubmissionResponse[]> - Danh sách submissions đã được chấm điểm
   */
  getMySubmissions(): Observable<MySubmissionResponse[]> {
    return this.http.get<MySubmissionResponse[]>(`${environment.apiUrl}/submissions/me`);
  }

  /**
   * Lấy lịch sử nộp bài của học sinh hiện tại (kèm assignmentTitle)
   * GET /submissions/me/history
   * @returns Observable<SubmissionHistoryResponse[]> - Danh sách submissions kèm tên bài tập
   */
  getMySubmissionHistory(): Observable<SubmissionHistoryResponse[]> {
    return this.http.get<SubmissionHistoryResponse[]>(`${environment.apiUrl}/submissions/me/history`);
  }

  /**
   * Lấy lịch sử nộp bài của một học sinh cụ thể (kèm assignmentTitle) - Dành cho giáo viên
   * GET /submissions/student/{studentId}/history
   * @param studentId - ID của học sinh
   * @param gradedOnly - Chỉ lấy submissions đã chấm điểm (mặc định: false)
   * @returns Observable<SubmissionHistoryResponse[]> hoặc Observable<GroupedSubmissionHistory[]>
   */
  getStudentSubmissionHistory(studentId: number, gradedOnly: boolean = false): Observable<SubmissionHistoryResponse[] | GroupedSubmissionHistory[]> {
    const params: any = {};
    if (gradedOnly) {
      params.gradedOnly = 'true';
    }
    return this.http.get<SubmissionHistoryResponse[] | GroupedSubmissionHistory[]>(
      `${environment.apiUrl}/submissions/student/${studentId}/history`,
      { params }
    );
  }

  /**
   * Lấy lịch sử điểm của học sinh (chỉ bài đã chấm) - Dành cho giáo viên
   * GET /submissions/student/{studentId}/history?gradedOnly=true
   * @param studentId - ID của học sinh
   * @returns Observable<GroupedSubmissionHistory[]> - Danh sách submissions đã chấm điểm, nhóm theo bài tập
   */
  getStudentGradeHistory(studentId: number): Observable<GroupedSubmissionHistory[]> {
    return this.http.get<GroupedSubmissionHistory[]>(
      `${environment.apiUrl}/submissions/student/${studentId}/history`,
      { params: { gradedOnly: 'true' } }
    );
  }

  // ========== DOWNLOAD METHODS ==========

  /**
   * Tải xuống file bài tập (cho học sinh)
   * GET /assignments/{id}/download
   * Học sinh phải là member của class
   * @param assignmentId - ID của bài tập
   * @param originalFilename - Tên file gốc từ database (optional)
   */
  downloadAssignmentFile(assignmentId: number, originalFilename?: string): void {
    const url = `${this.apiUrl}/${assignmentId}/download`;
    const token = localStorage.getItem('token');
    const filename = originalFilename || `assignment_${assignmentId}`;

    fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Download failed');
      }
      return response.blob();
    })
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(err => {
      console.error('Download assignment failed:', err);
    });
  }

  /**
   * Lấy danh sách submissions cho một assignment (cho giáo viên)
   * GET /submissions/assignment/{assignmentId}
   * Giáo viên phải là teacher phụ trách assignment
   * @param assignmentId - ID của bài tập
   * @returns Observable<Submission[]>
   */
  getSubmissionsByAssignment(assignmentId: number): Observable<Submission[]> {
    return this.http.get<Submission[]>(`${environment.apiUrl}/submissions/assignment/${assignmentId}`);
  }

  /**
   * Tải xuống submission của học sinh (cho giáo viên)
   * GET /submissions/{submissionId}/download
   * Giáo viên phải là teacher phụ trách assignment
   * @param submissionId - ID của submission
   * @param originalFilename - Tên file gốc từ database (optional)
   */
  downloadSubmissionFile(submissionId: number, originalFilename?: string): void {
    const url = `${environment.apiUrl}/submissions/${submissionId}/download`;
    const token = localStorage.getItem('token');
    const filename = originalFilename || `submission_${submissionId}`;

    fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Download failed');
      }
      return response.blob();
    })
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(err => {
      console.error('Download submission failed:', err);
    });
  }
}
