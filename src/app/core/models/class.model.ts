export interface Class {
  id: number;
  name: string;
  description?: string;
  teacherId: number;
  teacherName?: string;
  courseId: number;
  courseName?: string;
  studentIds: number[];
  students?: Student[];
  scheduleId: number;
  schedule?: number; // For backend compatibility - some endpoints may use 'schedule' instead of 'scheduleId'
  scheduleName?: string;
  scheduleDescription?: string;
  maxStudents?: number;
  status?: 'active' | 'inactive' | 'completed';
  createdAt?: string;
  updatedAt?: string;
}

import { Student } from './student.model';
import { Schedule } from './schedule.model';
