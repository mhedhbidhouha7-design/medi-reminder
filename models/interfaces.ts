// models/interfaces.ts
// Contient les définitions des objets utilisés dans l'application
// Chaque interface décrit la structure d'un objet
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
  active: true
}
//DosageSchedule = represente une prise de medicament (heure+dose)
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
  timestamp?: number; // Unix timestamp for sorting
  done: boolean;
  doneAt?: string;
  createdAt?: string;
  status?: "planned" | "done" | "missed";
  type?: string; // e.g. "general", "specialist"
}

export interface Proche {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt?: string;
}

export interface MedicationHistoryEntry {
  id: string;
  userId: string;
  medicationId: string;
  medicationName: string;
  scheduleIndex: number;
  dose: string;
  scheduledTime: string;
  takenAt: string; // ISO string
  date: string; // YYYY-MM-DD
}

export interface AppointmentHistoryEntry extends Appointment {
  completedAt: string; // ISO string
}
// models/interfaces.ts
export interface HealthJournalEntry {
  id?: string; // id automatique Firebase
  date: Date; // yyyy-mm-dd
  mood: string; // humeur du jour
  bloodSugar?: number; // glycémie
  bloodPressure?: string; // tension (ex: "120/80")
  weight?: number; // poid (kg)
  height?: number; // hauteur (cm)
  illness?: string; // current maladie
  symptoms?: string; // symptomes
  notes?: string; // notes personnelles
  createdAt: string; // timestamp
}

export interface Demande {
  id?: string;
  type: 'appointment' | 'follow-up';
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientEmail: string | null;
  patientName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any; // Firebase serverTimestamp
}

export interface Doctor {
  id: string;
  firstName?: string;
  lastName: string;
  specialty: string;
  hospital: string;
  phone: string;
  email?: string;
  role: string;
  uid: string;
  licenseNumber?: string;
  rating?: number | string;
  bio?: string;
}
