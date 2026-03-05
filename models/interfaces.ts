// models/interfaces.ts
export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  createdAt: Date;
}
