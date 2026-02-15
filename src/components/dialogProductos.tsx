import ProductTable from "./productTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

type props = {
    isOpen: boolean,
    setIsOpen: (isOpen: boolean) => void,
    idSucursal: number,
    inputRef?: React.RefObject<{ focus: () => void } | null>;
}

export default function DialogProducto({ isOpen, setIsOpen, idSucursal, inputRef }: props) {

    return (
        <Dialog open={isOpen} onOpenChange={() => {
            setIsOpen(false);
            setTimeout(() => {
                inputRef?.current?.focus();
            }, 100);
        }}>
            <DialogContent
                className="
                    p-0 
                    overflow-hidden 

                    /* WEB */
                    md:max-w-[1200px] 
                    md:w-[90vw] 
                    md:h-[90vh] 

                    /* MÓVIL (FULL SCREEN) */
                    max-w-[100vw] 
                    w-screen 
                    h-screen 
                    rounded-none
                "
            >
                {/* HEADER RESPONSIVE */}
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="text-lg md:text-xl">Buscar Producto</DialogTitle>
                </DialogHeader>

                {/* CONTENIDO SCROLLEABLE */}
                <div
                    className="
                        h-full 
                        overflow-auto 
                        px-3 
                        pb-4
                    "
                >
                    <ProductTable idSucursal={idSucursal} searchLocal={true} setIsOpen={setIsOpen} />
                </div>
            </DialogContent>
        </Dialog>
    );
}