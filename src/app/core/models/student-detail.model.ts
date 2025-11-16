export interface StudentDetail {
  student: {
    id: number;
    userId: number;
    fullName: string;
    dob: string;
    gender: string;
    phone: string;
    address: string;
    joinedAt: string;
    email: string;
    className: string;
  };
  attendance: StudentAttendanceRecord[];
  submissions: StudentSubmission[];
  attendanceSummary: {
    absent: number;
    late: number;
    present: number;
  };
}

export interface StudentAttendanceRecord {
  id: number;
  sessionDate: string;
  classId: number;
  className: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
  note: string;
}

export interface StudentSubmission {
  id: number;
  assignmentId: number | null;
  studentId: number;
  submittedAt: string;
  fileUrl: string;
  grade: number;
  feedback: string;
}
