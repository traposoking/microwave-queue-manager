
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

const QUEUE_COLLECTION = 'queue';
const CURRENT_NUMBER_DOC = 'currentNumber';

interface QueueItem {
  id: string;
  number: number;
  timestamp: number;
}

const Index = () => {
  const [currentNumber, setCurrentNumber] = useState(1);
  const [queue, setQueue] = useState<number[]>([]);
  const [userNumber, setUserNumber] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Suscripción a cambios en la cola
  useEffect(() => {
    const q = query(collection(db, QUEUE_COLLECTION), orderBy('timestamp'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const numbers = snapshot.docs.map(doc => {
        const data = doc.data() as QueueItem;
        return data.number;
      });
      setQueue(numbers);
    });

    return () => unsubscribe();
  }, []);

  // Suscripción al número actual
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
    try {
      const queueSnapshot = await getDocs(collection(db, QUEUE_COLLECTION));
      const numbers = queueSnapshot.docs.map(doc => {
        const data = doc.data() as QueueItem;
        return data.number;
      });
      
      const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
      const newQueueItem: QueueItem = {
        id: nextNumber.toString(),
        number: nextNumber,
        timestamp: Date.now()
      };

      await setDoc(
        doc(db, QUEUE_COLLECTION, nextNumber.toString()),
        newQueueItem
      );
      
      setUserNumber(nextNumber);
    } catch (error) {
      console.error("Error al unirse a la cola:", error);
    }
  };

  const handleConfirm = async () => {
    if (userNumber === currentNumber) {
      try {
        // Eliminar el turno actual
        await deleteDoc(doc(db, QUEUE_COLLECTION, currentNumber.toString()));
        
        // Actualizar el número actual
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
        />
        
        <QueueActions
          userNumber={userNumber}
          isCurrentUser={userNumber === currentNumber}
          onJoin={handleJoinQueue}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isOpen={isOpen}
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
