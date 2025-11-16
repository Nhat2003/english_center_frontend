// Interface cho response từ API /students/me/schedule
export interface StudentScheduleResponse {
  id: number;
  scheduleId: number;
  className: string;
  courseName: string | null;
  teacherName: string;
  schedules: ScheduleDetail[];
  room: string | null;
  status: string | null;
  description: string;
}

export interface ScheduleDetail {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string;
  endTime: string;
}

// Interface được sử dụng trong component (flatten data)
export interface StudentSchedule {
  id: number;
  scheduleId: number;
  className: string;
  courseName: string | null;
  teacherName: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string;
  endTime: string;
  room: string | null;
  date?: Date;
  status: string | null;
  description?: string;
}

export interface ScheduleWeekView {
  monday: StudentSchedule[];
  tuesday: StudentSchedule[];
  wednesday: StudentSchedule[];
  thursday: StudentSchedule[];
  friday: StudentSchedule[];
  saturday: StudentSchedule[];
  sunday: StudentSchedule[];
}

export interface ScheduleCalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  className: string;
  teacher: string;
  room: string | null;
  status: string | null;
  description?: string;
}
