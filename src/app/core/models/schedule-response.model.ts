// Model cho response từ backend hiện tại
export interface ScheduleResponse {
  id: number;
  name: string; // "Thứ 2, 4, 6 - 18:00-20:00"
  description: string;
}

// Utility để parse name thành schedule details
export class ScheduleParser {
  static parseScheduleName(name: string): ParsedSchedule | null {
    // Parse "Thứ 2, 4, 6 - 18:00-20:00"
    const regex = /^(.*?)\s*-\s*(\d{2}:\d{2})-(\d{2}:\d{2})$/;
    const match = name.match(regex);

    if (!match) return null;

    const [, daysStr, startTime, endTime] = match;
    const days = this.parseDays(daysStr);

    return {
      days,
      startTime,
      endTime
    };
  }

  private static parseDays(daysStr: string): string[] {
    const dayMap: { [key: string]: string } = {
      'Thứ 2': 'MONDAY',
      'Thứ 3': 'TUESDAY',
      'Thứ 4': 'WEDNESDAY',
      'Thứ 5': 'THURSDAY',
      'Thứ 6': 'FRIDAY',
      'Thứ 7': 'SATURDAY',
      'Chủ nhật': 'SUNDAY'
    };

    return daysStr.split(',').map(day => {
      const trimmedDay = day.trim();
      return dayMap[trimmedDay] || trimmedDay;
    }).filter(Boolean);
  }
}

export interface ParsedSchedule {
  days: string[];
  startTime: string;
  endTime: string;
}
