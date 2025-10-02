export interface StudentSchedule {
  id: number;
  className: string;
  courseName: string;
  teacherName: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string;
  endTime: string;
  room: string;
  date?: Date;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
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
  room: string;
  status: string;
  description?: string;
}
