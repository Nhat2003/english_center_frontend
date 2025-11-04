import { User } from './user.model';

// Room model
export interface Room {
  id: number;
  name: string;
  location: string;
}

// Fixed Schedule model
export interface FixedSchedule {
  id: number;
  name: string;
  daysOfWeek: string;
  startTime: string;
  endTime: string;
}

// Course model (simplified for assignment)
export interface Course {
  id: number;
  name: string;
  duration: number;
  fee: number;
}

// Student model (simplified for assignment)
export interface Student {
  id: number;
  email: string;
  fullName: string;
  className: string;
  dob: string;
  gender: string;
  phone: string;
  address: string;
  joinedAt: string;
}

// Teacher model (for assignment)
export interface Teacher {
  id: number;
  user: User;
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  address: string;
  speciality: string;
  hiredAt: string;
  email: string;
}

// ClassRoom model (for assignment)
export interface ClassRoom {
  id: number;
  name: string;
  course: Course;
  teacher: Teacher;
  room: Room;
  fixedSchedule: FixedSchedule;
  startDate: string;
  endDate: string;
  students: Student[];
}

// Submission model
export interface AssignmentSubmission {
  id: number;
  studentId: number;
  assignmentId: number;
  content?: string;
  fileUrl?: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  student?: Student;
}

// Main Assignment model (from API)
export interface Assignment {
  id: number;
  title: string;
  description: string;
  fileUrl?: string;
  dueDate: string;
  classRoom: ClassRoom;
  teacher: Teacher;
  submissions: AssignmentSubmission[];
  createdAt: string;
  classRoomId: number;
}

// Student Assignment View Model (computed fields for UI)
export interface StudentAssignment {
  // Original API fields
  id: number;
  title: string;
  description: string;
  fileUrl?: string;
  originalFilename?: string;
  dueDate: string;
  classRoom: ClassRoom;
  teacher: Teacher;
  submissions: AssignmentSubmission[];
  createdAt: string;
  classRoomId: number;

  // Computed UI fields
  submitted: boolean;
  submittedAt?: string;
  submittedFileUrl?: string;
  submittedFileName?: string;
  submittedContent?: string;
  grade?: number;
  feedback?: string;
  hasFile: boolean;
  fileName?: string;
  allowLateSubmission: boolean;
  mySubmission?: AssignmentSubmission;
}

// Assignment Detail Response
export interface AssignmentDetailResponse {
  assignment: Assignment;
  mySubmission?: AssignmentSubmission;
}

// Submit Assignment Request
export interface SubmitAssignmentRequest {
  assignmentId: number;
  studentId: number;
  content?: string;
  file?: File;
}

// Submit Assignment Response
export interface SubmitAssignmentResponse {
  success: boolean;
  message: string;
  submission?: AssignmentSubmission;
}
