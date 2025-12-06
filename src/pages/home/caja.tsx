


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { useListaProductos } from "@/contexts/listaProductos";
import { CreditCard, Minus, Pill, Plus, Scan, ShoppingCart, Trash2, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Reloj } from "./components/reloj";
import DialogConfirmVenta from "./components/dialogConfirmVenta";
import { useCliente } from "@/contexts/globalClient";
import AddCliente from "@/components/dialogAddCliente";
import { getProductoVenta } from "@/api/productosApi/productosApi";
import DialiogErrorProducto from "./Dialogs/noEncontrado";
import { useOutletContext } from "react-router";
import CarritoTabs from "@/components/carritoTabs";
import { Switch } from "@/components/ui/switch";

export default function Home() {

    const [idProducto, setidProducto] = useState<string>();
    const idSucursal = 1;
    const [metodoPago, setMetodoPago] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [openCliente, setOpenCliente] = useState(false);
    const [error, setError] = useState(false);

    const { clearCart, removeProduct, decrementQuantity, incrementQuantity, getTotalPrice, addProduct, getCarritoActivo, crearCarrito, carritoActivo, togglePrecioMayoreo } = useListaProductos();
    const { cliente } = useCliente();
    const { setFocusScanner } = useOutletContext<{ setFocusScanner: (fn: () => void) => void }>();

    const carritoActual = getCarritoActivo();

    // Crear un carrito por defecto si no existe carrito activo
    useEffect(() => {
        if (!carritoActivo) {
            crearCarrito("Venta Principal");
        }
    }, [carritoActivo, crearCarrito]);


    useHotkeys('alt+m', () => {
        console.log("Atajo Alt+B presionado desde react-hotkeys-hook");
        setOpenCliente(true);
    }, {
        enableOnFormTags: true
    }, [setOpenCliente]); // El array de dependencias es opcional pero recomendado

    useHotkeys('alt+0', () => {
        console.log("Atajo Alt+B presionado desde react-hotkeys-hook");
        setMetodoPago(0);
    }, {
        enableOnFormTags: true
    }, [setMetodoPago]); // El array de dependencias es opcional pero recomendado

    useHotkeys('alt+1', () => {
        console.log("Atajo Alt+B presionado desde react-hotkeys-hook");
        setMetodoPago(1);
    }, {
        enableOnFormTags: true
    }, [setMetodoPago]); // El array de dependencias es opcional pero recomendado

    useHotkeys('alt+p', () => {
        console.log("Atajo Alt+B presionado desde react-hotkeys-hook");
        setIsOpen(true);
    }, {
        enableOnFormTags: true
    }, [setIsOpen]); // El array de dependencias es opcional pero recomendado


    const focusInput = () => {
        setTimeout(() => {
            inputRef?.current?.focus();
        }, 100);
    };

    const buscarProducto = async (e: { preventDefault: () => void; }) => {
        e.preventDefault()
        if (idProducto) {
            const res = await getProductoVenta(idProducto, idSucursal)
            if (res.success) {
                console.log(res.data);
                addProduct(res.data[0]);
                setidProducto('');
                inputRef.current?.focus();
            } else {
                setError(true);
                setidProducto('');
                inputRef.current?.focus();
            }
        }

    }

    // LE PASAS EL CALLBACK AL LAYOUT
    useEffect(() => {
        setFocusScanner(() => focusInput);
    }, [setFocusScanner]);




    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 h-full">
            {/* Tabs de Carritos */}
            <div className="xl:col-span-2">
                <CarritoTabs />
            </div>

            {/* Scanner y Lista de Productos */}
            <div className="xl:col-span-2 space-y-4 flex flex-col">
                {/* Scanner de Código de Barras */}
                <Card className="shrink-0">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Scan className="w-5 h-5 text-primary" />
                            Scanner de Productos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form className="flex gap-2" onSubmit={buscarProducto}>
                            <div className="relative flex-1">
                                <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    ref={inputRef}
                                    placeholder="Escanear código de barras..."
                                    onChange={(e) => setidProducto(e.target.value)}
                                    value={idProducto || ''}
                                    className="pl-10 text-lg h-12"
                                    autoFocus
                                />
                            </div>
                            <Button type="submit" size="lg" className="px-6">
                                <Plus className="w-4 h-4 mr-2" />
                                Agregar
                            </Button>
                        </form>
                        <p className="text-sm text-muted-foreground mt-2">
                            Presiona Enter o haz clic en Agregar después de escanear
                        </p>
                    </CardContent>
                </Card>

                {/* Lista de Productos en el Carrito */}
                <Card className="flex-1 flex flex-col min-h-0">
                    <CardHeader className="pb-3 shrink-0">
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5" />
                                Productos ({carritoActual?.productos?.length ?? 0})
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    clearCart();
                                    inputRef.current?.focus();
                                }}
                                disabled={(carritoActual?.productos?.length ?? 0) === 0}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Limpiar
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                        <div className="h-full overflow-y-auto space-y-3">
                            {(carritoActual?.productos?.length ?? 0) === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No hay Productos en el carrito</p>
                                    <p className="text-sm">Escanea un código de barras para comenzar</p>
                                </div>
                            ) : (
                                carritoActual?.productos?.map((producto) => (
                                    <div key={producto.product.sku_presentacion} className="space-y-2 p-3 border rounded-lg">
                                        {/* Fila principal con información del producto */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                                <Pill className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{producto.product.nombre_producto}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    ${(producto.usarPrecioMayoreo ? producto.product.precio_mayoreo : producto.product.precio_venta).toFixed(2)} c/u
                                                </p>
                                            </div>
                                            <div className="text-right min-w-0">
                                                <p className="font-bold text-primary">${((producto.usarPrecioMayoreo ? producto.product.precio_mayoreo : producto.product.precio_venta) * producto.quantity).toFixed(2)}</p>
                                            </div>
                                        </div>

                                        {/* Fila de controles */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => decrementQuantity(producto.product.id_unidad_venta)}
                                                    className="w-8 h-8 p-0"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </Button>
                                                <span className="w-8 text-center font-medium">{producto.quantity}</span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => incrementQuantity(producto.product.id_unidad_venta)}
                                                    className="w-8 h-8 p-0"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>

                                            {/* Toggle Precio Mayoreo */}
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-medium text-muted-foreground">
                                                    Precio Mayoreo
                                                </label>
                                                <Switch
                                                    checked={producto.usarPrecioMayoreo || false}
                                                    onCheckedChange={() => togglePrecioMayoreo(producto.product.id_unidad_venta)}
                                                />
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    removeProduct(producto.product.id_unidad_venta)
                                                    inputRef.current?.focus();
                                                }}
                                                className="w-8 h-8 p-0 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Panel de Total y Pago */}
            <div className="xl:sticky xl:top-0 xl:h-full xl:overflow-y-auto space-y-4">
                {/* Total del Carrito */}
                <Card className="border-2 border-primary/20">
                    <CardContent className="p-6">
                        <div className="text-center space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">TOTAL A PAGAR</p>
                                <div className="text-6xl font-bold text-primary tabular-nums">
                                    ${getTotalPrice().toFixed(2)}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {carritoActual?.productos?.length ?? 0} producto{(carritoActual?.productos?.length ?? 0) !== 1 ? "s" : ""}
                                </p>
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
                                    <span>${(getTotalPrice()).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Botones de Acción */}
                <div className="space-y-3">

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant={"default"}
                            className={`h-12 ${metodoPago === 0
                                ? "bg-blue-500 text-white border-blue-600 shadow-lg"
                                : "bg-gray-200 text-gray-700 border-gray-300"}`}
                            disabled={(carritoActual?.productos?.length ?? 0) === 0}
                            tabIndex={2}
                            onClick={() => setMetodoPago(0)}
                        >
                            Efectivo(alt+0)
                        </Button>
                        <Button
                            className={`h-12 bg-transparent ${metodoPago === 1
                                ? "bg-blue-500 text-white border-blue-600 shadow-lg"
                                : "bg-gray-200 text-gray-700 border-gray-300 "}`}
                            disabled={(carritoActual?.productos?.length ?? 0) === 0}
                            tabIndex={3}
                            onClick={() => setMetodoPago(1)}
                        >
                            Tarjeta (alt+1)
                        </Button>
                    </div>

                    <Button className="w-full h-14 text-lg font-semibold"
                        disabled={(carritoActual?.productos?.length ?? 0) === 0}
                        onClick={() => setIsOpen(true)}
                        tabIndex={1}>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Procesar Pago (alt+p)
                    </Button>

                    <Button
                        variant="destructive"
                        className="w-full h-12"
                        onClick={() => clearCart()}
                        disabled={(carritoActual?.productos?.length ?? 0) === 0}
                        tabIndex={5}
                    >
                        Cancelar Venta (ESC)
                    </Button>
                </div>

                {/* Información del Cliente */}
                <Card>
                    <CardHeader className="">
                        <CardTitle className="text-base">Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="text-sm">
                            <div className="flex justify-between">
                                <div className="flex">
                                    <p className="font-medium mr-2">Nombre Cliente: </p>
                                    <span className="font-medium">{cliente.nombreCliente === "" ? "cliente General" : cliente.nombreCliente}</span>
                                </div>
                                <div>
                                    <Button variant={"destructive"} className="hover:cursor-pointer" >x</Button>
                                </div>
                            </div>
                            <p className="text-muted-foreground">{cliente.idCliente === "" ? "0000000" : cliente.idCliente}</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={() => {
                            setOpenCliente(true)
                        }}>
                            <Users className="w-4 h-4 mr-2" />
                            Buscar Clientes (alt+m)
                        </Button>
                    </CardContent>
                </Card>

                <div>
                    <Reloj></Reloj>
                </div>
            </div>

            <DialogConfirmVenta isOpen={isOpen} onClose={setIsOpen} metodoPago={metodoPago} inputRef={inputRef}></DialogConfirmVenta>
            <DialiogErrorProducto isOpen={error} setIsOpen={setError} inputRef={inputRef} ></DialiogErrorProducto>
            <AddCliente isOpen={openCliente} setIsOpen={setOpenCliente} inputRef={inputRef} ></AddCliente>

        </div>
    )
}