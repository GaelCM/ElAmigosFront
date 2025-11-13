import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
         <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" aria-label="content" >
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            ERROR
                        </DialogTitle>
                        <DialogDescription>
                            error
                        </DialogDescription>
                    </DialogHeader>
                    
                     <div className="flex flex-col items-center justify-center p-10 gap-4 text-center min-h-[200px]">
                        <CircleX width={60} height={60} className="text-blue-500" />
                        <h2 className="text-xl font-semibold text-gray-700">Producto no encontrado</h2>
                        <p className="text-gray-500">El código o nombre buscado no está registrado en el sistema.</p>
                    </div>
        </DialogContent>
        </Dialog>
    )
}