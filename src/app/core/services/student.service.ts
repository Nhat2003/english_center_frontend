
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Student } from '../models/student.model';
import { User } from '../models/user.model';

@Injectable({
	providedIn: 'root'
})
export class StudentService {
	private apiUrl = 'http://localhost:8080/students';

	constructor(private http: HttpClient) {}

	getStudents(page: number = 0, size: number = 10): Observable<Student[]> {
		const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
		return this.http.get<Student[]>(this.apiUrl, { params });
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

	deleteStudent(id: number): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/${id}`);
	}
}
