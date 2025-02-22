
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface QueueActionsProps {
  userNumber: number | null;
  isCurrentUser: boolean;
  onJoin: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  isOpen: boolean;
  userName: string;
  onNameChange: (name: string) => void;
}

export function QueueActions({
  userNumber,
  isCurrentUser,
  onJoin,
  onConfirm,
  onCancel,
  isOpen,
  userName,
  onNameChange,
}: QueueActionsProps) {
  const { toast } = useToast();

  if (!isOpen) {
    return null;
  }

  const handleJoin = () => {
    onJoin();
    toast({
      title: "¡Te has unido a la cola!",
      description: `Tu número es: ${userNumber}`,
    });
  };

  const handleConfirm = () => {
    onConfirm();
    toast({
      title: "¡Gracias por confirmar!",
      description: "El siguiente usuario será notificado.",
    });
  };

  const handleCancel = () => {
    onCancel();
    toast({
      title: "Has salido de la cola",
      description: "Tu turno ha sido cancelado.",
    });
  };

  if (!userNumber) {
    return (
      <Card className="p-6 space-y-4 animate-slideUp">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            placeholder="Introduce tu nombre"
            value={userName}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>
        <Button
          onClick={handleJoin}
          className="w-full bg-mint-500 hover:bg-mint-600 text-white"
        >
          Unirse a la cola
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4 animate-slideUp">
      {isCurrentUser ? (
        <Button
          onClick={handleConfirm}
          className="w-full bg-mint-500 hover:bg-mint-600 text-white"
        >
          Ya introduje mi plato
        </Button>
      ) : (
        <p className="text-center text-gray-500">
          Tu turno: {userNumber}
        </p>
      )}
      <Button
        onClick={handleCancel}
        variant="outline"
        className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
      >
        Cancelar turno
      </Button>
    </Card>
  );
}
