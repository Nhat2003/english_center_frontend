export interface Course {
  id: number;
  name: string;
  description?: string;
  duration: number; // Thời gian khóa học (tuần)
  fee: number; // Học phí
  level?: string; // Trình độ (Beginner, Intermediate, Advanced)
  createdAt?: string;
  updatedAt?: string;
}
