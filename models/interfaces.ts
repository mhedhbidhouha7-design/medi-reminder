// models/interfaces.ts
export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  createdAt: Date;
  password: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  profileImageUrl: string;
}
