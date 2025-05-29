
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
}

// AuthContext types
import type { ReactNode } from 'react';

export interface AuthContextType {
  currentUser: User | null;
  bookings: Booking[];
  login: (email: string, pass: string) => Promise<void>;
  signUp: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  addBooking: (newBooking: Omit<Booking, 'id' | 'userId' | 'userName'>) => Promise<string>; // Returns booking ID
  cancelBooking: (bookingId: string) => Promise<void>;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}
