
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

    const bookingsCol = collection(db, "bookings");
    const q = query(bookingsCol); 
    
    const unsubscribeBookings = onSnapshot(q, (querySnapshot) => {
      const allBookings: Booking[] = [];
      querySnapshot.forEach((doc) => {
        allBookings.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setBookings(allBookings);
    }, (error) => {
      console.error("Error fetching all bookings (check Firestore rules for 'list' on 'bookings' collection and ensure necessary indexes exist): ", error);
      toast({ variant: "destructive", title: "Erro ao buscar dados de reservas", description: "Não foi possível carregar os dados de todas as reservas. Verifique as regras e índices do Firestore, e os logs do console." });
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
    console.log("addBooking called with newBookingData:", JSON.stringify(newBookingData));

    if (!currentUser) {
      const errMsg = "Você precisa estar logado para fazer uma reserva.";
      setAuthError(errMsg);
      toast({ variant: "destructive", title: "Não Autenticado", description: errMsg });
      router.push('/login');
      return Promise.reject(new Error(errMsg));
    }

    // Defensive checks for required string fields
    const fieldsToValidate: (keyof typeof newBookingData)[] = ['courtId', 'date', 'time', 'courtName'];
    for (const field of fieldsToValidate) {
      const value = newBookingData[field as keyof Omit<Booking, 'id' | 'userId' | 'userName' | 'courtType'>]; // Type assertion
      if (!value || typeof value !== 'string' || value.trim() === '') {
        const msg = `Campo obrigatório '${String(field)}' está inválido ou ausente no objeto newBookingData. Valor: '${value}'`;
        console.error(msg, newBookingData);
        toast({ variant: "destructive", title: "Dados de Reserva Inválidos", description: msg });
        return Promise.reject(new Error(msg));
      }
    }
    if (!newBookingData.courtType || (newBookingData.courtType !== 'covered' && newBookingData.courtType !== 'uncovered')) {
        const msg = `Campo obrigatório 'courtType' está inválido ou ausente. Valor: '${newBookingData.courtType}'`;
        console.error(msg, newBookingData);
        toast({ variant: "destructive", title: "Dados de Reserva Inválidos", description: msg });
        return Promise.reject(new Error(msg));
    }


    let generatedBookingId = '';

    try {
      await runTransaction(db, async (transaction) => {
        const bookingsRef = collection(db, "bookings");
        
        const conflictQuery = query(
          bookingsRef,
          where("courtId", "==", String(newBookingData.courtId)),
          where("date", "==", String(newBookingData.date)),
          where("time", "==", String(newBookingData.time))
        );
        
        console.log(
            "Attempting to get conflict snapshot with query. Ensure Firestore index exists for courtId (ASC), date (ASC), time (ASC) on bookings collection.",
            "Query details:", { 
              courtId: String(newBookingData.courtId), 
              date: String(newBookingData.date), 
              time: String(newBookingData.time) 
            }
        );
        console.log("Conflict Query Object:", conflictQuery); 
        
        const conflictSnapshot = await transaction.get(conflictQuery);
        
        if (!conflictSnapshot.empty) {
          throw new Error("Este horário já foi reservado. Por favor, escolha outro.");
        }

        const newBookingDocRef = doc(collection(db, "bookings")); 
        generatedBookingId = newBookingDocRef.id;

        const bookingToSave: Booking = {
          id: generatedBookingId, 
          userId: currentUser.id,
          userName: currentUser.name,
          courtId: String(newBookingData.courtId),
          courtName: String(newBookingData.courtName), 
          courtType: newBookingData.courtType as 'covered' | 'uncovered', 
          date: String(newBookingData.date),
          time: String(newBookingData.time),
        };
        transaction.set(newBookingDocRef, bookingToSave);
      });
      return generatedBookingId; 
    } catch (error: any) {
      console.error(
        "Error adding booking (transaction or pre-transaction). Error Name:", error.name,
        "Error Code:", error.code, // Log code if available
        "Error Message:", error.message,
        "Full Error Object:", error
      );
      
      if (error.name === 'TypeError' && error.message && error.message.includes("Cannot read properties of undefined (reading 'path')")) {
        toast({
            variant: "destructive",
            title: "Falha Crítica na Reserva (Erro Interno Firestore)",
            description: `Ocorreu um erro interno (${error.message}) ao verificar a disponibilidade. Se o índice composto (courtId ASC, date ASC, time ASC) na coleção 'bookings' está 100% CORRETO e ATIVO, e os dados da reserva (verifique o console) parecem normais, este pode ser um problema mais complexo. Verifique os logs do console para 'newBookingData' e 'Conflict Query Object'.`,
            duration: 20000 
        });
      } else if (error.message && (error.message.toLowerCase().includes("index") || error.message.includes("FIRESTORE_INDEX_NEARBY") || (error.code === 'failed-precondition' && error.message.toLowerCase().includes("query requires an index")) )) {
         toast({ 
           variant: "destructive", 
           title: "Erro de Configuração do Banco (Índice Ausente)", 
           description: "Um índice necessário no Firestore está faltando para a consulta de reserva. Verifique o console do navegador/servidor para um link para criá-lo ou crie-o manualmente (campos: courtId ASC, date ASC, time ASC na coleção bookings)." ,
           duration: 15000 
          });
      } else if (error.message === "Este horário já foi reservado. Por favor, escolha outro.") {
         toast({ variant: "destructive", title: "Horário Indisponível", description: error.message });
      }
       else {
        toast({ 
            variant: "destructive", 
            title: "Falha na Reserva", 
            description: `Não foi possível processar sua reserva. Detalhe: ${error.message || 'Erro desconhecido.'}`,
            duration: 10000 
        });
      }
      throw error; 
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
    } catch (error: any) {
      console.error("Error cancelling booking: ", error);
      throw error; // Re-throw para que o BookingCancellationDialog possa tratar
    }
  };

  useEffect(() => {
    const protectedRoutes = ['/my-bookings']; 
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
    

    