
import { useEffect, useState } from "react";
import { QueueStatus } from "@/components/QueueStatus";
import { QueueActions } from "@/components/QueueActions";
import { QueueList } from "@/components/QueueList";
import { db } from "@/lib/firebase";
import { 
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  getDocs,
  getDoc
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const QUEUE_COLLECTION = 'queue';
const CURRENT_NUMBER_DOC = 'currentNumber';

interface QueueItem {
  id: string;
  number: number;
  timestamp: number;
  name: string;
}

const Index = () => {
  const [currentNumber, setCurrentNumber] = useState(1);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [userNumber, setUserNumber] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const { toast } = useToast();

  // Efecto para escuchar cambios en la cola
  useEffect(() => {
    const q = query(collection(db, QUEUE_COLLECTION), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const queueItems = snapshot.docs
        .filter(doc => doc.id !== CURRENT_NUMBER_DOC) // Excluir el documento de control
        .map(doc => {
          const data = doc.data() as QueueItem;
          return data;
        });
      setQueue(queueItems);
    });

    return () => unsubscribe();
  }, []);

  // Efecto para escuchar cambios en el número actual
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, QUEUE_COLLECTION, CURRENT_NUMBER_DOC), async (doc) => {
      if (!doc.exists()) {
        // Si el documento no existe, lo creamos con el valor inicial
        await setDoc(doc.ref, { number: 1 });
        setCurrentNumber(1);
      } else {
        setCurrentNumber(doc.data().number);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkServiceHours = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = hours * 60 + minutes;
      const openTime = 9 * 60; // 9:00
      const closeTime = 22 * 60; // 22:00
      
      setIsOpen(currentTime >= openTime && currentTime < closeTime);
    };

    checkServiceHours();
    const interval = setInterval(checkServiceHours, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleJoinQueue = async () => {
    if (!userName.trim()) {
      toast({
        title: "Error",
        description: "Por favor, introduce tu nombre",
        variant: "destructive"
      });
      return;
    }

    if (userNumber) {
      toast({
        title: "Error",
        description: "Ya tienes un turno asignado",
        variant: "destructive"
      });
      return;
    }

    if (!isOpen) {
      toast({
        title: "Error",
        description: "El servicio está cerrado",
        variant: "destructive"
      });
      return;
    }

    try {
      // Obtener el número actual de Firebase
      const currentNumberDoc = await getDoc(doc(db, QUEUE_COLLECTION, CURRENT_NUMBER_DOC));
      if (!currentNumberDoc.exists()) {
        throw new Error("No se pudo obtener el número actual");
      }

      const nextNumber = currentNumberDoc.data().number;
      const newQueueItem: QueueItem = {
        id: nextNumber.toString(),
        number: nextNumber,
        timestamp: Date.now(),
        name: userName.trim()
      };

      await setDoc(
        doc(db, QUEUE_COLLECTION, nextNumber.toString()),
        newQueueItem
      );
      
      // Si es el primer usuario
      if (queue.length === 0) {
        toast({
          title: "¡Es tu turno!",
          description: "Puedes usar el microondas ahora.",
        });
      } else {
        toast({
          title: "¡Te has unido a la cola!",
          description: `Tu número es: ${nextNumber}`,
        });
      }
      
      setUserNumber(nextNumber);
      setUserName("");
    } catch (error) {
      console.error("Error al unirse a la cola:", error);
      toast({
        title: "Error",
        description: "No se pudo unir a la cola. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handleConfirm = async () => {
    if (!userNumber) {
      toast({
        title: "Error",
        description: "No tienes un turno asignado",
        variant: "destructive"
      });
      return;
    }

    if (userNumber !== currentNumber) {
      toast({
        title: "Error",
        description: "No es tu turno todavía",
        variant: "destructive"
      });
      return;
    }

    try {
      await deleteDoc(doc(db, QUEUE_COLLECTION, userNumber.toString()));
      
      // Incrementar el número actual solo cuando se confirma el uso
      const currentNumberDoc = await getDoc(doc(db, QUEUE_COLLECTION, CURRENT_NUMBER_DOC));
      if (currentNumberDoc.exists()) {
        await setDoc(doc(db, QUEUE_COLLECTION, CURRENT_NUMBER_DOC), {
          number: currentNumberDoc.data().number + 1
        });
      }
      
      setUserNumber(null);
      
      toast({
        title: "¡Gracias!",
        description: "Has confirmado tu turno.",
      });
    } catch (error) {
      console.error("Error al confirmar turno:", error);
      toast({
        title: "Error",
        description: "No se pudo confirmar el turno. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = async () => {
    if (!userNumber) {
      toast({
        title: "Error",
        description: "No tienes un turno asignado",
        variant: "destructive"
      });
      return;
    }

    try {
      await deleteDoc(doc(db, QUEUE_COLLECTION, userNumber.toString()));
      
      // Solo incrementar el número actual si era el turno actual
      if (userNumber === currentNumber) {
        const currentNumberDoc = await getDoc(doc(db, QUEUE_COLLECTION, CURRENT_NUMBER_DOC));
        if (currentNumberDoc.exists()) {
          await setDoc(doc(db, QUEUE_COLLECTION, CURRENT_NUMBER_DOC), {
            number: currentNumberDoc.data().number + 1
          });
        }
      }
      
      setUserNumber(null);
      toast({
        title: "Turno cancelado",
        description: "Has salido de la cola correctamente.",
      });
    } catch (error) {
      console.error("Error al cancelar turno:", error);
      toast({
        title: "Error",
        description: "No se pudo cancelar el turno. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-8">
          Gestión de cola del microondas
        </h1>
        
        <QueueStatus
          currentNumber={currentNumber}
          queueLength={queue.length}
          isOpen={isOpen}
          currentUser={queue.find(item => item.number === currentNumber)?.name}
        />
        
        <QueueActions
          userNumber={userNumber}
          isCurrentUser={userNumber === currentNumber}
          onJoin={handleJoinQueue}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isOpen={isOpen}
          userName={userName}
          onNameChange={setUserName}
        />
        
        {queue.length > 0 && (
          <QueueList
            queue={queue}
            currentNumber={currentNumber}
            userNumber={userNumber}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
