import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface DialogConfirmarCancelacionProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onConfirm: () => void;
    idTransferencia: number;
    loading?: boolean;
}

export default function DialogConfirmarCancelacion({
    isOpen,
    setIsOpen,
    onConfirm,
    idTransferencia,
    loading = false,
}: DialogConfirmarCancelacionProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-red-100 p-2 rounded-full">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-xl text-red-700">Confirmar Cancelación</DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-600 text-base py-2">
                        ¿Estás seguro de que deseas cancelar la <strong>Transferencia #{idTransferencia}</strong>?
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 my-2">
                    <p className="text-sm text-amber-700">
                        <strong>Atención:</strong> Si la transferencia ya fue enviada, el stock se devolverá automáticamente a la sucursal de origen. Esta acción no se puede deshacer.
                    </p>
                </div>

                <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={loading}
                        className="w-full sm:w-auto"
                    >
                        No, volver
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={loading}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Cancelando...
                            </>
                        ) : (
                            "Sí, cancelar transferencia"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
