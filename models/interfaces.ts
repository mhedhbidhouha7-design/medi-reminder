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

export interface DosageSchedule {
  time: string; // e.g., "08:00", "Morning", "Night"
  dose: string; // e.g., "2 pills", "1 spoonful"
}

export interface Medication {
  id: string; // Maps to Firebase key
  name: string;
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate: string;   // ISO date (YYYY-MM-DD)
  schedules: DosageSchedule[];
  takenLogs?: { [date: string]: { [index: number]: boolean } };
  createdAt: string;
}
