export interface Student {
	id: number;
	userId: number;
	fullName: string;
	email: string;
	dob: string;
	gender: string;
	phone: string;
	address: string;
	joinedAt: string;
	className: string;
}

// Student Overview Response for Dashboard
export interface StudentOverviewResponse {
	// Basic Info
	studentId: number;
	fullName: string;
	email: string;

	// Classes
	classesCount: number;

	// Attendance
	attendancePresent: number;
	attendanceAbsent: number;
	attendanceLate: number;
	attendanceTotal: number;
	attendanceRate: number;

	// Assignments
	assignmentsTotal: number;
	assignmentsSubmitted: number;
	assignmentsPending: number;
	assignmentsGraded: number;
	averageGrade: number | null;

	// Today
	todaySessionsCount: number;

	// Notifications
	unreadNotifications: number;
}
