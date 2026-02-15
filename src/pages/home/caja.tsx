import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { useListaProductos } from "@/contexts/listaProductos";
import { CreditCard, Minus, Pill, Plus, RefreshCw, Scan, ShoppingCart, Trash2, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Reloj } from "./components/reloj";
import DialogConfirmVenta from "./components/dialogConfirmVenta";
import AddCliente from "@/components/dialogAddCliente";
import { getProductoVenta } from "@/api/productosApi/productosApi";
import DialiogErrorProducto from "./Dialogs/noEncontrado";
import { useOutletContext } from "react-router";
import CarritoTabs from "@/components/carritoTabs";
import { Switch } from "@/components/ui/switch";
import { useCurrentUser } from "@/contexts/currentUser";
import { useOnlineStatus } from "@/hooks/isOnline";
import { getProductos } from "@/api/productosApi/productosApi";
import { toast } from "sonner";
import DialogNuevoProductoTemp from "./components/dialogNuevoProductoTemp";
import { Badge } from "@/components/ui/badge";
import DialogSetGranel from "./components/dialogSetGranel";
import type { ProductoVenta } from "@/types/Producto";
import { redondearPrecio } from "@/lib/utils";


export default function Home() {
    const { user } = useCurrentUser();
    const [idProducto, setidProducto] = useState<string>();
    const [metodoPago, setMetodoPago] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [openCliente, setOpenCliente] = useState(false);
    const [error, setError] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [openNuevoProducto, setOpenNuevoProducto] = useState(false);

    // Estados para Granel
    const [openGranel, setOpenGranel] = useState(false);
    const [productoGranelPendiente, setProductoGranelPendiente] = useState<ProductoVenta | null>(null);

    const { clearCart, removeProduct, decrementQuantity, incrementQuantity, getTotalPrice, addProduct, getCarritoActivo, crearCarrito, carritoActivo, togglePrecioMayoreo, asignarClienteCarrito, desasignarClienteCarrito } = useListaProductos();
    const { setFocusScanner } = useOutletContext<{ setFocusScanner: (fn: () => void) => void }>();

    const carritoActual = getCarritoActivo();

    // Crear un carrito por defecto si no existe carrito activo
    useEffect(() => {
        if (!carritoActivo) {
            crearCarrito("Venta Principal");
        }
    }, [carritoActivo, crearCarrito]);


    useHotkeys('alt+m', () => {
        setOpenCliente(true);
    }, {
        enableOnFormTags: true
    }, [setOpenCliente]);

    useHotkeys('ctrl+p', () => {
        setOpenNuevoProducto(true);
    }, {
        enableOnFormTags: true
    }, [setOpenNuevoProducto]);

    useHotkeys('alt+0', () => {
        setMetodoPago(0);
    }, {
        enableOnFormTags: true
    }, [setMetodoPago]);

    useHotkeys('alt+1', () => {
        setMetodoPago(1);
    }, {
        enableOnFormTags: true
    }, [setMetodoPago]);

    useHotkeys('f12', () => {
        setIsOpen(true);
    }, {
        enableOnFormTags: true
    }, [setIsOpen]);


    // --- Accessibility & Keyboard Navigation Logic ---
    const [selectedIndex, setSelectedIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const prevLengthRef = useRef(0);

    // Auto-select and scroll when added
    useEffect(() => {
        const currentLength = carritoActual?.productos?.length ?? 0;
        if (currentLength > prevLengthRef.current) {
            setSelectedIndex(currentLength - 1);
            // Scroll to bottom immediately
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTo({
                        top: scrollRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 50);
        } else if (currentLength < prevLengthRef.current) {
            setSelectedIndex((prev) => Math.min(prev, currentLength - 1));
        }
        prevLengthRef.current = currentLength;
    }, [carritoActual?.productos?.length]);

    // Scroll selected into view (for keyboard navigation)
    useEffect(() => {
        const element = document.getElementById(`product-row-${selectedIndex}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [selectedIndex]);

    // Navigation Hotkeys
    useHotkeys('up', (e) => {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(0, prev - 1));
    }, { enableOnFormTags: true });

    useHotkeys('down', (e) => {
        e.preventDefault();
        setSelectedIndex(prev => Math.min((carritoActual?.productos?.length ?? 0) - 1, prev + 1));
    }, { enableOnFormTags: true }, [carritoActual?.productos?.length]);

    // Action Hotkeys
    useHotkeys('+, right', (e) => {
        if (idProducto) return;
        e.preventDefault();
        if (!carritoActual?.productos?.length) return;
        const prod = carritoActual.productos[selectedIndex];
        if (prod) incrementQuantity(prod.product.id_unidad_venta);
    }, { enableOnFormTags: true }, [selectedIndex, carritoActual, idProducto]);

    useHotkeys('-, left', (e) => {
        if (idProducto) return;
        e.preventDefault();
        if (!carritoActual?.productos?.length) return;
        const prod = carritoActual.productos[selectedIndex];
        if (prod) decrementQuantity(prod.product.id_unidad_venta);
    }, { enableOnFormTags: true }, [selectedIndex, carritoActual, idProducto]);

    useHotkeys('f11', (e) => {
        e.preventDefault();
        if (!carritoActual?.productos?.length) return;
        const prod = carritoActual.productos[selectedIndex];
        if (prod) togglePrecioMayoreo(prod.product.id_unidad_venta);
    }, { enableOnFormTags: true }, [selectedIndex, carritoActual]);
    // ------------------------------------------------


    const focusInput = () => {
        setTimeout(() => {
            inputRef?.current?.focus();
        }, 100);
    };

    const isOnline = useOnlineStatus();

    const buscarProducto = async (e: { preventDefault: () => void; }) => {
        e.preventDefault()
        if (!idProducto) return;

        try {
            // Intentar búsqueda local PRIMERO
            // @ts-ignore
            const localRes = await window["electron-api"]?.buscarProductoLocal(idProducto);

            if (localRes?.success && localRes.data.length > 0) {
                procesarProductoEncontrado(localRes.data[0]);
                setidProducto('');
                return;
            }

            // Si no está local y hay internet, buscar en API
            if (isOnline) {
                const res = await getProductoVenta(idProducto, user.id_sucursal)
                if (res.success) {
                    procesarProductoEncontrado(res.data[0]);
                    setidProducto('');
                } else {
                    setError(true);
                    setidProducto('');
                    inputRef.current?.focus();
                }
            } else {
                setError(true);
                setidProducto('');
                inputRef.current?.focus();
            }
        } catch (err) {
            console.error("Error en búsqueda de producto:", err);
            setError(true);
        }
    }

    const syncProducts = async () => {
        if (isOnline && user.id_sucursal) {
            try {
                const res = await getProductos(user.id_sucursal);
                if (res.success) {
                    // @ts-ignore
                    const syncRes = await window["electron-api"]?.sincronizarProductos(res.data);
                    if (syncRes?.success) {
                        toast.success(`Catálogo sincronizado: ${syncRes.count} productos.`);
                    }
                }
            } catch (err) {
                console.error("Error sincronizando catálogo:", err);
                toast.error("Error sincronizando catálogo.");
            }
        }
    };

    useEffect(() => {
        syncProducts();
    }, [isOnline, user.id_sucursal]);

    useEffect(() => {
        const updatePendingCount = async () => {
            // @ts-ignore
            const pending = await window["electron-api"]?.obtenerVentasPendientes();
            setPendingCount(pending?.length || 0);
        };

        let interval: any = null;

        if (isOnline) {
            const syncPendingSales = async () => {
                // @ts-ignore
                const pendingSales = await window["electron-api"]?.obtenerVentasPendientes();
                if (pendingSales && pendingSales.length > 0) {
                    toast.info(`Sincronizando ${pendingSales.length} ventas pendientes...`);
                    const { nuevaVentaApi } = await import("@/api/ventasApi/ventasApi");

                    for (const s of pendingSales) {
                        try {
                            const res = await nuevaVentaApi(s.venta);
                            if (res?.success) {
                                // @ts-ignore
                                await window["electron-api"]?.eliminarVentaSincronizada(s.id);
                            }
                        } catch (err) {
                            console.error("Error sincronizando venta individual:", err);
                        }
                    }
                    updatePendingCount();
                }
            };

            // Sincronizar al detectar internet o al montar
            syncPendingSales();

            // Sincronizar periódicamente cada 30 segundos si hay internet
            interval = setInterval(() => {
                syncPendingSales();
            }, 30000);

        } else {
            updatePendingCount();
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isOnline]);

    useEffect(() => {
        setFocusScanner(() => focusInput);
    }, [setFocusScanner]);

    const procesarProductoEncontrado = (producto: ProductoVenta) => {
        if (Boolean(producto.es_granel)) {
            setProductoGranelPendiente(producto);
            setOpenGranel(true);
        } else {
            addProduct(producto);
            inputRef.current?.focus();
        }
    };

    const handleConfirmGranel = (cantidad: number) => {
        if (productoGranelPendiente) {
            addProduct(productoGranelPendiente, cantidad);
        }
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 lg:gap-4 items-start p-4 lg:p-6">
            {/* Contenedor Principal Izquierdo */}
            <div className="xl:col-span-2 space-y-4 flex flex-col">
                {/* Tabs de Carritos */}
                <CarritoTabs />

                {/* Scanner y Lista de Productos */}
                <Card className="shrink-0 shadow-sm border-none bg-slate-50/50">
                    <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center gap-2">
                                <Scan className="w-4 h-4 text-primary" />
                                Scanner de Productos
                            </div>
                            <div className="flex items-center gap-3">
                                {pendingCount > 0 && (
                                    <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full animate-pulse font-bold">
                                        {pendingCount} Pendientes
                                    </span>
                                )}
                                {!isOnline ? (
                                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                                        OFFLINE
                                    </span>
                                ) : (
                                    <span className="text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></div>
                                        ONLINE
                                    </span>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] gap-1"
                                    onClick={() => syncProducts()}
                                    title="Actualizar productos (API)"
                                >
                                    actualizar
                                    <RefreshCw className={`h-3 w-3`} />
                                </Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <form className="flex gap-2" onSubmit={buscarProducto}>
                            <div className="relative flex-1">
                                <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    ref={inputRef}
                                    placeholder="Escanear código de barras..."
                                    onChange={(e) => setidProducto(e.target.value)}
                                    value={idProducto || ''}
                                    className="pl-10 text-base h-10 bg-white"
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" size="sm" className="px-5 h-10">
                                <Plus className="w-4 h-4 mr-2" />
                                Agregar
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="flex-1 flex flex-col min-h-[600px] shadow-sm border-none">
                    <CardHeader className="shrink-0 py-3 px-4">
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-base">
                                <ShoppingCart className="w-4 h-4 text-primary" />
                                Productos ({carritoActual?.productos?.length ?? 0})
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => {
                                    clearCart();
                                    inputRef.current?.focus();
                                }}
                                disabled={(carritoActual?.productos?.length ?? 0) === 0}
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                Limpiar
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <div
                            ref={scrollRef}
                            className="max-h-[calc(100vh-320px)] overflow-y-auto divide-y divide-slate-100"
                        >
                            {(carritoActual?.productos?.length ?? 0) === 0 ? (
                                <div className="text-center py-20 text-muted-foreground bg-slate-50/30">
                                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-medium">No hay Productos en el carrito</p>
                                    <p className="text-xs opacity-60">Escanea un código de barras para comenzar</p>
                                </div>
                            ) : (
                                carritoActual?.productos?.map((producto, index) => (
                                    <div
                                        key={producto.product.sku_presentacion}
                                        id={`product-row-${index}`}
                                        className={`flex flex-col gap-1 px-4 py-2 transition-colors cursor-pointer ${producto.usarPrecioMayoreo
                                            ? 'bg-yellow-200/60'
                                            : index === selectedIndex
                                                ? 'bg-primary/5'
                                                : 'hover:bg-slate-50'
                                            } ${index === selectedIndex ? 'ring-1 ring-inset ring-primary' : ''}`}
                                        onClick={() => setSelectedIndex(index)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="shrink-0 w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                                                        <Pill className="w-3.5 h-3.5 text-primary" />
                                                    </span>
                                                    <p className="font-bold text-sm truncate uppercase tracking-tight text-slate-700">{producto.product.nombre_producto}</p>
                                                    <Badge variant="outline" className={`h-4 text-[9px] px-1 font-bold ${producto.product.stock_disponible_presentacion == 0 ? 'border-red-500 text-red-600 bg-red-50/50' : producto.product.stock_disponible_presentacion <= 5 ? 'border-yellow-500 text-yellow-600 bg-yellow-50/50' : 'border-green-500 text-green-600 bg-green-50/50'}`}>
                                                        {producto.product.stock_disponible_presentacion} STOCK
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-black text-primary">
                                                    ${redondearPrecio((producto.usarPrecioMayoreo ? producto.product.precio_mayoreo : producto.product.precio_venta) * producto.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 ml-8">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-[10px] font-bold text-muted-foreground mr-1">
                                                    ${(producto.usarPrecioMayoreo ? producto.product.precio_mayoreo : producto.product.precio_venta).toFixed(2)} p/u
                                                </p>
                                                <div className="flex items-center bg-white border border-slate-200 rounded-md h-7 px-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            decrementQuantity(producto.product.id_unidad_venta);
                                                        }}
                                                        className="w-5 h-5 p-0 hover:bg-slate-100"
                                                    >
                                                        <Minus className="w-2.5 h-2.5" />
                                                    </Button>
                                                    <span className="min-w-[28px] text-center font-black text-xs text-slate-700">{producto.quantity}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            incrementQuantity(producto.product.id_unidad_venta);
                                                        }}
                                                        className="w-5 h-5 p-0 hover:bg-slate-100"
                                                    >
                                                        <Plus className="w-2.5 h-2.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase text-slate-400">Mayoreo</span>
                                                    <Switch
                                                        className="h-4 w-7 [&>span]:h-3 [&>span]:w-3"
                                                        checked={producto.usarPrecioMayoreo || false}
                                                        onCheckedChange={() => togglePrecioMayoreo(producto.product.id_unidad_venta)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeProduct(producto.product.id_unidad_venta)
                                                        inputRef.current?.focus();
                                                    }}
                                                    className="w-7 h-7 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Datos de la venta */}
            <div className="xl:sticky xl:top-6 space-y-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base text-primary flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Información del Cliente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="text-sm p-3 bg-muted/50 rounded-lg border">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Nombre</p>
                                    <p className="font-medium text-4xl">{carritoActual?.cliente?.nombre_cliente || "Cliente General"}</p>
                                    <p className="text-xs text-muted-foreground mt-1">ID: {carritoActual?.cliente?.id_cliente || "N/A"}</p>
                                </div>
                                {carritoActual?.cliente && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-destructive"
                                        onClick={() => carritoActual && desasignarClienteCarrito(carritoActual.id)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => setOpenCliente(true)}>
                            <Users className="w-4 h-4 mr-2" />
                            {carritoActual?.cliente ? "Cambiar Cliente" : "Asignar Cliente"} (alt+m)
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-2 border-primary/20 overflow-hidden">
                    <CardContent className="p-6 pt-8">
                        <div className="text-center space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Total a Pagar</p>
                                <div className="text-6xl font-black text-primary tabular-nums">
                                    ${getTotalPrice().toFixed(2)}
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal:</span>
                                    <span>${getTotalPrice().toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold">
                                    <span>Total:</span>
                                    <span>${getTotalPrice().toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant={"default"}
                            className={`h-12 ${metodoPago === 0 ? "bg-blue-500 text-white border-blue-600 shadow-lg" : "bg-gray-200 text-gray-700 border-gray-300"}`}
                            disabled={(carritoActual?.productos?.length ?? 0) === 0}
                            onClick={() => setMetodoPago(0)}
                        >
                            Efectivo(alt+0)
                        </Button>
                        <Button
                            className={`h-12 bg-transparent ${metodoPago === 1 ? "bg-blue-500 text-white border-blue-600 shadow-lg" : "bg-gray-200 text-gray-700 border-gray-300 "}`}
                            disabled={(carritoActual?.productos?.length ?? 0) === 0}
                            onClick={() => setMetodoPago(1)}
                        >
                            Tarjeta (alt+1)
                        </Button>
                    </div>

                    <Button className="w-full h-14 text-lg font-semibold"
                        disabled={(carritoActual?.productos?.length ?? 0) === 0}
                        onClick={() => setIsOpen(true)}>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Procesar Pago (F12)
                    </Button>

                    <Button
                        variant="destructive"
                        className="w-full h-12"
                        onClick={() => clearCart()}
                        disabled={(carritoActual?.productos?.length ?? 0) === 0}
                    >
                        Cancelar Venta (ESC)
                    </Button>
                </div>



                <Reloj />
            </div>

            <DialogConfirmVenta isOpen={isOpen} onClose={setIsOpen} metodoPago={metodoPago} inputRef={inputRef} />
            <DialiogErrorProducto isOpen={error} setIsOpen={setError} inputRef={inputRef} />
            <AddCliente
                isOpen={openCliente}
                setIsOpen={setOpenCliente}
                inputRef={inputRef}
                onSelect={(selectedCliente) => {
                    if (carritoActivo) {
                        asignarClienteCarrito(carritoActivo, selectedCliente);
                    }
                }}
            />
            <DialogNuevoProductoTemp isOpen={openNuevoProducto} setIsOpen={setOpenNuevoProducto} inputRef={inputRef} />
            <DialogSetGranel
                isOpen={openGranel}
                setIsOpen={setOpenGranel}
                producto={productoGranelPendiente}
                onConfirm={handleConfirmGranel}
                inputRefMain={inputRef}
            />
        </div>
    )
}

