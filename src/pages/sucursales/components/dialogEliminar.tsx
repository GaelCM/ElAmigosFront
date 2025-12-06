
import { eliminarSucursalApi } from "@/api/sucursalApi/sucursalApi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";



interface DialogEliminarSucursalProps {
    id_sucursal: number;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    obtenerSucursales: () => void;
}

export default function DialogEliminarSucursal({ id_sucursal, isOpen, setIsOpen, obtenerSucursales }: DialogEliminarSucursalProps) {

    const eliminarSucursal = async () => {
        const response = await eliminarSucursalApi(id_sucursal);
        if (response.success) {
            setIsOpen(false);
            toast.success(response.message);
            obtenerSucursales();
        } else {
            toast.error(response.message);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Eliminar Sucursal</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de eliminar esta sucursal {id_sucursal}?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={eliminarSucursal}>Eliminar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}