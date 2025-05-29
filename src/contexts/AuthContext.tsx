
"use client";

import type { User, Booking } from '@/lib/types';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useState, useEffect } from 'react';

export interface AuthContextType {
  currentUser: User | null;
  bookings: Booking[];
  login: (email: string, name: string) => void;
  logout: () => void;
  addBooking: (newBooking: Booking) => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate loading user and bookings from storage
    const storedUser = localStorage.getItem('currentUser');
    const storedBookings = localStorage.getItem('bookings');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    if (storedBookings) {
      setBookings(JSON.parse(storedBookings));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    }
  }, [currentUser, isLoading]);

  useEffect(() => {
    if (!isLoading) {
        localStorage.setItem('bookings', JSON.stringify(bookings));
    }
  }, [bookings, isLoading]);


  const login = (email: string, name: string) => {
    // Mock login
    const user: User = { id: Date.now().toString(), email, name };
    setCurrentUser(user);
    router.push('/');
  };

  const logout = () => {
    setCurrentUser(null);
    router.push('/login');
  };

  const addBooking = (newBooking: Booking) => {
    setBookings(prevBookings => [...prevBookings, newBooking]);
  };

  return (
    <AuthContext.Provider value={{ currentUser, bookings, login, logout, addBooking, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
