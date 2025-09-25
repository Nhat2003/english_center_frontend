export interface Schedule {
  id: number;
  name: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  dayOfWeek?: string;
  createdAt?: string;
  updatedAt?: string;
}
