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
    '2': 'T2', '3': 'T3', '4': 'T4', '5': 'T5',
    '6': 'T6', '7': 'T7', '8': 'CN'
  };

  const days = daysOfWeek ? daysOfWeek.split(',').map(d => dayNames[d.trim()] || d).join(', ') : '';
  const time = startTime && endTime ? `${startTime} - ${endTime}` : '';

  return `${name} (${days}) ${time}`;
}

export function formatClassDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return 'Chưa xác định';
  return `${startDate} đến ${endDate}`;
}
