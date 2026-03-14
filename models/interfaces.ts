// models/interfaces.ts
// Contient les définitions des objets utilisés dans l'application
// Chaque interface décrit la structure d'un objet (par exemple un médicament ou un profil utilisateur)
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
  endDate: string; // ISO date (YYYY-MM-DD)
  schedules: DosageSchedule[];
  takenLogs?: { [date: string]: { [index: number]: boolean } };
  createdAt: string;
}
export interface Appointment {
  id: string;
  title: string;
  doctor?: string;
  location?: string;
  notes?: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
  done: boolean;
  createdAt?: string;
}
