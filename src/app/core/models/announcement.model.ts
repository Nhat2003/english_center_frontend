export interface Announcement {
  id: number;
  classId: number;
  title: string;
  content: string;
  createdAt: string;
  createdByTeacherId: number;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
}
