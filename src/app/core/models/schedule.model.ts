export interface ScheduleDetail {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface Schedule {
  id: number;
  name: string;
  description?: string;
  details: ScheduleDetail[];
  createdAt?: string;
  updatedAt?: string;

  // Computed properties for backward compatibility
  startTime?: string;
  endTime?: string;
  dayOfWeek?: string;
}
