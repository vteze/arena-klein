
"use client";

import type { User, Booking } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

export interface AuthContextType {
  currentUser: User | null;
  bookings: Booking[];
  login: (email: string, pass: string) => Promise<void>;
  signUp: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  addBooking: (newBooking: Omit<Booking, 'id' | 'userId' | 'userName'>) => Promise<void>;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setCurrentUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Usuário",
        });
      } else {
        setCurrentUser(null);
        setBookings([]); // Clear bookings on logout
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && !isLoading) {
      const bookingsCol = collection(db, "bookings");
      const q = query(bookingsCol, where("userId", "==", currentUser.id));
      
      const unsubscribeBookings = onSnapshot(q, (querySnapshot) => {
        const userBookings: Booking[] = [];
        querySnapshot.forEach((doc) => {
          userBookings.push({ id: doc.id, ...doc.data() } as Booking);
        });
        setBookings(userBookings);
      }, (error) => {
        console.error("Error fetching bookings: ", error);
        toast({ variant: "destructive", title: "Erro ao buscar reservas", description: "Não foi possível carregar suas reservas." });
      });

      return () => unsubscribeBookings();
    } else if (!currentUser && !isLoading) {
      setBookings([]); // Clear bookings if no user
    }
  }, [currentUser, isLoading, toast]);

  const clearAuthError = () => setAuthError(null);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/');
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError(getFirebaseErrorMessage(error.code));
      toast({ variant: "destructive", title: "Falha no Login", description: getFirebaseErrorMessage(error.code) });
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        
        // Create a user document in Firestore
        const userDocRef = doc(db, "users", userCredential.user.uid);
        await setDoc(userDocRef, {
          uid: userCredential.user.uid, // Storing uid also in the document for easier queries if needed
          name: name,
          email: email,
          createdAt: serverTimestamp(), // Records the time the user was created
        });

        setCurrentUser({ // Manually update context state as onAuthStateChanged might be slightly delayed
          id: userCredential.user.uid,
          email: userCredential.user.email || "",
          name: name,
        });
      }
      router.push('/');
    } catch (error: any)      {
      console.error("Sign up error:", error);
      setAuthError(getFirebaseErrorMessage(error.code));
      toast({ variant: "destructive", title: "Falha no Cadastro", description: getFirebaseErrorMessage(error.code) });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await signOut(auth);
      setCurrentUser(null);
      setBookings([]);
      router.push('/login');
    } catch (error: any) {
      console.error("Logout error:", error);
      setAuthError(getFirebaseErrorMessage(error.code));
      toast({ variant: "destructive", title: "Falha ao Sair", description: getFirebaseErrorMessage(error.code) });
    } finally {
      setIsLoading(false);
    }
  };

  const addBooking = async (newBookingData: Omit<Booking, 'id' | 'userId' | 'userName'>) => {
    if (!currentUser) {
      setAuthError("Você precisa estar logado para fazer uma reserva.");
      toast({ variant: "destructive", title: "Não Autenticado", description: "Você precisa estar logado para fazer uma reserva."});
      router.push('/login');
      return;
    }
    try {
      const bookingWithUser: Omit<Booking, 'id'> = {
        ...newBookingData,
        userId: currentUser.id,
        userName: currentUser.name,
      };
      await addDoc(collection(db, "bookings"), bookingWithUser);
      // Snapshot listener will update the bookings state automatically
    } catch (error) {
      console.error("Error adding booking: ", error);
      toast({ variant: "destructive", title: "Erro na Reserva", description: "Não foi possível adicionar sua reserva." });
    }
  };

  useEffect(() => {
    // Redirect to login if not authenticated and trying to access protected routes
    const protectedRoutes = ['/my-bookings']; // Add other protected routes here
    if (!isLoading && !currentUser && protectedRoutes.includes(pathname)) {
      router.push('/login');
    }
  }, [currentUser, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ currentUser, bookings, login, signUp, logout, addBooking, isLoading, authError, clearAuthError }}>
      {children}
    </AuthContext.Provider>
  );
}


function getFirebaseErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case "auth/invalid-email":
      return "O formato do email é inválido.";
    case "auth/user-disabled":
      return "Este usuário foi desabilitado.";
    case "auth/user-not-found":
      return "Usuário não encontrado. Verifique o email ou cadastre-se.";
    case "auth/wrong-password":
      return "Senha incorreta.";
    case "auth/email-already-in-use":
      return "Este email já está em uso. Tente fazer login.";
    case "auth/weak-password":
      return "A senha é muito fraca. Use pelo menos 6 caracteres.";
    case "auth/operation-not-allowed":
      return "Operação não permitida. Contate o suporte.";
    case "auth/invalid-credential":
       return "Credenciais inválidas. Verifique seu email e senha.";
    default:
      return "Ocorreu um erro de autenticação. Tente novamente.";
  }
}

