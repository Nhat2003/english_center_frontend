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
}
