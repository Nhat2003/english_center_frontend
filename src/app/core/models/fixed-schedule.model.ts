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

// DTO for student schedule response
export interface ScheduleItemForStudentDTO {
  id: string;
  title: string;
  start: string;     // ISO datetime string with timezone
  end: string;       // ISO datetime string with timezone
  date: string;      // yyyy-MM-dd format
  classId: number;
  teacherId: number;
  teacherName: string;
  roomId: number;
  className: string;
  courseName: string;
  roomName: string;
  sessionIndex: number;
  totalSessions: number;
  fixedSchedule: {
    name: string;
    daysOfWeek: string;
    startTime: string;
    endTime: string;
  };
  description?: string;
}

// DTO for teacher schedule response
export interface ScheduleItemForTeacherDTO {
  id: string;
  title: string;
  start: string;     // ISO datetime string with timezone
  end: string;       // ISO datetime string with timezone
  date: string;      // yyyy-MM-dd format
  classId: number;
  roomId: number;
  className: string;
  courseName: string;
  roomName: string;
  sessionIndex: number;
  totalSessions: number;
  fixedSchedule: {
    name: string;
    daysOfWeek: string;
    startTime: string;
    endTime: string;
  };
  students: {
    id: number;
    fullName: string;
  }[];
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
  1: 'MONDAY',    // Thứ 2
  2: 'TUESDAY',   // Thứ 3
  3: 'WEDNESDAY', // Thứ 4
  4: 'THURSDAY',  // Thứ 5
  5: 'FRIDAY',    // Thứ 6
  6: 'SATURDAY',  // Thứ 7
  7: 'SUNDAY'     // Chủ nhật
};

export const DAY_NAMES_VI = {
  '2': 'T2', '3': 'T3', '4': 'T4', '5': 'T5',
  '6': 'T6', '7': 'T7', '8': 'CN'
};

// Convert JavaScript day (0=Sunday, 1=Monday...) to our day mapping (1=Monday, 2=Tuesday...)
export function getOurDayNumber(jsDay: number): number {
  // JS: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // Our: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  if (jsDay === 0) return 7; // Sunday
  return jsDay; // Monday-Saturday (1-6)
}

// Convert our day mapping to JavaScript day
export function getJSDayNumber(ourDay: number): number {
  // Our: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  // JS: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  if (ourDay === 7) return 0; // Sunday
  return ourDay; // Monday-Saturday (1-6)
}

export function formatDaysOfWeekDisplay(daysOfWeek: string | null): string {
  if (!daysOfWeek) return 'Không xác định';
  const days = daysOfWeek.split(',').map(day => DAY_NAMES_VI[day.trim()] || day);
  return days.join(', ');
}

export function formatTimeRange(startTime: string | null, endTime: string | null): string {
  if (!startTime || !endTime) return 'Chưa xác định';
  return `${startTime} - ${endTime}`;
}

// Helper functions for student schedule display
export function formatSessionInfo(sessionIndex: number, totalSessions: number): string {
  return `Buổi ${sessionIndex}/${totalSessions}`;
}

export function formatScheduleTime(start: string, end: string): string {
  try {
    const startTime = new Date(start).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const endTime = new Date(end).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${startTime} - ${endTime}`;
  } catch (error) {
    return 'Invalid time';
  }
}

export function formatScheduleDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}

export function getScheduleStatus(sessionIndex: number, totalSessions: number): {
  status: 'upcoming' | 'in-progress' | 'completed';
  percentage: number;
} {
  const percentage = (sessionIndex / totalSessions) * 100;

  if (sessionIndex === 0) {
    return { status: 'upcoming', percentage: 0 };
  } else if (sessionIndex >= totalSessions) {
    return { status: 'completed', percentage: 100 };
  } else {
    return { status: 'in-progress', percentage };
  }
}
