
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
  isBooked: boolean; // True if a regular booking exists for this court/time
  isPlayTime?: boolean; // True if this slot falls into a general "Play" session time
}

// Tipos para o sistema "Play"
export interface PlaySlotConfig {
  key: string; // ex: "sexta-16-20"
  label: string; // ex: "Sexta-Feira"
  dayOfWeek: number; // 0 (Dom) a 6 (Sab)
  timeRange: string; // ex: "16:00 - 20:00"
}

export interface PlaySignUp {
  id: string; // Firestore document ID
  userId: string;
  userName: string;
  userEmail: string; // Para exibição e contato, se necessário
  slotKey: string; // "sexta-16-20", "sabado-16-20", "domingo-16-20"
  date: string; // YYYY-MM-DD, data específica da sessão
  signedUpAt: any; // Idealmente Timestamp do Firestore, mas 'any' para simplicidade na definição inicial
}


// AuthContext types
import type { ReactNode } from 'react';

export interface AuthContextType {
  currentUser: User | null;
  bookings: Booking[];
  playSignUps: PlaySignUp[]; // Adicionado
  login: (email: string, pass: string) => Promise<void>;
  signUp: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  addBooking: (newBooking: Omit<Booking, 'id' | 'userId' | 'userName'>) => Promise<string>;
  cancelBooking: (bookingId: string) => Promise<void>;
  signUpForPlaySlot: (slotKey: string, date: string, userDetails: { userId: string, userName: string, userEmail: string }) => Promise<void>; // Adicionado
  cancelPlaySlotSignUp: (signUpId: string) => Promise<void>; // Adicionado
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}

