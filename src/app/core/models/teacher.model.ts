export interface Teacher {
  id?: number;
  userId: number; // chỉ cần userId để gắn với User
  fullName: string;
  email: string;
  dob: string; // yyyy-MM-dd
  gender: string;
  phone: string;
  address: string;
  speciality: string;
  hiredAt: string; // yyyy-MM-dd
}
