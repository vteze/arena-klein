
"use client";

import type { User, Booking, AuthContextType, AuthProviderProps } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
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
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  doc, 
  setDoc, 
  serverTimestamp, 
  deleteDoc,
  runTransaction 
} from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setCurrentUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Usuário",
        });
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    // Listener for all bookings (needed for AvailabilityCalendar and conflict checking)
    const bookingsCol = collection(db, "bookings");
    const q = query(bookingsCol); 
    
    const unsubscribeBookings = onSnapshot(q, (querySnapshot) => {
      const allBookings: Booking[] = [];
      querySnapshot.forEach((doc) => {
        allBookings.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setBookings(allBookings);
    }, (error) => {
      console.error("Error fetching all bookings (check Firestore rules for 'list' on 'bookings' collection): ", error);
      toast({ variant: "destructive", title: "Erro ao buscar dados de reservas", description: "Não foi possível carregar os dados de todas as reservas. Verifique as regras do Firestore e os logs do console." });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeBookings();
    };
  }, []); // Removed toast from dependencies as it should be stable


  const clearAuthError = () => setAuthError(null);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/');
    } catch (error: any) {
      console.error("Login error:", error);
      const message = getFirebaseErrorMessage(error.code);
      setAuthError(message);
      toast({ variant: "destructive", title: "Falha no Login", description: message });
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
        
        // Create user document in Firestore
        const userDocRef = doc(db, "users", userCredential.user.uid);
        await setDoc(userDocRef, {
          uid: userCredential.user.uid,
          name: name,
          email: email,
          createdAt: serverTimestamp(),
        });

        setCurrentUser({ 
          id: userCredential.user.uid,
          email: userCredential.user.email || "",
          name: name,
        });
      }
      router.push('/');
    } catch (error: any) {
      console.error("Sign up error:", error);
      const message = getFirebaseErrorMessage(error.code);
      setAuthError(message);
      toast({ variant: "destructive", title: "Falha no Cadastro", description: message });
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
      router.push('/login');
    } catch (error: any) {
      console.error("Logout error:", error);
      const message = getFirebaseErrorMessage(error.code);
      setAuthError(message);
      toast({ variant: "destructive", title: "Falha ao Sair", description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const addBooking = async (newBookingData: Omit<Booking, 'id' | 'userId' | 'userName'>): Promise<string> => {
    if (!currentUser) {
      const errMsg = "Você precisa estar logado para fazer uma reserva.";
      setAuthError(errMsg);
      toast({ variant: "destructive", title: "Não Autenticado", description: errMsg });
      router.push('/login');
      return Promise.reject(new Error(errMsg));
    }

    let generatedBookingId = '';

    try {
      await runTransaction(db, async (transaction) => {
        const bookingsRef = collection(db, "bookings");
        // This query needs a composite index on courtId, date, and time.
        const conflictQuery = query(
          bookingsRef,
          where("courtId", "==", newBookingData.courtId),
          where("date", "==", newBookingData.date),
          where("time", "==", newBookingData.time)
        );

        console.log("Attempting to get conflict snapshot with query. Ensure Firestore index exists for courtId, date, time on bookings collection.");
        const conflictSnapshot = await transaction.get(conflictQuery);
        console.log("Conflict snapshot empty:", conflictSnapshot.empty);

        if (!conflictSnapshot.empty) {
          throw new Error("Este horário já foi reservado. Por favor, escolha outro.");
        }

        const newBookingDocRef = doc(collection(db, "bookings")); 
        generatedBookingId = newBookingDocRef.id;

        const bookingToSave: Booking = {
          id: generatedBookingId, 
          userId: currentUser.id,
          userName: currentUser.name,
          courtId: newBookingData.courtId,
          courtName: newBookingData.courtName,
          courtType: newBookingData.courtType,
          date: newBookingData.date,
          time: newBookingData.time,
          // Consider adding a createdAt timestamp here as well
          // createdAt: serverTimestamp(), 
        };
        transaction.set(newBookingDocRef, bookingToSave);
      });
      return generatedBookingId; 
    } catch (error: any) {
      console.error("Error adding booking (transaction or pre-transaction): ", error);
      // Check if the error message from Firestore suggests a missing index.
      // Firestore often provides a direct link in the console error to create it.
      if (error.message && (error.message.toLowerCase().includes("index") || error.message.includes("FIRESTORE_INDEX_NEARBY") || error.code === 'failed-precondition')) {
         toast({ 
           variant: "destructive", 
           title: "Erro de Configuração do Banco", 
           description: "Um índice necessário no Firestore está faltando para a consulta de reserva. Verifique o console do navegador/servidor para um link para criá-lo ou crie-o manualmente (campos: courtId, date, time na coleção bookings)." ,
           duration: 10000
          });
      } else if (error.message === "Este horário já foi reservado. Por favor, escolha outro.") {
         toast({ variant: "destructive", title: "Horário Indisponível", description: error.message });
      } else {
        toast({ variant: "destructive", title: "Falha na Reserva", description: "Não foi possível processar sua reserva. Tente novamente."})
      }
      throw error; // Re-throw para que o BookingConfirmationDialog possa tratar também
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Não Autenticado", description: "Você precisa estar logado para cancelar uma reserva."});
      router.push('/login');
      return Promise.reject(new Error("Usuário não autenticado"));
    }
    try {
      const bookingDocRef = doc(db, "bookings", bookingId);
      await deleteDoc(bookingDocRef);
      // Toast for successful cancellation will be handled in BookingCancellationDialog
    } catch (error: any) {
      console.error("Error cancelling booking: ", error);
      toast({ variant: "destructive", title: "Erro ao Cancelar", description: error.message || "Não foi possível cancelar sua reserva." });
      throw error; // Re-throw para que o dialog possa tratar
    }
  };

  useEffect(() => {
    const protectedRoutes = ['/my-bookings']; 
    // Redirect to login if not authenticated and trying to access a protected route
    if (!isLoading && !currentUser && protectedRoutes.includes(pathname)) {
      router.push('/login');
    }
  }, [currentUser, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ currentUser, bookings, login, signUp, logout, addBooking, cancelBooking, isLoading, authError, clearAuthError }}>
      {children}
    </AuthContext.Provider>
  );
}

// Helper function to provide user-friendly error messages
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
    case "auth/invalid-credential": // Common for wrong email/password combo
       return "Credenciais inválidas. Verifique seu email e senha.";
    default:
      return "Ocorreu um erro de autenticação. Tente novamente.";
  }
}
