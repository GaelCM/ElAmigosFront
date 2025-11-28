import { nuevaVentaApi } from "@/api/ventasApi/ventasApi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/contexts/currentUser";
import { useCliente } from "@/contexts/globalClient";
import { useListaProductos } from "@/contexts/listaProductos";
import type { EstadoVenta } from "@/types/Venta";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";


type dialogProps={
    isOpen: boolean,
    onClose: (open:boolean) => void,
    inputRef?: React.RefObject<{ focus: () => void } | null>,
    metodoPago: number,
}


export default function DialogConfirmVenta({isOpen,onClose,inputRef,metodoPago}:dialogProps){



    const [estado,setEstado]=useState<EstadoVenta>("Inicio");
    const {getCarritoActivo,getTotalPrice,carritoActivo,eliminarCarrito}=useListaProductos();
    const {cliente}=useCliente();
    const {user}=useCurrentUser()
    const carritoActual = getCarritoActivo();
    const [cambioEfectivo, setCambioEfectivo] = useState(0); // Estado para manejar el cambio

    const reloadVenta=async()=>{
        setCambioEfectivo(0);
        setEstado("Inicio");
        // Eliminar el carrito actual después de confirmar la venta
        if (carritoActivo) {
            eliminarCarrito(carritoActivo);
        }
        await onClose(false);
         // Usar setTimeout para asegurarnos que el focus se aplique después de que el diálogo se cierre
        setTimeout(() => {
          inputRef?.current?.focus();
        }, 100);  
    }

    const nuevaVenta=async ()=>{
        // iniciar proceso
        if(cambioEfectivo < getTotalPrice() && metodoPago === 0){
            toast.error('Error en el pago', {
                description:`El monto recibido es menor al total a pagar.`,});
            return;
        }
        setEstado("Cargando");
        try{
            
            const ventaFinal = {
                id_usuario: user.id_usuario,
                usuario: user.usuario,
                id_sucursal: user.id_sucursal,
                monto_recibido: cambioEfectivo,
                metodo_pago: metodoPago,
                productos: getCarritoActivo()?.productos || [],
                id_cliente: cliente.idCliente,
            };
            console.log("Venta final a enviar:", ventaFinal);
            const res = await nuevaVentaApi(ventaFinal);
            if (res?.success) {
                toast.success('Venta generada correctamente', {
                description:`La venta se ha generado correctamente, FOLIO ${res.data}`,});
                setEstado("Listo");
            } else {
                console.error("Error del servidor al crear venta:", res);
                setEstado("Error");
            }
        }catch(error){
            setEstado("Error");
            console.error("Error al procesar la venta:", error);
        }
    }


    return(
        <Dialog open={isOpen} onOpenChange={()=>{onClose(false);  setTimeout(() => {
          inputRef?.current?.focus();
        }, 100); }}>
            <DialogContent className="sm:max-w-4xl p-12">
                <DialogHeader>
                <DialogTitle className="text-2xl">Procesar Venta</DialogTitle>
                <DialogDescription>Selecciona el método de pago para completar la venta</DialogDescription>
                </DialogHeader>

                                <div className="space-y-6 py-4">
                                    {estado === "Inicio" && (
                                        <>
                                            {/* Summary */}
                                            <div className="space-y-3 p-4 bg-muted rounded-lg">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Productos</span>
                                                    <span className="font-medium">{carritoActual?.productos?.length ?? 0}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Cantidad total</span>
                                                    <span className="font-medium">{carritoActual?.productos?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}</span>
                                                </div>
                                                <Separator />
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold">Total a pagar</span>
                                                    <span className="text-2xl font-bold">${getTotalPrice().toFixed(2)}</span>
                                                </div>
                                            </div>

                                       

                                            <h1 className="text-4xl text-center p-2">PAGÓ CON:</h1>
                                            <div className="flex justify-center p-2">
                                                <input
                                                    type="text"
                                                    className="text-6xl text-center font-bold w-[50%] bg-blue-100 border-2 border-blue-600"
                                                    autoFocus
                                                    onChange={(e) => {
                                                        setCambioEfectivo(Number(e.target.value))
                                                    }}
                                                />
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-3">            
                                                <Button onClick={nuevaVenta} className="flex-1" disabled={metodoPago === undefined}>
                                                    Completar Venta
                                                </Button>
                                                <Button variant="outline" onClick={()=>onClose(false)} className="flex-1 bg-transparent" >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </>
                                    )}

                                    {estado === "Cargando" && (
                                        <div className="py-12 flex flex-col items-center justify-center gap-4">
                                            <div className="animate-spin">
                                                <Loader2 className="h-8 w-8 text-primary" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">Procesando la venta, por favor espera...</p>
                                        </div>
                                    )}

                                    {estado === "Listo" && (
                                        <div className="py-12 flex flex-col items-center justify-center gap-4">
                                            <div className="p-3 rounded-full bg-green-200 text-green-500">
                                                <Check className="h-18 w-18" />
                                            </div>
                                            <p className="text-xl font-semibold">Venta procesada</p>
                                                                <p className="text-sm text-muted-foreground">La venta se completó correctamente.</p>
                                                                {metodoPago === 0 && (
                                                                    <p className="text-6xl font-bold">Cambio: ${Math.max(0, (cambioEfectivo - getTotalPrice())).toFixed(2)}</p>
                                                                )}
                                            <div className="w-full flex gap-2 mt-4">
                                                <Button className="flex-1" autoFocus onClick={reloadVenta}>
                                                    Cerrar
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {estado === "Error" && (
                                        <div className="py-12 flex flex-col items-center justify-center gap-4">
                                            <div className="p-3 rounded-full bg-destructive/10 text-destructive">
                                                <AlertCircle className="h-8 w-8" />
                                            </div>
                                            <p className="text-xl font-semibold">Error al procesar</p>
                                            <p className="text-sm text-muted-foreground">Ocurrió un error al completar la venta. Intenta de nuevo.</p>
                                            <div className="w-full flex gap-2 mt-4">
                                                <Button variant="outline" className="flex-1" onClick={() => setEstado("Inicio")}>
                                                    Volver
                                                </Button>
                                                <Button className="flex-1" onClick={nuevaVenta}>
                                                    Reintentar
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
            </DialogContent>
        </Dialog>
    )

}