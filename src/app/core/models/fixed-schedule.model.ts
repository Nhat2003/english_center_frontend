export interface FixedSchedule {
  id?: number;
  name: string;
  daysOfWeek?: string | null; // "2,4,6" format or null
  startTime?: string | null;  // "HH:mm:ss" format or null
  endTime?: string | null;    // "HH:mm:ss" format or null
}

// Legacy interface for backward compatibility
export interface LegacyFixedSchedule {
  id?: number;
  name: string;
  description?: string;
  details: ScheduleDetail[];
}

export interface ScheduleDetail {
  dayOfWeek: string; // MONDAY, TUESDAY, etc.
  startTime: string; // HH:mm:ss format
  endTime: string;   // HH:mm:ss format
}

export interface ScheduleItemDTO {
  id: string;
  title: string;
  start: string;     // ISO datetime string
  end: string;       // ISO datetime string
  classId: number;
  teacherId?: number;
  roomId?: number;
}

export interface Room {
  id?: number;
  name: string;
  capacity?: number;
  description?: string;
  location?: string;
}

// DTO for Fixed Schedule form
export interface FixedScheduleDTO {
  id?: number;
  name: string;
  description?: string;
  details: ScheduleDetail[];
}

// Helper functions for day conversion
export const DAY_MAPPING = {
  1: 'MONDAY',
  2: 'TUESDAY', 
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
  7: 'SUNDAY'
};

export const DAY_NAMES_VI = {
  '1': 'T2', '2': 'T3', '3': 'T4', '4': 'T5',
  '5': 'T6', '6': 'T7', '7': 'CN'
};

export function formatDaysOfWeekDisplay(daysOfWeek: string | null): string {
  if (!daysOfWeek) return 'Không xác định';
  const days = daysOfWeek.split(',').map(day => DAY_NAMES_VI[day] || day);
  return days.join(', ');
}

export function formatTimeRange(startTime: string | null, endTime: string | null): string {
  if (!startTime || !endTime) return 'Chưa xác định';
  return `${startTime} - ${endTime}`;
}