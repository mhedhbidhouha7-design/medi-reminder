import { Appointment } from "@/models/interfaces";

/**
 * Combine a date string (YYYY-MM-DD or DD/MM/YYYY) and a time string (HH:MM or HHhMM)
 * into a single unified Unix timestamp (milliseconds).
 */
export const combineDateAndTime = (dateStr: string, timeStr: string): number => {
  let normalizedDate = dateStr;
  if (normalizedDate.includes("/")) {
    const parts = normalizedDate.split("/");
    if (parts.length === 3) {
      normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  let normalizedTime = timeStr.trim();
  if (normalizedTime.includes("h")) {
    normalizedTime = normalizedTime.replace("h", ":");
  }

  if (normalizedTime.length === 4 && normalizedTime.includes(":")) {
    normalizedTime = `0${normalizedTime}`; // e.g., "9:30" to "09:30"
  }

  const dateTimeStr = `${normalizedDate}T${normalizedTime}:00`;
  return new Date(dateTimeStr).getTime();
};

/**
 * Validates if the given timestamp is in the future.
 */
export const validateDateTime = (timestamp: number): boolean => {
  const now = Date.now();
  return timestamp > now;
};

/**
 * Checks if the given timestamp is functionally in the past.
 */
export const isPastDate = (timestamp: number): boolean => {
  return !validateDateTime(timestamp);
};

/**
 * Sorts an array of appointments by their combined date+time timestamp.
 */
export const sortAppointmentsByDate = (
  appointments: Appointment[],
  order: "asc" | "desc"
): Appointment[] => {
  return [...appointments].sort((a, b) => {
    // If appointment has a saved timestamp, use it. Otherwise compute it dynamically.
    const timeA = a.timestamp || combineDateAndTime(a.date, a.time);
    const timeB = b.timestamp || combineDateAndTime(b.date, b.time);

    return order === "asc" ? timeA - timeB : timeB - timeA;
  });
};

/**
 * Separates appointments strictly by current time into "To Do" (future) and "History" (past).
 */
export const separateHistoryAndTodo = (
  appointments: Appointment[],
  historyAppointments: Appointment[] = [] // Optional second collection (like the separated history table)
) => {
  const now = Date.now();

  const todoItems = appointments.filter((a) => {
    if (a.done) return false;
    const t = a.timestamp || combineDateAndTime(a.date, a.time);
    return t >= now;
  });

  const historyItemsActive = appointments.filter((a) => {
    if (a.done) return true;
    const t = a.timestamp || combineDateAndTime(a.date, a.time);
    return t < now;
  });

  const allHistory = [...historyItemsActive, ...historyAppointments];

  // Return them properly sorted.
  // To Do: closest events first (ascending)
  // History: most recent events first (descending)
  return {
    todo: sortAppointmentsByDate(todoItems, "asc"),
    history: sortAppointmentsByDate(allHistory, "desc"),
  };
};
