
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
  onSnapshot, 
  doc, 
  setDoc, 
  serverTimestamp, 
  deleteDoc,
  getDocs // Adicionado para a nova lógica
  // runTransaction, // Removido
} from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_COLLECTION_NAME = "users";
const RESERVAS_COLLECTION_NAME = "reservas";

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

    const reservasColRef = collection(db, RESERVAS_COLLECTION_NAME); 
    const q = query(reservasColRef); 
    
    const unsubscribeBookings = onSnapshot(q, (querySnapshot) => {
      const allBookings: Booking[] = [];
      querySnapshot.forEach((doc) => {
        allBookings.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setBookings(allBookings);
    }, (error) => {
      console.error(`Erro ao buscar dados da coleção '${RESERVAS_COLLECTION_NAME}' (verifique regras e índices do Firestore): `, error);
      toast({ variant: "destructive", title: "Erro ao buscar dados de reservas", description: `Não foi possível carregar os dados de todas as reservas da coleção '${RESERVAS_COLLECTION_NAME}'. Verifique as regras e índices do Firestore, e os logs do console.` });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeBookings();
    };
  }, []);


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
        
        const userDocRef = doc(db, USERS_COLLECTION_NAME, userCredential.user.uid);
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
    } catch (error: any)
     {
      console.error("Logout error:", error);
      const message = getFirebaseErrorMessage(error.code);
      setAuthError(message);
      toast({ variant: "destructive", title: "Falha ao Sair", description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const addBooking = async (newBookingData: Omit<Booking, 'id' | 'userId' | 'userName'>): Promise<string> => {
    console.log(`addBooking (para coleção '${RESERVAS_COLLECTION_NAME}') chamada com newBookingData:`, JSON.stringify(newBookingData));

    if (!currentUser) {
      const errMsg = "Você precisa estar logado para fazer uma reserva.";
      setAuthError(errMsg);
      toast({ variant: "destructive", title: "Não Autenticado", description: errMsg });
      router.push('/login');
      return Promise.reject(new Error(errMsg));
    }

    const courtIdStr = String(newBookingData.courtId);
    const dateStr = String(newBookingData.date);
    const timeStr = String(newBookingData.time);
    const courtNameStr = String(newBookingData.courtName);
    const courtTypeStr = newBookingData.courtType;

    // Validações de entrada
    if (!courtIdStr || courtIdStr.trim() === '' || courtIdStr === 'undefined') {
        const msg = "Dados de Reserva Inválidos: courtId está ausente ou inválido.";
        console.error(msg, newBookingData);
        toast({ variant: "destructive", title: "Dados Inválidos", description: msg });
        return Promise.reject(new Error(msg));
    }
    if (!dateStr || dateStr.trim() === '' || dateStr === 'undefined' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const msg = "Dados de Reserva Inválidos: data está ausente, inválida ou não está no formato AAAA-MM-DD.";
        console.error(msg, newBookingData);
        toast({ variant: "destructive", title: "Dados Inválidos", description: msg });
        return Promise.reject(new Error(msg));
    }
    if (!timeStr || timeStr.trim() === '' || timeStr === 'undefined' || !/^\d{2}:\d{2}$/.test(timeStr)) {
        const msg = "Dados de Reserva Inválidos: hora está ausente, inválida ou não está no formato HH:MM.";
        console.error(msg, newBookingData);
        toast({ variant: "destructive", title: "Dados Inválidos", description: msg });
        return Promise.reject(new Error(msg));
    }
    if (!courtNameStr || courtNameStr.trim() === '' || courtNameStr === 'undefined') {
        const msg = "Dados de Reserva Inválidos: nome da quadra está ausente ou inválido.";
        console.error(msg, newBookingData);
        toast({ variant: "destructive", title: "Dados Inválidos", description: msg });
        return Promise.reject(new Error(msg));
    }
     if (!courtTypeStr || (courtTypeStr !== 'covered' && courtTypeStr !== 'uncovered')) {
        const msg = `Dados de Reserva Inválidos: courtType ('${courtTypeStr}') é inválido ou ausente. Deve ser 'covered' ou 'uncovered'.`;
        console.error(msg, newBookingData);
        toast({ variant: "destructive", title: "Dados Inválidos", description: msg });
        return Promise.reject(new Error(msg));
    }
    
    // Gera um ID para a nova reserva no cliente
    const newBookingDocRef = doc(collection(db, RESERVAS_COLLECTION_NAME));
    const generatedBookingId = newBookingDocRef.id;
    
    try {
      // Verificação de conflito NÃO TRANSACIONAL
      const reservasColRef = collection(db, RESERVAS_COLLECTION_NAME);
      const conflictQuery = query(
        reservasColRef,
        where("courtId", "==", courtIdStr),
        where("date", "==", dateStr),
        where("time", "==", timeStr)
      );

      console.log(
        `Realizando verificação de conflito (NÃO TRANSACIONAL) na coleção '${RESERVAS_COLLECTION_NAME}'. Critérios: courtId='${courtIdStr}', date='${dateStr}', time='${timeStr}'.`
      );
      console.log("Objeto da Query de Conflito (NÃO TRANSACIONAL):", conflictQuery);
      
      const conflictSnapshot = await getDocs(conflictQuery);
      
      if (!conflictSnapshot.empty) {
        console.warn(`Conflito de reserva detectado (NÃO TRANSACIONAL) na coleção '${RESERVAS_COLLECTION_NAME}':`, conflictSnapshot.docs.map(d => d.data()));
        throw new Error("Este horário já foi reservado. Por favor, escolha outro (verificação não transacional).");
      }

      // Nenhum conflito encontrado, prosseguir para salvar a reserva
      const bookingToSave: Booking = {
        id: generatedBookingId, 
        userId: currentUser.id,
        userName: currentUser.name,
        courtId: courtIdStr,
        courtName: courtNameStr, 
        courtType: courtTypeStr, 
        date: dateStr,
        time: timeStr,
      };
      console.log(`Nenhum conflito encontrado (NÃO TRANSACIONAL). Tentando salvar nova reserva na coleção '${RESERVAS_COLLECTION_NAME}':`, bookingToSave);
      
      await setDoc(newBookingDocRef, bookingToSave); // Salva o documento usando a referência com o ID gerado

      console.log(`Reserva (NÃO TRANSACIONAL) salva com sucesso na coleção '${RESERVAS_COLLECTION_NAME}'. ID da Reserva:`, generatedBookingId);
      return generatedBookingId;

    } catch (error: any) {
      console.error(
        `Erro ao adicionar reserva (verificação não transacional ou escrita) na coleção '${RESERVAS_COLLECTION_NAME}'. Nome do Erro: "${error.name}" "Código do Erro:" ${error.code} "Mensagem do Erro:" "${error.message}" "Objeto de Erro Completo:"`, error
      );
      
      if (error.message && (error.message.toLowerCase().includes("index") || error.message.includes("FIRESTORE_INDEX_NEARBY") || (error.code === 'failed-precondition' && error.message.toLowerCase().includes("query requires an index")) )) {
         toast({ 
           variant: "destructive", 
           title: "Erro de Configuração do Banco (ÍNDICE AUSENTE?)", 
           description: `Um índice necessário no Firestore para a coleção '${RESERVAS_COLLECTION_NAME}' está faltando ou incorreto. Verifique o console para um link para criá-lo ou crie-o manualmente (campos: courtId ASC, date ASC, time ASC na coleção '${RESERVAS_COLLECTION_NAME}' com escopo de 'Coleção'). Esta verificação é para a checagem de conflito.` ,
           duration: 15000 
          });
      } else if (error.message && error.message.includes("Este horário já foi reservado")) {
         toast({ variant: "destructive", title: "Horário Indisponível", description: error.message });
      } else {
        toast({ 
            variant: "destructive", 
            title: "Falha na Reserva", 
            description: `Não foi possível processar sua reserva. Detalhe: ${error.message || 'Erro desconhecido.'}`,
            duration: 10000 
        });
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
      const bookingDocRef = doc(db, RESERVAS_COLLECTION_NAME, bookingId);
      await deleteDoc(bookingDocRef);
    } catch (error: any) {
      console.error(`Erro ao cancelar reserva na coleção '${RESERVAS_COLLECTION_NAME}': `, error);
      throw error; 
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
    
