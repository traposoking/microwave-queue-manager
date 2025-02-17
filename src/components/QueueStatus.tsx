
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface QueueStatusProps {
  currentNumber: number;
  queueLength: number;
  isOpen: boolean;
}

export function QueueStatus({ currentNumber, queueLength, isOpen }: QueueStatusProps) {
  if (!isOpen) {
    return (
      <Card className="p-6 text-center animate-fadeIn bg-gray-50 border-gray-200">
        <Badge variant="outline" className="mb-4 bg-gray-100 text-gray-500">
          Cerrado
        </Badge>
        <h2 className="text-xl font-semibold text-gray-600">
          El servicio está cerrado
        </h2>
        <p className="mt-2 text-gray-500">
          Disponible de 13:30 a 15:00
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 text-center animate-fadeIn bg-gradient-to-b from-white to-gray-50">
      <Badge variant="outline" className="mb-4 bg-mint-50 text-mint-700 border-mint-200">
        En servicio
      </Badge>
      <h2 className="text-3xl font-semibold text-gray-900 mb-2">
        Turno actual: {currentNumber}
      </h2>
      <p className="text-gray-500">
        {queueLength} {queueLength === 1 ? "persona" : "personas"} en espera
      </p>
    </Card>
  );
}
