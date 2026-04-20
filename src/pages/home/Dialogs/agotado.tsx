import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type props = {
    isOpen: boolean,
    setIsOpen: (isOpen: boolean) => void,
    inputRef?: React.RefObject<{ focus: () => void } | null>;
}

export default function DialogProductoAgotado({ isOpen, setIsOpen, inputRef }: props) {
    const handleClose = () => {
        setIsOpen(false);
        setTimeout(() => {
            inputRef?.current?.focus();
        }, 100);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader className="flex flex-col items-center gap-3 sm:text-center pt-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
                    </div>
                    <DialogTitle className="text-xl font-bold">¡Producto Agotado!</DialogTitle>
                    <DialogDescription className="text-center text-base">
                        El producto seleccionado ya no tiene <span className="font-semibold text-foreground">stock disponible</span>.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-center pb-2 pt-2">
                    <Button
                        variant="destructive"
                        onClick={handleClose}
                        className="w-full sm:w-32"
                    >
                        Entendido
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}