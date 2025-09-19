import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Teacher } from '../models/teacher.model';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class TeacherService {
	private apiUrl = 'http://localhost:8080/teachers';

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

		deleteTeacher(id: number): Observable<void> {
			return this.http.delete<void>(`${this.apiUrl}/${id}`);
		}
}
