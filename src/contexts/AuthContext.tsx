
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
  sendPasswordResetEmail, // Importado
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
  addDoc, // Para novas reservas
  getDocs, // Para verificar conflitos
  Timestamp, // Para PlaySignUp
} from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { maxParticipantsPerPlaySlot } from '@/config/appConfig'; // Para o Play

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_COLLECTION_NAME = "users";
const RESERVAS_COLLECTION_NAME = "reservas"; // Nome da coleção em português
const PLAY_SIGNUPS_COLLECTION_NAME = "playSignUps"; 

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [playSignUps, setPlaySignUps] = useState<PlaySignUp[]>([]); 
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

    // Listener para TODAS as reservas (necessário para o calendário de disponibilidade)
    const reservasColRef = collection(db, RESERVAS_COLLECTION_NAME); 
    const qReservas = query(reservasColRef); 
    const unsubscribeBookings = onSnapshot(qReservas, (querySnapshot) => {
      const allBookings: Booking[] = [];
      querySnapshot.forEach((doc) => {
        allBookings.push({ id: doc.id, ...doc.data() } as Booking);
      });
      setBookings(allBookings);
    }, (error) => {
      console.error(`Erro ao buscar dados da coleção '${RESERVAS_COLLECTION_NAME}' (verifique regras e índices do Firestore): `, error);
      toast({ 
        variant: "destructive", 
        title: `Erro ao buscar reservas`,
        description: `Não foi possível carregar os dados de todas as reservas. Verifique suas Regras de Segurança do Firestore para permitir leitura pública ('list') da coleção '${RESERVAS_COLLECTION_NAME}' e os logs do console para mais detalhes. Erro: ${error.message}`,
        duration: 10000
      });
    });

    // Listener para Play SignUps
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
        title: `Erro ao buscar inscrições do Play`,
        description: `Não foi possível carregar os dados das inscrições do Play. Verifique suas Regras de Segurança do Firestore. Erro: ${error.message}`,
        duration: 10000
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeBookings();
      unsubscribePlaySignUps(); 
    };
  }, []); // Removido toast das dependências


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
        
        // Criar documento do usuário na coleção "users"
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
    } catch (error: any) {
      console.error("Logout error:", error);
      const message = getFirebaseErrorMessage(error.code);
      setAuthError(message);
      toast({ variant: "destructive", title: "Falha ao Sair", description: message });
    } finally {
      setIsLoading(false);
    }
  };

  // Para localizar o email de redefinição de senha (e outros emails do Firebase Auth) para português,
  // você deve ir ao Console do Firebase > Authentication > Templates.
  // Selecione "Password reset" e altere o idioma do template para "Português (pt)".
  const sendPasswordReset = async (email: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Link de Redefinição Enviado",
        description: `Se uma conta existir para ${email}, um email foi enviado com instruções para redefinir sua senha.`,
        duration: 9000, // Maior duração para esta mensagem
      });
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

    // Pré-cast e validação rigorosa dos campos de entrada
    const courtIdStr = String(newBookingData.courtId || '').trim();
    const dateStr = String(newBookingData.date || '').trim();
    const timeStr = String(newBookingData.time || '').trim();
    const courtNameStr = String(newBookingData.courtName || '').trim();
    const courtTypeStr = newBookingData.courtType;

    if (!courtIdStr || courtIdStr === 'undefined') {
      const msg = "ID da quadra inválido fornecido para reserva.";
      console.error(msg, newBookingData);
      throw new Error(msg);
    }
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const msg = "Formato da data inválido para reserva. Use AAAA-MM-DD.";
      console.error(msg, newBookingData);
      throw new Error(msg);
    }
    if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) {
      const msg = "Formato da hora inválido para reserva. Use HH:mm.";
      console.error(msg, newBookingData);
      throw new Error(msg);
    }
    if (!courtNameStr || courtNameStr === 'undefined') {
      const msg = "Nome da quadra inválido fornecido para reserva.";
      console.error(msg, newBookingData);
      throw new Error(msg);
    }
     if (!courtTypeStr || (courtTypeStr !== 'covered' && courtTypeStr !== 'uncovered')) {
        const msg = "Tipo da quadra inválido. Use 'covered' ou 'uncovered'.";
        console.error(msg, newBookingData);
        throw new Error(msg);
    }

    // Gerar ID da reserva no cliente
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
        `Erro ao adicionar reserva (verificação não transacional ou escrita) na coleção '${RESERVAS_COLLECTION_NAME}'. Nome do Erro: "${error.name}" "Código do Erro:" ${error.code} "Mensagem do Erro:" "${error.message}" "Objeto de Erro Completo:"`, error
      );
      
      let toastDescription = `Não foi possível processar sua reserva. Detalhe: ${error.message || 'Erro desconhecido.'}`;
      if (error.name === 'FirebaseError' && error.message && (error.message.toLowerCase().includes("index") || error.message.includes("FIRESTORE_INDEX_NEARBY") || (error.code === 'failed-precondition' && error.message.toLowerCase().includes("query requires an index")) )) {
        toastDescription = `Um índice necessário no Firestore para a coleção '${RESERVAS_COLLECTION_NAME}' está faltando ou incorreto para a consulta de verificação de conflito. Verifique o console do servidor/navegador para um link para criá-lo ou crie-o manualmente (campos: courtId ASC, date ASC, time ASC na coleção '${RESERVAS_COLLECTION_NAME}' com escopo de 'Coleção').`;
      } else if (error.message && error.message.includes("Este horário já foi reservado")) {
        toastDescription = error.message;
      } else if (error.name === 'TypeError' && error.message && error.message.includes("Cannot read properties of undefined (reading 'path')")) {
        toastDescription = `Falha crítica na reserva (Erro Interno Firestore). Verifique se o índice da coleção '${RESERVAS_COLLECTION_NAME}' (campos: courtId ASC, date ASC, time ASC; Escopo: Coleção) está ATIVO e CORRETO. Consulte os logs do console para mais detalhes.`;
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
      await deleteDoc(bookingDocRef);
    } catch (error: any) {
      console.error(`Erro ao cancelar reserva na coleção '${RESERVAS_COLLECTION_NAME}': `, error);
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
      const signUpDocRef = doc(db, PLAY_SIGNUPS_COLLECTION_NAME, signUpId);
      await deleteDoc(signUpDocRef);
      toast({ title: "Inscrição Cancelada", description: "Sua inscrição no Play foi cancelada." });
    } catch (error: any) {
      console.error(`Erro ao cancelar inscrição do Play (ID: ${signUpId}): `, error);
      toast({ variant: "destructive", title: "Falha ao Cancelar Inscrição", description: error.message || "Ocorreu um erro." });
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
    <AuthContext.Provider value={{ 
      currentUser, 
      bookings, 
      playSignUps, 
      login, 
      signUp, 
      logout, 
      sendPasswordReset, 
      addBooking, 
      cancelBooking, 
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

    