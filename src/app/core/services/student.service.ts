
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Student, StudentOverviewResponse } from '../models/student.model';
import { User } from '../models/user.model';
import { StudentDetail } from '../models/student-detail.model';
import { environment } from '../../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class StudentService {
				// Tìm kiếm học sinh (admin)
				searchStudents(q: string, page: number = 0, size: number = 10): Observable<any> {
					let params = new HttpParams()
						.set('q', q)
						.set('page', page.toString())
						.set('size', size.toString());
					return this.http.get<any>(`${environment.apiUrl}/students/search`, { params })
						.pipe(catchError(this.handleError));
				}
			// Lấy danh sách học sinh cho admin (chuẩn backend mới)
			getAdminStudentList(page: number = 0, size: number = 10, searchText: string = ''): Observable<any> {
				let params = new HttpParams()
					.set('page', page.toString())
					.set('size', size.toString());
				if (searchText && searchText.trim()) {
					params = params.set('search', searchText.trim());
				}
				return this.http.get<any>(`${environment.apiUrl}/students/admin/list`, { params })
					.pipe(catchError(this.handleError));
			}
		// Lấy danh sách học sinh có tìm kiếm (nếu backend hỗ trợ search param)
		getStudentsWithSearch(page: number = 0, size: number = 10, searchText: string = ''): Observable<any> {
			let params = new HttpParams()
				.set('page', page.toString())
				.set('size', size.toString());
			if (searchText && searchText.trim()) {
				params = params.set('search', searchText.trim());
			}
			return this.http.get<any>(this.apiUrl, { params })
				.pipe(catchError(this.handleError));
		}
	private apiUrl = `${environment.apiUrl}/students`;

	constructor(private http: HttpClient) {}

	getStudents(page: number = 0, size: number = 10): Observable<any> {
		const params = new HttpParams()
			.set('page', page.toString())
			.set('size', size.toString());

		return this.http.get<any>(this.apiUrl, { params })
			.pipe(
				catchError(this.handleError)
			);
	}

	private handleError(error: HttpErrorResponse) {
		console.error('Student API Error:', error);
		console.error('Error status:', error.status);
		console.error('Error message:', error.message);
		console.error('Error body:', error.error);

		if (error.status === 401) {
			console.error('Unauthorized - Token may be expired');
		} else if (error.status === 400) {
			console.error('Bad Request - Check parameters or request format');
		} else if (error.status === 403) {
			console.error('Forbidden - Insufficient permissions');
		} else if (error.status === 404) {
			console.error('Not Found - API endpoint may not exist');
		}

		return throwError(() => error);
	}

	getStudent(id: number): Observable<Student> {
		return this.http.get<Student>(`${this.apiUrl}/${id}`);
	}

	// Lấy danh sách users có thể tạo thành student (chưa có student profile)
	getAvailableUsersForStudent(): Observable<User[]> {
		return this.http.get<User[]>(`${this.apiUrl}/available-users`);
	}

	createStudent(student: Student): Observable<Student> {
		return this.http.post<Student>(this.apiUrl, student);
	}

	updateStudent(id: number, student: Student): Observable<Student> {
		return this.http.put<Student>(`${this.apiUrl}/${id}`, student);
	}

	// Import students from Excel data
	importStudents(students: any[]): Observable<{successCount: number, errors: string[]}> {
		return this.http.post<{successCount: number, errors: string[]}>(`${this.apiUrl}/import`, students)
			.pipe(
				catchError(this.handleError)
			);
	}

	deleteStudent(id: number): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/${id}`);
	}

	// Get student detail with attendance and submissions
	getStudentDetail(id: number): Observable<StudentDetail> {
		return this.http.get<StudentDetail>(`${this.apiUrl}/${id}/detail`)
			.pipe(
				catchError(this.handleError)
			);
	}

	// Lấy tất cả students cho dropdown (không phân trang)
	getAllStudents(): Observable<Student[]> {
		return this.http.get<Student[]>(`${this.apiUrl}/all`)
			.pipe(
				catchError(this.handleError)
			);
	}

	// Lấy danh sách lớp học của học sinh
	getClassesByStudent(studentId: number): Observable<any[]> {
		return this.http.get<any[]>(`${environment.apiUrl}/class-rooms/by-student/${studentId}`)
			.pipe(
				catchError(this.handleError)
			);
	}

	/**
	 * Get current student profile
	 * API: GET /students/me/profile
	 */
	getMyProfile(): Observable<Student> {
		return this.http.get<Student>(`${this.apiUrl}/me/profile`)
			.pipe(
				catchError(this.handleError)
			);
	}

	/**
	 * Update current student profile
	 * API: PUT /students/me/profile
	 * @param profileData - Student profile data to update
	 */
	updateMyProfile(profileData: Partial<Student>): Observable<Student> {
		return this.http.put<Student>(`${this.apiUrl}/me/profile`, profileData)
			.pipe(
				catchError(this.handleError)
			);
	}

	/**
	 * Change password for current student
	 * API: PUT /students/me/change-password
	 */
	changePassword(passwordData: { currentPassword: string; newPassword: string; confirmPassword: string }): Observable<any> {
		return this.http.put(`${this.apiUrl}/me/change-password`, passwordData)
			.pipe(catchError(this.handleError));
	}
}
