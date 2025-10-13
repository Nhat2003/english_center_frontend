// Test Schedule Service APIs
// Run this in browser console after login

// Test Fixed Schedules
fetch('/api/schedules/fixed', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Fixed Schedules:', data);
})
.catch(error => {
  console.error('Fixed Schedules Error:', error);
});

// Test Rooms
fetch('/api/schedules/rooms', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Rooms:', data);
})
.catch(error => {
  console.error('Rooms Error:', error);
});

// Test Generate Schedule for Class 1
const params = new URLSearchParams({
  startDate: '2025-10-13',
  endDate: '2025-10-20',
  daysOfWeek: '1,3,5',
  startTime: '18:00:00',
  endTime: '20:00:00',
  teacherId: '1',
  roomId: '1'
});

fetch('/api/schedules/generate/1?' + params.toString(), {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Generated Schedule:', data);
})
.catch(error => {
  console.error('Generated Schedule Error:', error);
});
