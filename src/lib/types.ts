
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Court {
  id: string;
  name: string;
  type: 'covered' | 'uncovered';
  imageUrl: string;
  description: string;
  dataAiHint: string;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  courtId: string;
  courtName: string;
  courtType: 'covered' | 'uncovered';
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export interface TimeSlot {
  time: string; // HH:mm
  isBooked: boolean;
  isPlayTime?: boolean;
}

export interface PlaySlotConfig {
  key: string;
  label: string;
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  timeRange: string; // e.g., "16:00 - 20:00"
}

export interface PlaySignUp {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  slotKey: string; // Corresponds to PlaySlotConfig.key
  date: string; // YYYY-MM-DD, specific date of the play session
  signedUpAt: any; // Firestore Timestamp
}


import type { ReactNode } from 'react';

export interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  bookings: Booking[];
  playSignUps: PlaySignUp[];
  totalUsers: number; // Added for total user count
  login: (email: string, pass: string) => Promise<void>;
  signUp: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  addBooking: (newBooking: Omit<Booking, 'id' | 'userId' | 'userName'>) => Promise<string>;
  cancelBooking: (bookingId: string) => Promise<void>;
  updateBookingByAdmin: (bookingId: string, newDate: string, newTime: string) => Promise<void>;
  signUpForPlaySlot: (slotKey: string, date: string, userDetails: { userId: string, userName: string, userEmail: string }) => Promise<void>;
  cancelPlaySlotSignUp: (signUpId: string) => Promise<void>;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}
