
"use client";

import type { User, Booking, PlaySignUp, BookingActivity, AuthContextType, AuthProviderProps } from '@/lib/types';
export type { AuthContextType } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import { createContext, useState, useEffect, useCallback } from 'react';
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
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { maxParticipantsPerPlaySlot } from '@/config/appConfig';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_COLLECTION_NAME = "users";
const RESERVAS_COLLECTION_NAME = "reservas";
const PLAY_SIGNUPS_COLLECTION_NAME = "playSignUps";
const ADMINS_COLLECTION_NAME = "admins";
const BOOKING_ACTIVITIES_COLLECTION_NAME = "bookingActivities";

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [playSignUps, setPlaySignUps] = useState<PlaySignUp[]>([]);
  const [bookingActivities, setBookingActivities] = useState<BookingActivity[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true); 
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const clearAuthError = useCallback(() => setAuthError(null), []);

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
            try {
              const usersCollectionRef = collection(db, USERS_COLLECTION_NAME);
              const usersSnapshot = await getDocs(usersCollectionRef);
              setTotalUsers(usersSnapshot.size);
            } catch (usersError: any) {
              console.error("Error fetching total users:", usersError);
              toast({
                variant: "destructive",
                title: "Erro ao Buscar Usuários (Admin)",
                description: `Permissão negada ou erro ao contar usuários. Verifique regras do Firestore para 'users'. Erro: ${getFirebaseErrorMessage(usersError.code, "Falha ao buscar contagem de usuários.")}`,
                duration: 9000,
              });
            }
          } else {
            setIsAdmin(false);
            setTotalUsers(0);
            console.log(`User ${firebaseUser.uid} is NOT an admin.`);
          }
        } catch (error: any) {
          console.error("Error checking admin status:", error);
           toast({
            variant: "destructive",
            title: "Erro Crítico ao Verificar Admin",
            description: `Não foi possível verificar o status de administrador. ${getFirebaseErrorMessage(error.code, "Verifique as regras do Firestore para a coleção 'admins' e a conexão.")}`,
            duration: 10000,
          });
          setIsAdmin(false);
          setTotalUsers(0);
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setTotalUsers(0);
      }
      setIsLoading(false);
    });

    const reservasColRef = collection(db, RESERVAS_COLLECTION_NAME);
    const qReservas = query(reservasColRef); 
    const unsubscribeBookings = onSnapshot(qReservas, (querySnapshot) => {
      const allBookings: Booking[] = [];
      querySnapshot.forEach((docSnap) => {
        allBookings.push({ id: docSnap.id, ...docSnap.data() } as Booking);
      });
      setBookings(allBookings);
    }, (error: any) => {
      console.error(`Erro ao buscar dados da coleção '${RESERVAS_COLLECTION_NAME}' (verifique regras e índices do Firestore): `, error);
      toast({ 
        variant: "destructive", 
        title: `Erro ao Buscar Reservas`,
        description: `Não foi possível carregar os dados de todas as reservas. Verifique suas Regras de Segurança do Firestore (especialmente 'allow list: if true;') e Índices. Erro: ${getFirebaseErrorMessage(error.code, "Falha ao carregar reservas.")}`,
        duration: 10000
      });
    });

    const playSignUpsColRef = collection(db, PLAY_SIGNUPS_COLLECTION_NAME);
    const qPlaySignUps = query(playSignUpsColRef);
    const unsubscribePlaySignUps = onSnapshot(qPlaySignUps, (querySnapshot) => {
      const allSignUps: PlaySignUp[] = [];
      querySnapshot.forEach((docSnap) => {
        allSignUps.push({ id: docSnap.id, ...docSnap.data() } as PlaySignUp);
      });
      setPlaySignUps(allSignUps);
    }, (error) => {
      console.error(`Erro ao buscar dados da coleção '${PLAY_SIGNUPS_COLLECTION_NAME}': `, error);
      toast({
        variant: "destructive",
        title: `Erro ao Buscar Inscrições do Play`,
        description: `Não foi possível carregar os dados das inscrições do Play. Verifique suas Regras de Segurança e Índices do Firestore. Erro: ${getFirebaseErrorMessage(error.code, "Falha ao carregar inscrições Play.")}`,
        duration: 10000
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeBookings();
      unsubscribePlaySignUps();
    };
  }, [toast]);

  useEffect(() => {
    if (!isAdmin) {
      setBookingActivities([]);
      return;
    }

    const bookingActivitiesColRef = collection(db, BOOKING_ACTIVITIES_COLLECTION_NAME);
    const qBookingActivities = query(bookingActivitiesColRef);
    const unsubscribe = onSnapshot(qBookingActivities, (querySnapshot) => {
      const allActivities: BookingActivity[] = [];
      querySnapshot.forEach((docSnap) => {
        allActivities.push({ id: docSnap.id, ...docSnap.data() } as BookingActivity);
      });
      setBookingActivities(allActivities);
    }, (error) => {
      console.error(`Erro ao buscar dados da coleção '${BOOKING_ACTIVITIES_COLLECTION_NAME}': `, error);
      toast({
        variant: "destructive",
        title: `Erro ao Buscar Atividades`,
        description: `Não foi possível carregar o histórico de atividades. Erro: ${getFirebaseErrorMessage(error.code, "Falha ao carregar atividades.")}`,
        duration: 10000
      });
    });

    return () => unsubscribe();
  }, [isAdmin, toast]);


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

  const addBooking = async (
    newBookingData: Omit<Booking, 'id' | 'userId' | 'userName' | 'onBehalfOf'>,
    onBehalfOfName?: string
  ): Promise<string> => {
    console.log(`addBooking (para coleção '${RESERVAS_COLLECTION_NAME}') chamada com newBookingData:`, JSON.stringify(newBookingData), "On behalf of:", onBehalfOfName);
    
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
      console.error("Valor inválido para courtType em addBooking:", courtTypeStr);
      throw new Error("Tipo da quadra inválido. Deve ser 'covered' ou 'uncovered'.");
    }
    
    const generatedBookingId = doc(collection(db, RESERVAS_COLLECTION_NAME)).id;

    try {
      const reservasColRef = collection(db, RESERVAS_COLLECTION_NAME);
      console.log(`Verificando conflito (NÃO TRANSACIONAL) na coleção '${RESERVAS_COLLECTION_NAME}'. Critérios: courtId='${courtIdStr}', date='${dateStr}', time='${timeStr}'. GARANTA QUE O ÍNDICE (courtId ASC, date ASC, time ASC, Escopo: Coleção) EXISTE E ESTÁ ATIVO PARA A COLEÇÃO '${RESERVAS_COLLECTION_NAME}'.`);
      
      const conflictQuery = query(
        reservasColRef,
        where("courtId", "==", courtIdStr),
        where("date", "==", dateStr),
        where("time", "==", timeStr)
      );
      console.log("Objeto da Query de Conflito:", conflictQuery);
      
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
        ...(onBehalfOfName && { onBehalfOf: onBehalfOfName.trim() }),
      };
      console.log(`Nenhum conflito encontrado (NÃO TRANSACIONAL). Tentando salvar nova reserva na coleção '${RESERVAS_COLLECTION_NAME}':`, bookingToSave);
      
      const newBookingDocRef = doc(db, RESERVAS_COLLECTION_NAME, generatedBookingId);
      await setDoc(newBookingDocRef, bookingToSave);
      console.log(`Reserva (NÃO TRANSACIONAL) salva com sucesso na coleção '${RESERVAS_COLLECTION_NAME}'. ID da Reserva:`, generatedBookingId);
      try {
        await addDoc(collection(db, BOOKING_ACTIVITIES_COLLECTION_NAME), {
          bookingId: generatedBookingId,
          action: 'created',
          userId: currentUser.id,
          userName: currentUser.name,
          courtId: courtIdStr,
          courtName: courtNameStr,
          date: dateStr,
          time: timeStr,
          timestamp: serverTimestamp(),
        });
      } catch (logError) {
        console.error('Falha ao registrar atividade de criação de reserva:', logError);
      }
      return generatedBookingId;

    } catch (error: any) {
      console.error(
        `Erro ao adicionar reserva (verificação não transacional ou escrita) na coleção '${RESERVAS_COLLECTION_NAME}'. Nome do Erro: "${error.name}" "Código do Erro:" ${error.code} "Mensagem do Erro:" "${error.message}"`, error
      );
      
      let toastDescription = `Não foi possível processar sua reserva. Detalhe: ${error.message || 'Erro desconhecido.'}`;
      const isTypeErrorWithPath = error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'path')");
      
      if (isTypeErrorWithPath) {
        toastDescription = `Falha Crítica na Reserva (Erro Interno Firestore). Isso geralmente indica um ÍNDICE AUSENTE ou MAL CONFIGURADO para a coleção '${RESERVAS_COLLECTION_NAME}'. Verifique o console para um link de criação de índice ou crie manualmente (campos: courtId ASC, date ASC, time ASC; Escopo: Coleção). Por favor, confirme se o índice está ATIVO.`;
        console.error("DETALHE DO ERRO 'TypeError reading path': Verifique se o índice (courtId ASC, date ASC, time ASC; Escopo: Coleção) existe e está ATIVO para a coleção: ", RESERVAS_COLLECTION_NAME);
      } else if (error.message && (error.message.toLowerCase().includes("index") || error.message.includes("FIRESTORE_INDEX_NEARBY") || (error.code === 'failed-precondition' && error.message.toLowerCase().includes("query requires an index")) )) {
        toastDescription = `Um índice necessário no Firestore para a coleção '${RESERVAS_COLLECTION_NAME}' está faltando ou incorreto. Verifique o console para um link para criá-lo (campos: courtId ASC, date ASC, time ASC; Escopo: Coleção).`;
      } else if (error.message && error.message.includes("Este horário já foi reservado")) {
         // This specific error message is user-friendly enough
      }
      
      toast({ 
        variant: "destructive", 
        title: "Falha na Reserva", 
        description: toastDescription,
        duration: 12000 
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

      if (isAdmin || currentUser.id === bookingData.userId) {
        await deleteDoc(bookingDocRef);
        try {
          await addDoc(collection(db, BOOKING_ACTIVITIES_COLLECTION_NAME), {
            bookingId,
            action: 'canceled',
            userId: bookingData.userId,
            userName: bookingData.userName,
            courtId: bookingData.courtId,
            courtName: bookingData.courtName,
            date: bookingData.date,
            time: bookingData.time,
            timestamp: serverTimestamp(),
          });
        } catch (logError) {
          console.error('Falha ao registrar atividade de cancelamento de reserva:', logError);
        }
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

  const updateBookingByAdmin = async (bookingId: string, newDate: string, newTime: string, newOnBehalfOfName?: string) => {
    if (!isAdmin) {
      toast({ variant: "destructive", title: "Não Autorizado", description: "Apenas administradores podem editar reservas." });
      return Promise.reject(new Error("Não autorizado."));
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate) || !/^\d{2}:\d{2}$/.test(newTime)) {
      throw new Error("Formato de data ou hora inválido para atualização.");
    }
    console.log(`Admin updateBooking. ID: ${bookingId}, New Date: ${newDate}, New Time: ${newTime}, New OnBehalfOf: ${newOnBehalfOfName}`);

    try {
      const bookingDocRef = doc(db, RESERVAS_COLLECTION_NAME, bookingId);
      const bookingSnap = await getDoc(bookingDocRef);
      if (!bookingSnap.exists()) {
        throw new Error("Reserva original não encontrada para edição pelo admin.");
      }
      const existingBookingData = bookingSnap.data() as Booking;
      const courtIdToUpdate = existingBookingData.courtId; 

      console.log(`Verificando conflito para atualização (Admin). Coleção: '${RESERVAS_COLLECTION_NAME}', CourtId: ${courtIdToUpdate}, NewDate: ${newDate}, NewTime: ${newTime}. Excluindo ID: ${bookingId}`);
      const conflictQuery = query(
        collection(db, RESERVAS_COLLECTION_NAME),
        where("courtId", "==", courtIdToUpdate),
        where("date", "==", newDate),
        where("time", "==", newTime)
      );
      const conflictSnapshot = await getDocs(conflictQuery);
      if (!conflictSnapshot.empty) {
        const conflictingBooking = conflictSnapshot.docs.find(d => d.id !== bookingId);
        if (conflictingBooking) {
          throw new Error(`Este novo horário (${newDate} às ${newTime}) para a quadra ${existingBookingData.courtName} já está reservado.`);
        }
      }
      
      const dataToUpdate: any = {
        date: newDate,
        time: newTime,
      };

      if (newOnBehalfOfName !== undefined) { // If newOnBehalfOfName was passed
        dataToUpdate.onBehalfOf = newOnBehalfOfName.trim() || undefined; // Set to undefined if empty string, to remove field
      }


      await updateDoc(bookingDocRef, dataToUpdate);
      try {
        await addDoc(collection(db, BOOKING_ACTIVITIES_COLLECTION_NAME), {
          bookingId,
          action: 'updated',
          userId: existingBookingData.userId,
          userName: existingBookingData.userName,
          courtId: existingBookingData.courtId,
          courtName: existingBookingData.courtName,
          date: newDate,
          time: newTime,
          timestamp: serverTimestamp(),
        });
      } catch (logError) {
        console.error('Falha ao registrar atividade de atualização de reserva:', logError);
      }
      toast({ title: "Reserva Atualizada", description: `Reserva ID ${bookingId} atualizada pelo admin.` });
    } catch (error: any) {
      console.error(`Erro ao atualizar reserva ID ${bookingId} pelo admin: `, error);
      toast({
        variant: "destructive",
        title: "Falha ao Atualizar Reserva (Admin)",
        description: error.message || "Não foi possível atualizar a reserva.",
        duration: 9000,
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

    } catch (error: any)
{
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
      const signUpDocRef = doc(db, PLAY_SIGNUPS_COLLECTION_NAME, signUpId);
      const signUpDoc = await getDoc(signUpDocRef);
      if (!signUpDoc.exists()) {
          throw new Error("Inscrição não encontrada.");
      }
      
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
    const protectedRoutes = ['/my-bookings', '/admin']; 
    if (!isLoading && !currentUser && protectedRoutes.includes(pathname)) {
      router.push('/login');
    }
    if (!isLoading && currentUser && !isAdmin && pathname === '/admin') {
        toast({variant: "destructive", title: "Acesso Negado", description: "Você não tem permissão para acessar esta página."});
        router.push('/');
    }

  }, [currentUser, isLoading, isAdmin, pathname, router, toast]); // Added toast to dependency array

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAdmin,
      bookings,
      playSignUps,
      bookingActivities,
      totalUsers,
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

function getFirebaseErrorMessage(errorCode: string, defaultMessage: string = "Ocorreu um erro. Tente novamente."): string {
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
    case "permission-denied":
        return "Permissão negada. Verifique as regras de segurança do Firestore e se você está autenticado com as permissões corretas.";
    default:
      console.warn("Código de erro Firebase não mapeado:", errorCode);
      return defaultMessage;
  }
}
