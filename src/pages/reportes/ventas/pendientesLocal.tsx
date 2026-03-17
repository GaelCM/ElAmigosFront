import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    RefreshCw,
    Trash2,
    Eye,
    AlertCircle,
    CheckCircle2,
    Clock,
    User,
    ShoppingCart,
    ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CarritoPayload } from "@/types/Venta";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { redondearPrecio } from "@/lib/utils";

interface VentaPendiente {
    id: number;
    fecha: string;
    venta: CarritoPayload;
}

export default function VentasPendientesLocal() {
    const [ventas, setVentas] = useState<VentaPendiente[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedVenta, setSelectedVenta] = useState<VentaPendiente | null>(null);

    const cargarVentas = async () => {
        setLoading(true);
        try {
            // @ts-ignore
            const res = await window["electron-api"]?.obtenerVentasPendientes();
            setVentas(res || []);
        } catch (error) {
            console.error("Error al cargar ventas pendientes:", error);
            toast.error("No se pudieron cargar las ventas locales");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarVentas();
    }, []);

    const calcularTotal = (payload: CarritoPayload) => {
        return redondearPrecio(payload.productos.reduce((acc, p) => {
            const precio = p.usarPrecioMayoreo ? p.product.precio_mayoreo : p.product.precio_venta;
            return acc + (precio * p.quantity);
        }, 0));
    };

    const eliminarVenta = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar esta venta pendiente? No se sincronizará con el servidor.")) return;

        try {
            // @ts-ignore
            const res = await window["electron-api"]?.eliminarVentaSincronizada(id);
            if (res.success) {
                toast.success("Venta eliminada localmente");
                cargarVentas();
            }
        } catch (error) {
            toast.error("Error al eliminar la venta");
        }
    };

    const sincronizarUna = async (v: VentaPendiente) => {
        try {
            const { nuevaVentaApi } = await import("@/api/ventasApi/ventasApi");
            const res = await nuevaVentaApi(v.venta);
            if (res?.success) {
                // @ts-ignore
                await window["electron-api"]?.eliminarVentaSincronizada(v.id);
                toast.success(`Venta ${v.id} sincronizada correctamente`);
                cargarVentas();
            } else {
                toast.error(`Error al sincronizar venta ${v.id}: ${res.message}`);
            }
        } catch (error) {
            toast.error(`Fallo de red al sincronizar venta ${v.id}`);
        }
    };

    const sincronizarTodo = async () => {
        if (ventas.length === 0) return;
        setIsSyncing(true);
        toast.info(`Iniciando sincronización de ${ventas.length} ventas...`);

        const { nuevaVentaApi } = await import("@/api/ventasApi/ventasApi");

        let exitosas = 0;
        let fallidas = 0;

        for (const v of ventas) {
            try {
                const res = await nuevaVentaApi(v.venta);
                if (res?.success) {
                    // @ts-ignore
                    await window["electron-api"]?.eliminarVentaSincronizada(v.id);
                    exitosas++;
                } else {
                    console.error(`Error en venta ${v.id}:`, res.message);
                    fallidas++;
                }
            } catch (err) {
                console.error(`Fallo crítico en venta ${v.id}:`, err);
                fallidas++;
            }
        }

        setIsSyncing(false);

        if (fallidas > 0) {
            toast.error(`Sincronización incompleta`, {
                description: `Éxito: ${exitosas} ventas | Fallos: ${fallidas} ventas. Revisa tu conexión o el detalle de las ventas.`,
                duration: 6000
            });
        } else if (exitosas > 0) {
            toast.success(`¡Todo sincronizado!`, {
                description: `${exitosas} ventas enviadas correctamente al servidor.`,
                duration: 5000
            });
        }

        cargarVentas();
    };

    return (
        <div className="container mx-auto py-8 px-4 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-4xl text-primary font-black tracking-tight flex items-center gap-3 uppercase">
                        <AlertCircle className="h-10 w-10 text-orange-500 animate-pulse" />
                        Ventas Pendientes
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium">
                        Ventas guardadas localmente esperando conexión a internet
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={cargarVentas}
                        disabled={loading || isSyncing}
                        className="font-bold border-2 hover:bg-primary/5"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar Lista
                    </Button>
                    <Button
                        onClick={sincronizarTodo}
                        disabled={loading || isSyncing || ventas.length === 0}
                        className="bg-orange-600 hover:bg-orange-700 font-bold text-white shadow-lg shadow-orange-600/20 px-8"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sincronizar Todo
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-l-4 border-l-orange-500 shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Pendientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-orange-600">
                            {ventas.length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium italic">
                            Requieren validación con el servidor
                        </p>
                    </CardContent>
                </Card>
                <Card className="md:col-span-2 border-2 border-primary/20 bg-primary/5">
                    <CardContent className="py-4 flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-2xl">
                            <Clock className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <p className="font-bold text-primary text-sm uppercase">Nota de Seguridad</p>
                            <p className="text-sm text-slate-600 leading-tight">
                                Estas ventas NO aparecen en los reportes globales hasta que se completen con éxito.
                                Si detectas un error permanente, puedes eliminarlas manualmente.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-xl border-none overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-black text-xs uppercase text-slate-500 py-4 px-6">ID Local</TableHead>
                                <TableHead className="font-black text-xs uppercase text-slate-500 py-4 px-6">Fecha/Hora</TableHead>
                                <TableHead className="font-black text-xs uppercase text-slate-500 py-4 px-6">Cliente</TableHead>
                                <TableHead className="font-black text-xs uppercase text-slate-500 py-4 px-6">Cajero</TableHead>
                                <TableHead className="font-black text-xs uppercase text-slate-500 py-4 px-6 text-right">Total</TableHead>
                                <TableHead className="font-black text-xs uppercase text-slate-500 py-4 px-6 text-center">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-muted-foreground font-bold">Buscando en base de datos local...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : ventas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-50">
                                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                                            <div className="space-y-1">
                                                <p className="text-xl font-black uppercase text-slate-700">¡Todo al día!</p>
                                                <p className="text-slate-500 font-medium">No hay ventas pendientes por sincronizar.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                ventas.map((v) => (
                                    <TableRow key={v.id} className="hover:bg-slate-50/80 transition-colors border-b last:border-0">
                                        <TableCell className="px-6 py-4 font-black">
                                            <Badge variant="outline" className="bg-slate-100 font-mono">
                                                LCL-{v.id}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 capitalize">
                                                    {format(new Date(v.fecha), "eeee dd 'de' MMM", { locale: es })}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(v.fecha), "HH:mm:ss")}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                                                    <User className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="font-bold text-slate-700">
                                                    {v.venta.id_cliente ? `Cliente #${v.venta.id_cliente}` : "Público General"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                {v.venta.usuario}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <span className="text-lg font-black text-primary tabular-nums">
                                                ${calcularTotal(v.venta).toFixed(2)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="font-bold h-9"
                                                    onClick={() => setSelectedVenta(v)}
                                                >
                                                    <Eye className="h-4 w-4 md:mr-2" />
                                                    <span className="hidden md:inline">Ver Detalle</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="font-bold h-9 border-orange-200 text-orange-600 hover:bg-orange-50"
                                                    onClick={() => sincronizarUna(v)}
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 h-9"
                                                    onClick={() => eliminarVenta(v.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal de Detalle */}
            <Dialog open={!!selectedVenta} onOpenChange={(open) => !open && setSelectedVenta(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl font-black uppercase">
                            <ShoppingCart className="h-6 w-6 text-primary" />
                            Detalle Venta Local #{selectedVenta?.id}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedVenta && (
                        <div className="space-y-6 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Cajero</p>
                                    <p className="font-bold text-slate-700">{selectedVenta.venta.usuario}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Turno ID</p>
                                    <p className="font-bold text-slate-700">#{selectedVenta.venta.id_turno}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest">
                                    Productos
                                    <ArrowRight className="h-3 w-3" />
                                </p>
                                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="font-bold text-xs">Cant.</TableHead>
                                                <TableHead className="font-bold text-xs">Producto</TableHead>
                                                <TableHead className="font-bold text-xs text-right">Precio</TableHead>
                                                <TableHead className="font-bold text-xs text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedVenta.venta.productos.map((p, idx) => {
                                                const precio = p.usarPrecioMayoreo ? p.product.precio_mayoreo : p.product.precio_venta;
                                                return (
                                                    <TableRow key={idx}>
                                                        <TableCell className="font-black text-primary">{p.quantity}</TableCell>
                                                        <TableCell className="font-medium text-slate-700 uppercase leading-tight min-w-[200px]">
                                                            {p.product.nombre_producto}
                                                            {p.usarPrecioMayoreo && <Badge className="ml-2 scale-75 bg-amber-500">M</Badge>}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-slate-500">${precio.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right font-black text-slate-700">${(precio * p.quantity).toFixed(2)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex justify-between items-center bg-primary/5 p-6 rounded-2xl border border-primary/10">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Total de la Venta</p>
                                    <p className="text-xs text-slate-400 font-medium">Incluye impuestos y descuentos</p>
                                </div>
                                <div className="text-4xl font-black text-primary tabular-nums">
                                    ${calcularTotal(selectedVenta.venta).toFixed(2)}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    className="flex-1 font-bold h-12 uppercase"
                                    variant="outline"
                                    onClick={() => setSelectedVenta(null)}
                                >
                                    Cerrar
                                </Button>
                                <Button
                                    className="flex-1 font-bold h-12 uppercase bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-600/30"
                                    onClick={() => {
                                        sincronizarUna(selectedVenta);
                                        setSelectedVenta(null);
                                    }}
                                >
                                    Sincronizar ahora
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}