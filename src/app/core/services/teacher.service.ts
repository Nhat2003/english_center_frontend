import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Teacher } from '../models/teacher.model';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TeacherService {
	private apiUrl = `${environment.apiUrl}/teachers`;

	constructor(private http: HttpClient) {}

	// Lấy danh sách users có thể tạo thành teacher (chưa có teacher profile)
	getAvailableUsersForTeacher(): Observable<User[]> {
		return this.http.get<User[]>(`${this.apiUrl}/available-users`);
	}

	createTeacher(teacher: Teacher): Observable<Teacher> {
		return this.http.post<Teacher>(this.apiUrl, teacher);
	}

		getTeachers(): Observable<Teacher[]> {
			return this.http.get<Teacher[]>(this.apiUrl);
		}

		getTeacher(id: number): Observable<Teacher> {
			return this.http.get<Teacher>(`${this.apiUrl}/${id}`);
		}

		updateTeacher(id: number, teacher: Teacher): Observable<Teacher> {
			return this.http.put<Teacher>(`${this.apiUrl}/${id}`, teacher);
		}

	deleteTeacher(id: number): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/${id}`);
	}

	// Lấy tất cả teachers cho dropdown (không phân trang)
	getAllTeachers(): Observable<Teacher[]> {
		return this.http.get<Teacher[]>(`${this.apiUrl}/all`);
	}

	// Lấy danh sách lớp của giáo viên
	getClassesByTeacher(teacherId: number): Observable<any[]> {
		return this.http.get<any[]>(`${environment.apiUrl}/class-rooms/by-teacher/${teacherId}`);
	}

	// Lấy danh sách học sinh của lớp
	getStudentsByClass(classRoomId: number): Observable<any[]> {
		return this.http.get<any[]>(`${environment.apiUrl}/class-students/${classRoomId}`);
	}

	/**
	 * Get current teacher profile
	 * API: GET /teachers/me/profile
	 */
	getMyProfile(): Observable<Teacher> {
		return this.http.get<Teacher>(`${this.apiUrl}/me/profile`);
	}

	/**
	 * Update current teacher profile
	 * API: PUT /teachers/me/profile
	 * @param profileData - Teacher profile data to update
	 */
	updateMyProfile(profileData: Partial<Teacher>): Observable<Teacher> {
		return this.http.put<Teacher>(`${this.apiUrl}/me/profile`, profileData);
	}
}
