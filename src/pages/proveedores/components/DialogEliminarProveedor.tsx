import { eliminarProveedorApi } from "@/api/proveedoresApi/proveedoresApi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface DialogEliminarProveedorProps {
    id_proveedor: number;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    obtenerProveedores: () => void;
}

export default function DialogEliminarProveedor({ id_proveedor, isOpen, setIsOpen, obtenerProveedores }: DialogEliminarProveedorProps) {

    const eliminarProveedor = async () => {
        const response = await eliminarProveedorApi(id_proveedor);
        if (response.success) {
            setIsOpen(false);
            toast.success(response.message);
            obtenerProveedores();
        } else {
            toast.error(response.message);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Eliminar Proveedor</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de eliminar el proveedor con ID {id_proveedor}?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={eliminarProveedor}>Eliminar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
