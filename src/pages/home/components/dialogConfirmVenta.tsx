import { nuevaVentaApi } from "@/api/ventasApi/ventasApi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/contexts/currentUser";
import { useListaProductos } from "@/contexts/listaProductos";
import type { EstadoVenta } from "@/types/Venta";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useOnlineStatus } from "@/hooks/isOnline";
import { useHotkeys } from "react-hotkeys-hook";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";
import { redondearPrecio } from "@/lib/utils";


type dialogProps = {
    isOpen: boolean,
    onClose: (open: boolean) => void,
    inputRef?: React.RefObject<{ focus: () => void } | null>,
    metodoPago: number,
}


export default function DialogConfirmVenta({ isOpen, onClose, inputRef, metodoPago }: dialogProps) {

    const [estado, setEstado] = useState<EstadoVenta>("Inicio");
    const { getCarritoActivo, getTotalPrice, carritoActivo, eliminarCarrito } = useListaProductos();
    const { user } = useCurrentUser()
    const carritoActual = getCarritoActivo();
    const [cambioEfectivo, setCambioEfectivo] = useState(0); // Estado para manejar el cambio
    const turnoDataString = localStorage.getItem("openCaja") || "{}";
    const turnoData = JSON.parse(turnoDataString);
    const isOnline = useOnlineStatus();
    const [modoTurbo, setModoTurbo] = useState(() => localStorage.getItem("modo_turbo") === "true");

    useHotkeys("f1", () => {
        nuevaVenta(true);
    }, { enableOnFormTags: true, enabled: isOpen });
    useHotkeys("f2", () => {
        nuevaVenta(false);
    }, { enableOnFormTags: true, enabled: isOpen });


    const reloadVenta = async () => {
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

    const nuevaVenta = async (isImprimir: boolean) => {
        if (getCarritoActivo()?.productos.length == 0) {
            toast.error('Error en el pago', {
                description: `No hay productos en el carrito.`,
            });
            return;
        }
        // iniciar proceso
        if (cambioEfectivo < getTotalPrice() && metodoPago === 0) {
            toast.error('Error en el pago', {
                description: `El monto recibido es menor al total a pagar.`,
            });
            return;
        }
        setEstado("Cargando");
        try {

            const ventaFinal = {
                id_usuario: user.id_usuario,
                usuario: user.usuario,
                id_sucursal: user.id_sucursal,
                monto_recibido: cambioEfectivo,
                metodo_pago: metodoPago,
                productos: getCarritoActivo()?.productos || [],
                id_cliente: carritoActual?.cliente?.id_cliente.toLocaleString() || "",
                id_turno: turnoData.id_turno
            };
            console.log("Venta final a enviar:", ventaFinal);

            // SI MODO TURBO ESTA ACTIVO O NO HAY INTERNET, USAR RUTA LOCAL
            if (!isOnline || modoTurbo) {
                // LÓGICA OFFLINE / TURBO
                // @ts-ignore
                const offlineRes = await window["electron-api"]?.guardarVentaOffline(ventaFinal);
                if (offlineRes?.success) {
                    toast.success('Venta guardada localmente (Modo Offline)', {
                        description: `La venta se sincronizará automáticamente al detectar internet.`,
                    });

                    // Lógica de impresión (ESC/POS Offline)
                    try {
                        const printerName = localStorage.getItem("printer_device");
                        if (printerName) {
                            if (isImprimir) {
                                const ticketData = {
                                    printerName,
                                    sucursal: "Sucursal " + user.sucursal,
                                    id_sucursal: user.id_sucursal,
                                    usuario: user.usuario,
                                    cliente: carritoActual?.cliente?.nombre_cliente || "Público General",
                                    folio: "OFL-" + offlineRes.id,
                                    fecha: new Date(),
                                    productos: carritoActual?.productos?.map((p: any) => ({
                                        cantidad: p.quantity,
                                        nombre: p.product.nombre_producto,
                                        importe: redondearPrecio((p.usarPrecioMayoreo ? p.product.precio_mayoreo : p.product.precio_venta) * p.quantity)
                                    })) || [],
                                    total: getTotalPrice(),
                                    pagoCon: cambioEfectivo,
                                    cambio: Math.max(0, cambioEfectivo - getTotalPrice()),
                                    cortar: localStorage.getItem("printer_cut") !== "false"
                                };

                                // @ts-ignore
                                await window["electron-api"]?.printTicketVentaEscPos(ticketData);
                                toast.success("Ticket enviado a imprimir");
                            } else {
                                // @ts-ignore
                                await window["electron-api"]?.openCashDrawer(printerName);
                            }
                        } else {
                            toast.error("No se ha configurado una impresora en ajustes");
                        }
                    } catch (e) {
                        console.error("Error al imprimir ticket offline:", e);
                    }

                    setEstado("Listo");
                    return;
                } else {
                    throw new Error("No se pudo guardar la venta localmente");
                }
            }

            // LÓGICA ONLINE (Normal)
            const res = await nuevaVentaApi(ventaFinal);
            if (res?.success) {
                toast.success('Venta generada correctamente', {
                    description: `La venta se ha generado correctamente, FOLIO ${res.data}`,
                });

                // --- INICIO LÓGICA DE IMPRESIÓN (ESC/POS) ---
                try {
                    const printerName = localStorage.getItem("printer_device");
                    if (printerName) {
                        if (isImprimir) {
                            const ticketData = {
                                printerName,
                                sucursal: "Sucursal " + user.sucursal,
                                usuario: user.usuario,
                                cliente: carritoActual?.cliente?.nombre_cliente || "Público General",
                                folio: res.data || "S/N",
                                fecha: new Date(),
                                productos: carritoActual?.productos?.map((p: any) => ({
                                    cantidad: p.quantity,
                                    nombre: p.product.nombre_producto,
                                    importe: redondearPrecio((p.usarPrecioMayoreo ? p.product.precio_mayoreo : p.product.precio_venta) * p.quantity)
                                })) || [],
                                total: getTotalPrice(),
                                pagoCon: cambioEfectivo,
                                cambio: Math.max(0, cambioEfectivo - getTotalPrice()),
                                cortar: localStorage.getItem("printer_cut") !== "false"
                            };

                            // @ts-ignore
                            await window["electron-api"]?.printTicketVentaEscPos(ticketData);
                            toast.success("Ticket enviado a imprimir");
                        } else {
                            // @ts-ignore
                            await window["electron-api"]?.openCashDrawer(printerName);
                            toast.success("Venta finalizada (Sin ticket)");
                        }
                    }
                } catch (printError) {
                    console.error("Error al imprimir ticket ESC/POS:", printError);
                    toast.error("No se pudo imprimir el ticket", { duration: 2000 });
                }
                // --- FIN LÓGICA DE IMPRESIÓN ---

                setEstado("Listo");
            } else {
                console.error("Error del servidor al crear venta:", res);
                setEstado("Error");
            }
        } catch (error) {
            setEstado("Error");
            console.error("Error al procesar la venta:", error);
        }
    }


    return (
        <Dialog open={isOpen} onOpenChange={() => {
            if (estado === "Listo") {
                reloadVenta();
            } else {
                onClose(false);
                setTimeout(() => {
                    inputRef?.current?.focus();
                }, 100);
            }
        }}>
            <DialogContent className="sm:max-w-4xl p-12">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <DialogTitle className="text-2xl">Procesar Venta</DialogTitle>
                            <DialogDescription>Selecciona el método de pago para completar la venta</DialogDescription>
                        </div>
                        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-900/50">
                            <div className="flex flex-col items-end">
                                <Label htmlFor="modo-turbo" className="text-xs font-bold text-amber-700 dark:text-amber-500 flex items-center gap-1 uppercase">
                                    <Zap className="h-3 w-3 fill-current" />
                                    Modo Turbo
                                </Label>
                                <span className="text-[10px] text-amber-600/70">Ideal para internet lento</span>
                            </div>
                            <Switch
                                id="modo-turbo"
                                checked={modoTurbo}
                                onCheckedChange={(val) => {
                                    setModoTurbo(val);
                                    localStorage.setItem("modo_turbo", val.toString());
                                    if (val) {
                                        toast.info("Modo Turbo activado: Las ventas se procesarán localmente e instantáneamente.");
                                    }
                                }}
                            />
                        </div>
                    </div>
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



                            <div className="flex flex-col items-center gap-6 py-4">
                                <div className="text-center space-y-2">
                                    <h1 className="text-2xl font-black text-slate-500 uppercase tracking-widest">Pago en Efectivo</h1>
                                    <div className="relative">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-400">$</span>
                                        <input
                                            type="number"
                                            step="any"
                                            className="text-7xl text-center font-black w-full max-w-md py-6 px-12 bg-slate-50 border-4 border-slate-200 rounded-3xl focus:border-primary focus:ring-0 transition-all outline-none tabular-nums"
                                            placeholder="0.00"
                                            autoFocus
                                            onChange={(e) => setCambioEfectivo(Number(e.target.value))}
                                        />
                                    </div>
                                </div>

                                {cambioEfectivo > 0 && (
                                    <div className={`w-full max-w-md p-6 rounded-3xl border-4 transition-all animate-in zoom-in-95 duration-200 ${cambioEfectivo >= getTotalPrice()
                                        ? 'bg-green-50 border-green-200 text-green-700'
                                        : 'bg-red-50 border-red-200 text-red-700'
                                        }`}>
                                        <div className="flex flex-col items-center text-center gap-1">
                                            <span className="text-xs font-black uppercase tracking-widest opacity-70">
                                                {cambioEfectivo >= getTotalPrice() ? 'Su Cambio es de:' : 'Faltan:'}
                                            </span>
                                            <span className="text-5xl font-black tabular-nums">
                                                $ {Math.abs(cambioEfectivo - getTotalPrice()).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button onClick={() => nuevaVenta(true)} className="flex-1 bg-green-700" disabled={metodoPago === undefined}>
                                    Completar e imprimir ticket (F1)
                                </Button>
                                <Button onClick={() => nuevaVenta(false)} className="flex-1 bg-yellow-700" disabled={metodoPago === undefined}>
                                    Completar sin imprimir ticket (F2)
                                </Button>
                                <Button variant="destructive" onClick={() => onClose(false)} className="flex-1" >
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
                                <Button className="flex-1" onClick={() => nuevaVenta(true)}>
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