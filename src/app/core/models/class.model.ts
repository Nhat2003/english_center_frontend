export interface Class {
  id: number;
  name: string;
  courseName: string;
  courseDescription?: string; // Course description from Course entity
  teacherName: string;
  roomName: string;
  fixedSchedule: {
    name: string;
    daysOfWeek: string;
    startTime: string;
    endTime: string;
  };
  startDate: string;
  endDate: string;
  studentCount: number;
  students: number[];

  // Legacy properties for backward compatibility
  description?: string;
  teacherId?: number;
  courseId?: number;
  studentIds?: number[];
  scheduleId?: number;
  schedule?: number;
  scheduleName?: string;
  scheduleDescription?: string;
  maxStudents?: number;
  status?: 'active' | 'inactive' | 'completed';
  createdAt?: string;
  updatedAt?: string;
}

import { Student } from './student.model';
import { Schedule } from './schedule.model';

// Helper functions for class display
export function formatClassScheduleDisplay(fixedSchedule: any): string {
  if (!fixedSchedule) return 'Chưa xác định';

  const { name, daysOfWeek, startTime, endTime } = fixedSchedule;
  const dayNames = {
    '1': 'T2', '2': 'T3', '3': 'T4', '4': 'T5',
    '5': 'T6', '6': 'T7', '7': 'CN'
  };

  const days = daysOfWeek ? daysOfWeek.split(',').map(d => dayNames[d] || d).join(', ') : '';
  const time = startTime && endTime ? `${startTime} - ${endTime}` : '';

  return `${name} (${days}) ${time}`;
}

export function formatClassDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return 'Chưa xác định';
  return `${startDate} đến ${endDate}`;
}
