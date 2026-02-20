import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { obtenerReporteDetalleVenta } from "@/api/reportesApi/reportesApi";
import { cancelarProductoVentaApi } from "@/api/ventasApi/ventasApi";
import { useCurrentUser } from "@/contexts/currentUser";
import type { DetalleVentaItem } from "@/types/ReporteVentasT";
import {
    Package,
    ShoppingCart,
    Calendar,
    Tag,
    Hash,
    ChevronLeft,
    FileText,
    Layers,
    DollarSign,
    Printer,
    Trash2,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { redondearPrecio } from "@/lib/utils";


export default function DetalleVentaPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const idVenta = searchParams.get("id");
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<DetalleVentaItem[]>([]);
    const { user } = useCurrentUser();

    const fetchDetalle = async () => {
        if (!idVenta) return;
        try {
            setLoading(true);
            const response = await obtenerReporteDetalleVenta(Number(idVenta));
            if (response.success) {
                setItems(response.data);
            } else {
                toast.error(response.message || "Error al obtener el detalle de la venta");
            }
        } catch (error) {
            console.error("Error fetching sale detail:", error);
            toast.error("Error de conexión al servidor");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!idVenta) {
            toast.error("No se proporcionó un ID de venta");
            navigate(-1);
            return;
        }

        fetchDetalle();
    }, [idVenta, navigate]);

    const [dialogOpen, setDialogOpen] = useState<number | null>(null);
    const [cantidadACancelar, setCantidadACancelar] = useState<number>(1);

    const handleCancelarProducto = async (id_detalle: number, nombre: string) => {
        try {
            const res = await cancelarProductoVentaApi(id_detalle, user.id_usuario, cantidadACancelar);
            if (res.success) {
                toast.success(`Producto "${nombre}" ajustado exitosamente`);
                setDialogOpen(null);
                setCantidadACancelar(1); // Reset
                // Volver a cargar los datos para ver los totales actualizados
                await fetchDetalle();
            } else {
                toast.error(res.message || "Error al cancelar el producto");
            }
        } catch (error) {
            console.error("Error al cancelar producto:", error);
            toast.error("Error al procesar el ajuste");
        }
    }

    const totalVenta = redondearPrecio(items.reduce((acc, item) => acc + Number(item.subtotal), 0));
    const totalProductos = items.reduce((acc, item) => acc + Number(item.cantidad), 0);

    // Common sale data from the first item
    const saleInfo = items.length > 0 ? items[0] : null;

    const reimprimirTicket = async () => {
        if (!saleInfo) {
            toast.error("No hay información de la venta para imprimir");
            return;
        }

        try {
            const printerName = localStorage.getItem("printer_device");
            if (printerName) {
                const ticketData = {
                    printerName,
                    sucursal: saleInfo.nombre_sucursal ? "Sucursal " + saleInfo.nombre_sucursal : "Sucursal",
                    usuario: saleInfo.nombre_usuario,
                    cliente: saleInfo.id_cliente ? `ID Cliente: #${saleInfo.id_cliente}` : "Público General",
                    folio: saleInfo.id_venta,
                    fecha: saleInfo.fecha_venta ? new Date(saleInfo.fecha_venta) : new Date(),
                    productos: items?.map((p: any) => ({
                        cantidad: p.cantidad,
                        nombre: p.nombre_producto,
                        importe: p.subtotal
                    })) || [],
                    total: totalVenta,
                    pagoCon: saleInfo.monto_recibido,
                    cambio: Math.max(0, saleInfo.cambio || 0),
                    cortar: localStorage.getItem("printer_cut") !== "false"
                };

                // @ts-ignore
                await window["electron-api"]?.printTicketVentaEscPos(ticketData);
                toast.success("Ticket enviado a imprimir");
            } else {
                toast.error("No se ha configurado una impresora en ajustes");
            }
        } catch (e) {
            console.error("Error al reimprimir ticket:", e);
            toast.error("Error al conectar con la impresora");
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString('es-MX', {
            dateStyle: 'long',
            timeStyle: 'short'
        });
    };

    if (loading) {
        return (
            <div className="p-8 space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="rounded-full hover:bg-white dark:hover:bg-slate-900 shadow-sm transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">

                                Detalle de Venta
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                Registro de transacción #{idVenta}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button className=" text-black bg-yellow-500 hover:bg-yellow-600 hover:text-black cursor-pointer" onClick={reimprimirTicket} >
                                <Printer className="w-5 h-5 mr-2" />
                                Reimprimir Ticket
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-none">
                            <Hash className="w-3 h-3 mr-1" /> ID: {idVenta}
                        </Badge>
                        <Badge variant="outline" className="px-3 py-1 text-sm border-slate-200 dark:border-slate-800">
                            <Calendar className="w-3 h-3 mr-1" /> {formatDate(saleInfo?.fecha_venta)}
                        </Badge>
                    </div>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Sale General Info */}
                    <div className="md:col-span-2 bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-xl flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-6 text-indigo-500">
                            <FileText className="w-5 h-5" />
                            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Información General</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vendedor</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{saleInfo?.nombre_usuario || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sucursal</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{saleInfo?.nombre_sucursal || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Método Pago</p>
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none">
                                    {saleInfo?.metodo_pago_descripcion || "Efectivo"}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente ID</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">#{saleInfo?.id_cliente || "General"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Status Card */}
                    <div className={`${saleInfo?.estado_venta === 1 ? "bg-green-700" : "bg-red-700"}  p-6 rounded-3xl shadow-xl shadow-indigo-500/20 flex flex-col justify-between text-white`}>
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                <DollarSign className="w-6 h-6 text-white" />
                            </div>
                            <Badge className="bg-white/20 text-white border-none backdrop-blur-md">{saleInfo?.estado_venta === 1 ? "Completada" : "Cancelada"}</Badge>
                        </div>
                        <div className="mt-4">
                            <p className="text-white/60 text-sm font-medium">Total de la Venta</p>
                            <h3 className="text-3xl font-black">{formatCurrency(totalVenta)}</h3>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <CardKpi
                        title="Subtotal Total"
                        value={formatCurrency(totalVenta)}
                        icon={<DollarSign className="w-6 h-6 text-emerald-500" />}
                        description="Monto acumulado de los items"
                        variant="emerald"
                    />
                    <CardKpi
                        title="Cant. Artículos"
                        value={totalProductos}
                        icon={<ShoppingCart className="w-6 h-6 text-blue-500" />}
                        description="Unidades totales vendidas"
                        variant="blue"
                    />
                    <CardKpi
                        title="Recibido"
                        value={formatCurrency(redondearPrecio(saleInfo?.monto_recibido || 0))}
                        icon={<Tag className="w-6 h-6 text-amber-500" />}
                        description="Monto entregado por cliente"
                        variant="amber"
                    />
                    <CardKpi
                        title="Cambio"
                        value={formatCurrency(redondearPrecio(saleInfo?.cambio || 0))}
                        icon={<Layers className="w-6 h-6 text-purple-500" />}
                        description="Monto devuelto al cliente"
                        variant="purple"
                    />
                </div>

                {/* Table Section */}
                <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden backdrop-blur-xl">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-indigo-500" />
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Productos en la Venta</h2>
                        </div>
                        <span className="text-sm font-medium text-slate-500">{items.length} registros</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 font-semibold text-sm">Producto</th>
                                    <th className="px-6 py-4 font-semibold text-sm">Categoría</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-center">Cantidad</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-right">Precio Unit.</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-center">Tipo</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-right">Subtotal</th>
                                    {saleInfo?.estado_venta !== 0 && <th className="px-6 py-4 font-semibold text-sm text-center">Ajuste</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {items.map((item) => (
                                    <tr
                                        key={item.id_detalle_venta}
                                        className="group hover:bg-slate-50/80 dark:hover:bg-indigo-500/5 transition-colors duration-200"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shadow-sm">
                                                    <Package className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <span className="font-semibold text-slate-700 dark:text-slate-200">{item.nombre_producto}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="font-normal text-xs bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700">
                                                {item.nombre_categoria}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-medium text-slate-600 dark:text-slate-400">
                                                {item.cantidad} {item.nombre_unidad}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-slate-600 dark:text-slate-400">{formatCurrency(redondearPrecio(item.precio_unitario))}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.precio_mayoreo ? (
                                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none">Mayoreo</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-slate-500 dark:text-slate-500">Menudeo</Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(redondearPrecio(item.subtotal))}</span>
                                        </td>
                                        {saleInfo?.estado_venta !== 0 && (
                                            <td className="px-6 py-4 text-center">
                                                <Dialog
                                                    open={dialogOpen === item.id_detalle_venta}
                                                    onOpenChange={(open) => {
                                                        if (open) {
                                                            setDialogOpen(item.id_detalle_venta);
                                                            setCantidadACancelar(1); // Default to 1 to remove
                                                        } else {
                                                            setDialogOpen(null);
                                                        }
                                                    }}
                                                >
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 cursor-pointer hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-all duration-200"
                                                        >
                                                            REMOVER
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="rounded-3xl border-slate-200 dark:border-slate-800">
                                                        <DialogHeader>
                                                            <div className="flex items-center gap-3 text-red-600 mb-2">
                                                                <AlertCircle className="h-6 w-6" />
                                                                <DialogTitle className="text-xl">¿Ajustar Venta?</DialogTitle>
                                                            </div>
                                                            <DialogDescription className="text-slate-600 dark:text-slate-400 text-base">
                                                                Estás por devolver/cancelar el producto <span className="font-bold text-slate-900 dark:text-white">"{item.nombre_producto}"</span>.
                                                                <br />
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        <div className="py-4 space-y-4">
                                                            {Number(item.cantidad) > 1 ? (
                                                                <div className="flex flex-col gap-2">
                                                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                                        Cantidad a devolver (Max: {item.cantidad})
                                                                    </label>
                                                                    <div className="flex items-center gap-4">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => setCantidadACancelar(Math.max(1, cantidadACancelar - 1))}
                                                                            disabled={cantidadACancelar <= 1}
                                                                        >
                                                                            -
                                                                        </Button>
                                                                        <span className="text-xl font-bold w-12 text-center">{cantidadACancelar}</span>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => setCantidadACancelar(Math.min(Number(item.cantidad), cantidadACancelar + 1))}
                                                                            disabled={cantidadACancelar >= Number(item.cantidad)}
                                                                        >
                                                                            +
                                                                        </Button>
                                                                    </div>
                                                                    <p className="text-xs text-slate-500">
                                                                        Se restarán <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                                            {formatCurrency(redondearPrecio(Number(item.precio_unitario) * cantidadACancelar))}
                                                                        </span> del total.
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-slate-600 dark:text-slate-400">
                                                                    Se regresará el stock y se restará <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(redondearPrecio(item.subtotal))}</span> del total.
                                                                </p>
                                                            )}
                                                        </div>

                                                        <DialogFooter className="gap-2">
                                                            <Button variant="outline" onClick={() => setDialogOpen(null)} className="rounded-xl border-slate-200 dark:border-slate-800">Cancelar</Button>
                                                            <Button
                                                                onClick={() => handleCancelarProducto(item.id_detalle_venta, item.nombre_producto)}
                                                                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                                                            >
                                                                Confirmar Devolución
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {items.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                                <FileText className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400">No se encontraron productos para esta venta.</p>
                        </div>
                    )}

                    <div className="p-8 bg-slate-50/50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <div className="w-full md:w-80 space-y-4">
                            <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm">
                                <span>Subtotal</span>
                                <span className="font-medium">{formatCurrency(totalVenta)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 dark:text-slate-400 text-sm">
                                <span>Artículos totales</span>
                                <span className="font-medium">{totalProductos}</span>
                            </div>
                            <Separator className="bg-slate-200 dark:bg-slate-700" />
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-primary dark:text-white">Total</span>
                                <span className="text-3xl font-black text-primary dark:text-indigo-400">
                                    {formatCurrency(totalVenta)}
                                </span>
                            </div>
                            <div className="pt-4 space-y-2">
                                <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase">
                                    <span>Entrega</span>
                                    <span>Cambio</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(redondearPrecio(saleInfo?.monto_recibido || 0))}</span>
                                    <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(redondearPrecio(saleInfo?.cambio || 0))}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface CardKpiProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description: string;
    variant: 'emerald' | 'blue' | 'amber' | 'purple';
}

function CardKpi({ title, value, icon, description, variant }: CardKpiProps) {
    const borders = {
        emerald: "border-emerald-100 dark:border-emerald-900/20",
        blue: "border-blue-100 dark:border-blue-900/20",
        amber: "border-amber-100 dark:border-amber-900/20",
        purple: "border-purple-100 dark:border-purple-900/20",
    };

    const shadows = {
        emerald: "shadow-emerald-500/5",
        blue: "shadow-blue-500/5",
        amber: "shadow-amber-500/5",
        purple: "shadow-purple-500/5",
    };

    return (
        <div className={`bg-white dark:bg-slate-900/50 p-6 rounded-3xl border ${borders[variant]} shadow-lg ${shadows[variant]} backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{value}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-1">{description}</p>
            </div>
        </div>
    );
}
