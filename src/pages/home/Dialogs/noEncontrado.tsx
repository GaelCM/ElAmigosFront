import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CircleX } from "lucide-react";

type props = {
    isOpen: boolean,
    setIsOpen: (isOpen:boolean) => void,
    inputRef?: React.RefObject<{ focus: () => void } | null>;
}

export default function DialiogErrorProducto({isOpen,setIsOpen,inputRef}:props){
    return(
        <Dialog open={isOpen} onOpenChange={()=>{
            setIsOpen(false)
            setTimeout(() => {
                inputRef?.current?.focus();
                }, 100);     
            }    
            }>
         <DialogContent className="!top-auto !bottom-0 !left-0 !right-0 !translate-x-0 !translate-y-0 !max-w-full !rounded-t-3xl !rounded-b-none !border-0 max-h-[80dvh] overflow-y-auto sm:!top-1/2 sm:!left-1/2 sm:!bottom-auto sm:!right-auto sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:!max-w-2xl sm:!rounded-lg sm:!border sm:max-h-[90vh]" aria-label="content" >
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            ERROR
                        </DialogTitle>
                        <DialogDescription>
                            error
                        </DialogDescription>
                    </DialogHeader>
                    
                     <div className="flex flex-col items-center justify-center p-6 sm:p-10 gap-4 text-center min-h-[180px]">
                        <CircleX width={60} height={60} className="text-blue-500" />
                        <h2 className="text-xl font-semibold text-gray-700">Producto no encontrado</h2>
                        <p className="text-gray-500">El código o nombre buscado no está registrado en el sistema.</p>
                        <Button
                            className="w-full sm:w-auto h-12 sm:h-10 mt-2"
                            onClick={() => {
                                setIsOpen(false);
                                setTimeout(() => inputRef?.current?.focus(), 100);
                            }}
                        >
                            Entendido
                        </Button>
                    </div>
        </DialogContent>
        </Dialog>
    )
}