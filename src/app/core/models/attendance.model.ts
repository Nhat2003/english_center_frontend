export interface Attendance {
  id?: number;
  sessionDate: string;
  classRoom?: {
    id: number;
    name: string;
  };
  student: {
    id: number;
    name?: string;
    email?: string;
  };
  status: AttendanceStatus;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE'
}

export interface AttendanceItemDto {
  studentId: number;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceSessionDto {
  classId: number;
  sessionDate: string; // ISO date format: YYYY-MM-DD
  items: AttendanceItemDto[];
}

export interface AttendanceSessionResponse {
  attendance: Attendance[];
  summary: {
    present: number;
    absent: number;
    late: number;
  };
}

export interface StudentAttendanceRow {
  studentId: number;
  studentName: string;
  studentEmail: string;
  status: AttendanceStatus;
  note?: string;
}
