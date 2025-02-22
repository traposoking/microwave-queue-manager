
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
  getDocs
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

  useEffect(() => {
    const q = query(collection(db, QUEUE_COLLECTION), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const queueItems = snapshot.docs.map(doc => {
        const data = doc.data() as QueueItem;
        return data;
      });
      setQueue(queueItems);
      
      // Si no hay usuarios en la cola y el último turno fue confirmado,
      // actualizar el número actual al siguiente
      if (queueItems.length === 0) {
        setDoc(doc(db, QUEUE_COLLECTION, CURRENT_NUMBER_DOC), {
          number: currentNumber + 1
        });
      }
    });

    return () => unsubscribe();
  }, [currentNumber]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, QUEUE_COLLECTION, CURRENT_NUMBER_DOC), (doc) => {
      if (doc.exists()) {
        setCurrentNumber(doc.data().number);
      }
    });

    return () => unsubscribe();
  }, []);

  // Comprobar horario de servicio
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

    try {
      const nextNumber = queue.length > 0 ? Math.max(...queue.map(item => item.number)) + 1 : currentNumber;
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
      
      // Si es el primer usuario y coincide con el número actual
      if (queue.length === 0 && nextNumber === currentNumber) {
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
    }
  };

  const handleConfirm = async () => {
    if (userNumber === currentNumber) {
      try {
        await deleteDoc(doc(db, QUEUE_COLLECTION, currentNumber.toString()));
        
        await setDoc(doc(db, QUEUE_COLLECTION, CURRENT_NUMBER_DOC), {
          number: currentNumber + 1
        });

        setUserNumber(null);
      } catch (error) {
        console.error("Error al confirmar turno:", error);
      }
    }
  };

  const handleCancel = async () => {
    if (userNumber) {
      try {
        await deleteDoc(doc(db, QUEUE_COLLECTION, userNumber.toString()));
        
        if (userNumber === currentNumber) {
          await setDoc(doc(db, QUEUE_COLLECTION, CURRENT_NUMBER_DOC), {
            number: currentNumber + 1
          });
        }
        
        setUserNumber(null);
      } catch (error) {
        console.error("Error al cancelar turno:", error);
      }
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
