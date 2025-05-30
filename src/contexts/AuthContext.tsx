
"use client";

import type { User, Booking, PlaySignUp, AuthContextType, AuthProviderProps } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { createContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
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
  addDoc,
  getDocs,
  getDoc,
  updateDoc, // Added for updateBookingByAdmin
  Timestamp,
} from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { maxParticipantsPerPlaySlot } from '@/config/appConfig';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_COLLECTION_NAME = "users";
const RESERVAS_COLLECTION_NAME = "reservas";
const PLAY_SIGNUPS_COLLECTION_NAME = "playSignUps";
const ADMINS_COLLECTION_NAME = "admins";

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [playSignUps, setPlaySignUps] = useState<PlaySignUp[]>([]); 
  const [isLoading, setIsLoading] = useState(true); 
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, USERS_COLLECTION_NAME, firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        let userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Usuário";
        if (userDocSnap.exists()) {
            userName = userDocSnap.data()?.name || userName;
        }

        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: userName,
        };
        setCurrentUser(user);

        try {
          const adminDocRef = doc(db, ADMINS_COLLECTION_NAME, firebaseUser.uid);
          const adminDocSnap = await getDoc(adminDocRef);
          if (adminDocSnap.exists()) {
            setIsAdmin(true);
            console.log(`User ${firebaseUser.uid} is an admin.`);
          } else {
            setIsAdmin(false);
            console.log(`User ${firebaseUser.uid} is NOT an admin.`);
          }
        } catch (error: any) {
          console.error("Error checking admin status:", error);
          toast({
            variant: "destructive",
            title: "Erro ao Verificar Admin",
            description: `Não foi possível verificar o status de administrador. Verifique as regras do Firestore e a conexão. Erro: ${error.message}`,
            duration: 7000,
          });
          setIsAdmin(false);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    const reservasColRef = collection(db, RESERVAS_COLLECTION_NAME);
    const qReservas = query(reservasColRef);
    const unsubscribeBookings = onSnapshot(qReservas, (querySnapshot) => {
      const allBookings: Booking[] = [];
      querySnapshot.forEach((doc) => {
        allBookings.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setBookings(allBookings);
    }, (error: any) => {
      console.error(`Erro ao buscar dados da coleção '${RESERVAS_COLLECTION_NAME}' (verifique regras e índices do Firestore): `, error);
      toast({ 
        variant: "destructive", 
        title: `Erro ao Buscar Reservas`,
        description: `Não foi possível carregar os dados de todas as reservas. Verifique suas Regras de Segurança e Índices do Firestore. Erro: ${error.message}`,
        duration: 10000
      });
    });

    const playSignUpsColRef = collection(db, PLAY_SIGNUPS_COLLECTION_NAME);
    const qPlaySignUps = query(playSignUpsColRef);
    const unsubscribePlaySignUps = onSnapshot(qPlaySignUps, (querySnapshot) => {
      const allSignUps: PlaySignUp[] = [];
      querySnapshot.forEach((doc) => {
        allSignUps.push({ id: doc.id, ...doc.data() } as PlaySignUp);
      });
      setPlaySignUps(allSignUps);
    }, (error) => {
      console.error(`Erro ao buscar dados da coleção '${PLAY_SIGNUPS_COLLECTION_NAME}': `, error);
      toast({ 
        variant: "destructive", 
        title: `Erro ao Buscar Inscrições do Play`,
        description: `Não foi possível carregar os dados das inscrições do Play. Verifique suas Regras de Segurança e Índices do Firestore. Erro: ${error.message}`,
        duration: 10000
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeBookings();
      unsubscribePlaySignUps();
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
      }
      router.push('/');
    } catch (error: any) {
      console.error("Sign up error:", error);
      const message = getFirebaseErrorMessage(error.code);
      setAuthError(message);
      toast({ variant: "destructive", title: "Falha no Cadastro", description: message });
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error: any) {
      console.error("Logout error:", error);
      const message = getFirebaseErrorMessage(error.code);
      setAuthError(message);
      toast({ variant: "destructive", title: "Falha ao Sair", description: message });
    }
  };
  
  const sendPasswordReset = async (emailAddress: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, emailAddress);
      toast({
        title: "Link de Redefinição Enviado",
        description: `Se uma conta existir para ${emailAddress}, um email foi enviado com instruções para redefinir sua senha. Verifique também sua caixa de spam.`,
        duration: 9000,
      });
      // Lembre-se de configurar o template de email de redefinição de senha
      // para Português no console do Firebase > Authentication > Templates.
    } catch (error: any) {
      console.error("Password reset error:", error);
      const message = getFirebaseErrorMessage(error.code);
      setAuthError(message); 
      toast({
        variant: "destructive",
        title: "Falha ao Enviar Link",
        description: message,
        duration: 7000,
      });
    }
  };

  const addBooking = async (newBookingData: Omit<Booking, 'id' | 'userId' | 'userName'>): Promise<string> => {
    console.log(`addBooking (para coleção '${RESERVAS_COLLECTION_NAME}') chamada com newBookingData:`, JSON.stringify(newBookingData));

    if (!currentUser) {
      const errMsg = "Você precisa estar logado para fazer uma reserva.";
      toast({ variant: "destructive", title: "Não Autenticado", description: errMsg });
      router.push('/login');
      return Promise.reject(new Error(errMsg));
    }

    const courtIdStr = String(newBookingData.courtId || '').trim();
    const dateStr = String(newBookingData.date || '').trim();
    const timeStr = String(newBookingData.time || '').trim();
    const courtNameStr = String(newBookingData.courtName || '').trim();
    const courtTypeStr = newBookingData.courtType;

    if (!courtIdStr) throw new Error("ID da quadra inválido.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new Error("Formato da data inválido. Use AAAA-MM-DD.");
    if (!/^\d{2}:\d{2}$/.test(timeStr)) throw new Error("Formato da hora inválido. Use HH:mm.");
    if (!courtNameStr) throw new Error("Nome da quadra inválido.");
    if (courtTypeStr !== 'covered' && courtTypeStr !== 'uncovered') {
      console.error("Valor inválido para courtType:", courtTypeStr);
      throw new Error("Tipo da quadra inválido. Deve ser 'covered' ou 'uncovered'.");
    }
    
    const generatedBookingId = doc(collection(db, RESERVAS_COLLECTION_NAME)).id;

    try {
      const reservasColRef = collection(db, RESERVAS_COLLECTION_NAME);
      console.log(`VERIFICAÇÃO DE CONFLITO (NÃO TRANSACIONAL) na coleção '${RESERVAS_COLLECTION_NAME}'. Critérios: courtId='${courtIdStr}', date='${dateStr}', time='${timeStr}'. GARANTA QUE O ÍNDICE (courtId ASC, date ASC, time ASC, Escopo: Coleção) EXISTE E ESTÁ ATIVO PARA A COLEÇÃO '${RESERVAS_COLLECTION_NAME}'.`);
      
      const conflictQuery = query(
        reservasColRef,
        where("courtId", "==", courtIdStr),
        where("date", "==", dateStr),
        where("time", "==", timeStr)
      );
      
      const conflictSnapshot = await getDocs(conflictQuery);
      
      if (!conflictSnapshot.empty) {
        console.warn(`Conflito de reserva detectado (NÃO TRANSACIONAL) na coleção '${RESERVAS_COLLECTION_NAME}':`, conflictSnapshot.docs.map(d => d.data()));
        throw new Error("Este horário já foi reservado. Por favor, escolha outro (verificação não transacional).");
      }

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
      
      const newBookingDocRef = doc(db, RESERVAS_COLLECTION_NAME, generatedBookingId);
      await setDoc(newBookingDocRef, bookingToSave);
      console.log(`Reserva (NÃO TRANSACIONAL) salva com sucesso na coleção '${RESERVAS_COLLECTION_NAME}'. ID da Reserva:`, generatedBookingId);
      return generatedBookingId;

    } catch (error: any) {
      console.error(
        `Erro ao adicionar reserva (verificação não transacional ou escrita) na coleção '${RESERVAS_COLLECTION_NAME}'. Nome do Erro: "${error.name}" "Código do Erro:" ${error.code} "Mensagem do Erro:" "${error.message}"`, error
      );
      
      let toastDescription = `Não foi possível processar sua reserva. Detalhe: ${error.message || 'Erro desconhecido.'}`;
      if (error.message && (error.message.toLowerCase().includes("index") || error.message.includes("FIRESTORE_INDEX_NEARBY") || (error.code === 'failed-precondition' && error.message.toLowerCase().includes("query requires an index")) )) {
        toastDescription = `Um índice necessário no Firestore para a coleção '${RESERVAS_COLLECTION_NAME}' está faltando ou incorreto. Verifique o console para um link para criá-lo (campos: courtId ASC, date ASC, time ASC; Escopo: Coleção).`;
      } else if (error.name === 'TypeError' && error.message && error.message.includes("Cannot read properties of undefined (reading 'path')")) {
        toastDescription = `Falha Crítica na Reserva (Erro Interno Firestore). VERIFIQUE O ÍNDICE da coleção '${RESERVAS_COLLECTION_NAME}' (campos: courtId ASC, date ASC, time ASC; Escopo: Coleção). A consulta que falhou pode ser 'conflictQuery' dentro de addBooking.`;
      } else if (error.message && error.message.includes("Este horário já foi reservado")) {
         // This specific error message is user-friendly enough
      }
      
      toast({ 
        variant: "destructive", 
        title: "Falha na Reserva", 
        description: toastDescription,
        duration: 10000 
      });
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
      const bookingDocRef = doc(db, RESERVAS_COLLECTION_NAME, bookingId);
      const bookingDocSnap = await getDoc(bookingDocRef);

      if (!bookingDocSnap.exists()) {
        throw new Error("Reserva não encontrada.");
      }

      const bookingData = bookingDocSnap.data() as Booking;

      // Admin can cancel any booking, user can cancel their own
      if (isAdmin || currentUser.id === bookingData.userId) {
        await deleteDoc(bookingDocRef);
        toast({
            title: "Reserva Cancelada",
            description: `A reserva ID ${bookingId} foi cancelada com sucesso.`,
        });
      } else {
        throw new Error("Você não tem permissão para cancelar esta reserva.");
      }
    } catch (error: any) {
      console.error(`Erro ao cancelar reserva na coleção '${RESERVAS_COLLECTION_NAME}': `, error);
      toast({
        variant: "destructive",
        title: "Falha ao Cancelar",
        description: error.message || "Não foi possível cancelar a reserva.",
      });
      throw error;
    }
  };

  const updateBookingByAdmin = async (bookingId: string, newDate: string, newTime: string) => {
    if (!isAdmin) {
      toast({ variant: "destructive", title: "Não Autorizado", description: "Apenas administradores podem editar reservas." });
      return Promise.reject(new Error("Não autorizado."));
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate) || !/^\d{2}:\d{2}$/.test(newTime)) {
      throw new Error("Formato de data ou hora inválido.");
    }

    try {
      const bookingDocRef = doc(db, RESERVAS_COLLECTION_NAME, bookingId);
      const bookingSnap = await getDoc(bookingDocRef);
      if (!bookingSnap.exists()) {
        throw new Error("Reserva original não encontrada para edição.");
      }
      const existingBookingData = bookingSnap.data() as Booking;
      const courtIdToUpdate = existingBookingData.courtId; // Admin edits date/time for the same court

      // Check for conflict at the new date/time, excluding the current booking being edited
      const conflictQuery = query(
        collection(db, RESERVAS_COLLECTION_NAME),
        where("courtId", "==", courtIdToUpdate),
        where("date", "==", newDate),
        where("time", "==", newTime)
      );
      const conflictSnapshot = await getDocs(conflictQuery);
      if (!conflictSnapshot.empty) {
        // Check if the conflict is with the booking itself (no real conflict if it's the same booking)
        const conflictingBooking = conflictSnapshot.docs.find(d => d.id !== bookingId);
        if (conflictingBooking) {
          throw new Error(`Este novo horário (${newDate} às ${newTime}) já está reservado por outra pessoa.`);
        }
      }

      await updateDoc(bookingDocRef, {
        date: newDate,
        time: newTime,
      });
      toast({ title: "Reserva Atualizada", description: `Reserva ID ${bookingId} atualizada para ${newDate} às ${newTime}.` });
    } catch (error: any) {
      console.error(`Erro ao atualizar reserva ID ${bookingId} pelo admin: `, error);
      toast({
        variant: "destructive",
        title: "Falha ao Atualizar Reserva",
        description: error.message || "Não foi possível atualizar a reserva.",
      });
      throw error;
    }
  };


  const signUpForPlaySlot = async (slotKey: string, date: string, userDetails: { userId: string, userName: string, userEmail: string }) => {
    if (!currentUser || currentUser.id !== userDetails.userId) {
      toast({ variant: "destructive", title: "Não Autenticado", description: "Ação não permitida ou dados do usuário inconsistentes." });
      router.push('/login');
      return Promise.reject(new Error("Usuário não autenticado ou inconsistente."));
    }

    try {
      const signUpsQuery = query(
        collection(db, PLAY_SIGNUPS_COLLECTION_NAME),
        where("slotKey", "==", slotKey),
        where("date", "==", date),
        where("userId", "==", currentUser.id)
      );
      const existingSignUpSnapshot = await getDocs(signUpsQuery);
      if (!existingSignUpSnapshot.empty) {
        toast({ variant: "default", title: "Já Inscrito", description: "Você já está inscrito para este horário do Play." });
        return;
      }

      const allSignUpsForSlotQuery = query(
        collection(db, PLAY_SIGNUPS_COLLECTION_NAME),
        where("slotKey", "==", slotKey),
        where("date", "==", date)
      );
      const allSignUpsSnapshot = await getDocs(allSignUpsForSlotQuery);
      if (allSignUpsSnapshot.size >= maxParticipantsPerPlaySlot) {
        toast({ variant: "destructive", title: "Vagas Esgotadas", description: "Este horário do Play já atingiu o número máximo de participantes." });
        return Promise.reject(new Error("Vagas esgotadas."));
      }

      const newSignUpData: Omit<PlaySignUp, 'id'> = {
        userId: userDetails.userId,
        userName: userDetails.userName,
        userEmail: userDetails.userEmail,
        slotKey: slotKey,
        date: date,
        signedUpAt: Timestamp.now(),
      };
      await addDoc(collection(db, PLAY_SIGNUPS_COLLECTION_NAME), newSignUpData);
      toast({ title: "Inscrição Confirmada!", description: `Você foi inscrito para o Play em ${date}.` });

    } catch (error: any) {
      console.error(`Erro ao inscrever-se no Play para slot ${slotKey} em ${date}: `, error);
      toast({ variant: "destructive", title: "Falha na Inscrição do Play", description: error.message || "Ocorreu um erro ao tentar se inscrever." });
      throw error;
    }
  };

  const cancelPlaySlotSignUp = async (signUpId: string) => {
     if (!currentUser) {
      toast({ variant: "destructive", title: "Não Autenticado", description: "Você precisa estar logado para cancelar uma inscrição." });
      router.push('/login');
      return Promise.reject(new Error("Usuário não autenticado."));
    }
    try {
      // For admin, they can cancel any. For users, they can only cancel their own.
      // The Firestore rules will enforce this.
      const signUpDocRef = doc(db, PLAY_SIGNUPS_COLLECTION_NAME, signUpId);
      const signUpDoc = await getDoc(signUpDocRef);
      if (!signUpDoc.exists()) {
          throw new Error("Inscrição não encontrada.");
      }
      
      // If current user is admin, or if the signUp belongs to the current user
      if (isAdmin || signUpDoc.data()?.userId === currentUser.id) {
          await deleteDoc(signUpDocRef);
          toast({ title: "Inscrição Cancelada", description: "A inscrição no Play foi cancelada." });
      } else {
          throw new Error("Você não tem permissão para cancelar esta inscrição.");
      }

    } catch (error: any) {
      console.error(`Erro ao cancelar inscrição do Play (ID: ${signUpId}): `, error);
      toast({ variant: "destructive", title: "Falha ao Cancelar Inscrição", description: error.message || "Ocorreu um erro." });
      throw error;
    }
  };

  useEffect(() => {
    const protectedRoutes = ['/my-bookings', '/admin']; // '/admin' could be added here
    if (!isLoading && !currentUser && protectedRoutes.includes(pathname)) {
      router.push('/login');
    }
    // Further admin-only route protection could be added here
    if (!isLoading && currentUser && !isAdmin && pathname === '/admin') {
        toast({variant: "destructive", title: "Acesso Negado", description: "Você não tem permissão para acessar esta página."});
        router.push('/');
    }

  }, [currentUser, isLoading, isAdmin, pathname, router]);

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isAdmin,
      bookings, 
      playSignUps, 
      login, 
      signUp, 
      logout, 
      sendPasswordReset, 
      addBooking, 
      cancelBooking, 
      updateBookingByAdmin,
      signUpForPlaySlot, 
      cancelPlaySlotSignUp, 
      isLoading, 
      authError, 
      clearAuthError 
    }}>
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
    case "auth/missing-email":
        return "Por favor, insira seu endereço de email.";
    default:
      return "Ocorreu um erro de autenticação. Tente novamente.";
  }
}
