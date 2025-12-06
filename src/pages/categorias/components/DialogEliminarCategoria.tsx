import { eliminarCategoriaApi } from "@/api/categoriasApi/categoriasApi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface DialogEliminarCategoriaProps {
    id_categoria: number;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    obtenerCategorias: () => void;
}

export default function DialogEliminarCategoria({ id_categoria, isOpen, setIsOpen, obtenerCategorias }: DialogEliminarCategoriaProps) {

    const eliminarCategoria = async () => {
        try {
            const response = await eliminarCategoriaApi(id_categoria);
            if (response.success) {
                setIsOpen(false);
                toast.success(response.message);
                obtenerCategorias();
            } else {
                toast.error(response.message);
            }
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar la categoría");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Eliminar Categoría</DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de eliminar la categoría con ID {id_categoria}? Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={eliminarCategoria}>Eliminar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
