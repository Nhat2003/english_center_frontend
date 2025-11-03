export interface Announcement {
  id: number;
  classId: number;
  teacherId: number;
  message: string;
  createdAt: string;
}

export interface CreateAnnouncementRequest {
  message: string;
}
