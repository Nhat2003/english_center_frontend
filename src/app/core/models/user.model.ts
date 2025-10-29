export interface Student {
  id: number;
  userId: number;
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  address: string;
  joinedAt: string;
  email: string;
  className: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  fullName?: string;
  password?: string | null;
  root: boolean;
  status: string;
  role: string;
  isActive: boolean;
  student?: Student;
}
