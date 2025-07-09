
export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
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
  userId: string; // UID of the user who made the booking (could be an admin)
  userName: string; // Name of the user who made the booking (could be an admin)
  onBehalfOf?: string; // Optional: Name of the person this booking is for, if admin booked it
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
  userPhotoURL?: string;
  slotKey: string; // Corresponds to PlaySlotConfig.key
  date: string; // YYYY-MM-DD, specific date of the play session
  signedUpAt: any; // Firestore Timestamp
}


import type { ReactNode } from 'react';
import type { personalizedBookingConfirmation, PersonalizedBookingConfirmationInput as AIInputType } from '@/ai/flows/booking-confirmation'; // Adjusted import

// Re-export AI types if they are defined in the AI flow file
export type PersonalizedBookingConfirmationInput = AIInputType;


export interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  bookings: Booking[];
  playSignUps: PlaySignUp[];
  totalUsers: number;
  login: (email: string, pass: string) => Promise<void>;
  signUp: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  addBooking: (newBookingData: Omit<Booking, 'id' | 'userId' | 'userName' | 'onBehalfOf'>, onBehalfOfName?: string) => Promise<string>;
  cancelBooking: (bookingId: string) => Promise<void>;
  updateBookingByAdmin: (bookingId: string, newDate: string, newTime: string, newOnBehalfOfName?: string) => Promise<void>;
  signUpForPlaySlot: (slotKey: string, date: string, userDetails: { userId: string; userName: string; userEmail: string; userPhotoURL?: string }) => Promise<void>;
  cancelPlaySlotSignUp: (signUpId: string) => Promise<void>;
  updateProfilePhoto: (file: File) => Promise<void>;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}

