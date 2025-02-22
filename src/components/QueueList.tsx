
import { Card } from "@/components/ui/card";

interface QueueItem {
  number: number;
  name: string;
}

interface QueueListProps {
  queue: QueueItem[];
  currentNumber: number;
  userNumber: number | null;
}

export function QueueList({ queue, currentNumber, userNumber }: QueueListProps) {
  if (queue.length === 0) {
    return (
      <Card className="p-6 text-center bg-gray-50">
        <p className="text-gray-500">No hay nadie en la cola</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4 animate-fadeIn">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cola actual</h3>
      <div className="space-y-2">
        {queue.map((item) => (
          <div
            key={item.number}
            className={`p-4 rounded-lg border ${
              item.number === currentNumber
                ? "bg-mint-50 border-mint-200"
                : "bg-white border-gray-100"
            } ${
              item.number === userNumber
                ? "border-mint-300"
                : ""
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-900">Turno {item.number}</span>
                <p className="text-sm text-gray-500">{item.name}</p>
              </div>
              {item.number === userNumber && (
                <span className="text-sm text-mint-600">Tú</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
