
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
  dayOfWeek: number;
  timeRange: string;
}

export interface PlaySignUp {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  slotKey: string;
  date: string; // YYYY-MM-DD
  signedUpAt: any;
}


import type { ReactNode } from 'react';

export interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean; // New property for admin status
  bookings: Booking[];
  playSignUps: PlaySignUp[];
  login: (email: string, pass: string) => Promise<void>;
  signUp: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  addBooking: (newBooking: Omit<Booking, 'id' | 'userId' | 'userName'>) => Promise<string>;
  cancelBooking: (bookingId: string) => Promise<void>;
  signUpForPlaySlot: (slotKey: string, date: string, userDetails: { userId: string, userName: string, userEmail: string }) => Promise<void>;
  cancelPlaySlotSignUp: (signUpId: string) => Promise<void>;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}
