# Student Schedule API Configuration

## API Endpoints

The student schedule service **ONLY** calls real backend APIs. No mock data fallback.

### Base URL
- Development: `http://localhost:8080/student-schedules`
- Configure in `src/environments/environment.ts`

### Endpoints Used

#### 1. Get Weekly Schedule
```http
GET /student-schedules/weekly?studentId={id}&weekStart={date}
```

**Parameters:**
- `studentId`: ID của học sinh (required)
- `weekStart`: Ngày bắt đầu tuần (ISO string, optional)

**Expected Response:**
```json
[
  {
    "id": 1,
    "className": "English A1",
    "courseName": "Basic English",
    "teacherName": "Nguyễn Văn A",
    "dayOfWeek": "MONDAY",
    "startTime": "08:00",
    "endTime": "10:00",
    "room": "Room 101",
    "status": "SCHEDULED",
    "description": "Lớp học cơ bản"
  }
]
```

#### 2. Get Today Schedule
```http
GET /student-schedules/today?studentId={id}
```

**Response:** Array of StudentSchedule với date = hôm nay

#### 3. Get Upcoming Schedule
```http
GET /student-schedules/upcoming?studentId={id}&days={number}
```

**Parameters:**
- `studentId`: ID của học sinh
- `days`: Số ngày tiếp theo (default: 7)

#### 4. Get Monthly Schedule
```http
GET /student-schedules/monthly?studentId={id}&month={date}
```

**Parameters:**
- `studentId`: ID của học sinh
- `month`: Tháng cần lấy (ISO string)

## Data Models

### StudentSchedule Interface
```typescript
interface StudentSchedule {
  id: number;
  className: string;
  courseName: string;
  teacherName: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string; // "HH:mm" format
  endTime: string;   // "HH:mm" format
  room: string;
  date?: Date;       // For specific date schedules
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  description?: string;
}
```

## Error Handling

### API Success:
```
API Call → Success → Display real data
Console: "Weekly schedule loaded from API: [data]"
```

### API Failure:
```
API Call → Fail → Show error message → Display empty state
Console: "Failed to load weekly schedule from API: [error]"
UI Error: "Không thể tải lịch học tuần từ server"
```

## No Fallback Mechanism

**Important:** This service does NOT fallback to mock data. If API fails:
- Error messages are displayed to user
- Empty data arrays are shown
- Console logs detail the API error
- User must fix backend connection to see data

## Backend Requirements

Your Spring Boot backend **MUST** be running and provide:

### Required Endpoints:
- `GET /student-schedules/weekly`
- `GET /student-schedules/today`
- `GET /student-schedules/upcoming`
- `GET /student-schedules/monthly`

### Response Format:
- Always return array of StudentSchedule objects
- Use exact field names as shown in interface
- Time format: "HH:mm" (24-hour)
- Date format: ISO string when needed

## Testing

### With Backend:
1. **REQUIRED:** Start Spring Boot backend on `http://localhost:8080`
2. Start Angular: `ng serve`
3. Login as student and navigate to schedule
4. Should load real data from API

### Without Backend:
1. Start only Angular: `ng serve`
2. Login as student and navigate to schedule
3. **Will show errors and empty data**
4. Check console for API error details

## Debug Information

- Check browser console for API call logs
- Look for "loaded from API" (success) or "Failed to load" (error)
- Network tab shows actual HTTP requests/responses
- All schedule views (today/week/calendar) require working API
