
import { useEffect, useState } from "react";
import { QueueStatus } from "@/components/QueueStatus";
import { QueueActions } from "@/components/QueueActions";
import { QueueList } from "@/components/QueueList";

const Index = () => {
  const [currentNumber, setCurrentNumber] = useState(1);
  const [queue, setQueue] = useState<number[]>([]);
  const [userNumber, setUserNumber] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Comprobar si estamos en horario de servicio
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
    const interval = setInterval(checkServiceHours, 60000); // Comprobar cada minuto

    return () => clearInterval(interval);
  }, []);

  const handleJoinQueue = () => {
    const nextNumber = queue.length > 0 ? Math.max(...queue) + 1 : 1;
    setQueue([...queue, nextNumber]);
    setUserNumber(nextNumber);
  };

  const handleConfirm = () => {
    if (userNumber === currentNumber) {
      setQueue(queue.filter(n => n !== currentNumber));
      setCurrentNumber(current => current + 1);
      setUserNumber(null);
    }
  };

  const handleCancel = () => {
    if (userNumber) {
      setQueue(queue.filter(n => n !== userNumber));
      if (userNumber === currentNumber) {
        setCurrentNumber(current => current + 1);
      }
      setUserNumber(null);
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
